<script>
	import { onMount } from "svelte";
	import * as THREE from "three";
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
	import Blit from "./threeComponents/blit";
	import Bloom from "./threeComponents/bloom";
	import Glitch from "./threeComponents/glitch";
	import GammaAndTonemapping from "./threeComponents/gammaAndTonemapping";
	import Position from "./threeComponents/position";
	import DOF from "./threeComponents/dof";
	import { controls as GUIcontrols } from "./gui";
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

	import { ConvexObjectBreaker } from 'three/examples/jsm/misc/ConvexObjectBreaker';
	import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
	
	let canvasContainerEl;
	let customTonemapping = true;

	let scene = new THREE.Scene();
	scene.background = new THREE.Color(0.025, 0.025, 0.025);
	let camera = new THREE.PerspectiveCamera( 40, innerWidth / innerHeight, 0.1, 1000 );
	camera.position.set(0, 20, 40);
	let renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.physicallyCorrectLights = true;
	let controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0,0,0);
	renderer.setSize( innerWidth, innerHeight );

	if(customTonemapping) {
		// we'll do gamma correction & tonemapping ourselves as the last post-process step
		renderer.toneMapping    = THREE.NoToneMapping;
		renderer.outputEncoding = THREE.LinearEncoding; 
	} else {
		renderer.toneMapping    = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1;
		renderer.outputEncoding = THREE.sRGBEncoding; 
	}

	let renderTarget = new THREE.WebGLMultisampleRenderTarget(innerWidth, innerHeight, { 
		type: THREE.FloatType, 
		generateMipmaps: true, 
		magFilter: THREE.LinearFilter,
		minFilter: THREE.LinearMipMapLinearFilter 
	});
	let positionRenderTarget = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.FloatType });
	let postprocTarget1 = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.FloatType });
	let postprocTarget2 = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.FloatType });

	let clock = new THREE.Clock();
	clock.start();

	let bloomProgram;
	let gammaToneProgram;
	let glitchProgram;
	let positionProgram;
	let DOFProgram;

	onMount(() => {
		tokenizedStart();
	});

	function animate() {
		controls.update();

		updatePhysics(clock.getDelta());

		if(!customTonemapping) {
			renderer.setRenderTarget(null);
			renderer.render(scene, camera);
		} else {

			renderer.setRenderTarget(renderTarget);
			renderer.render(scene, camera);
			
			bloomProgram.threshold        = GUIcontrols.bloomThreshold;
			bloomProgram.softThreshold    = GUIcontrols.bloomSoftThreshold;
			bloomProgram.strength         = GUIcontrols.bloomStrength;
			bloomProgram.blurKernelOffset = GUIcontrols.bloomBlurKernelOffset;
			bloomProgram.compute(renderTarget, postprocTarget1);

			// apply tonemapping & gamma correction
			gammaToneProgram.exposure  = GUIcontrols.exposure;
			gammaToneProgram.compute(postprocTarget1, postprocTarget2);

			glitchProgram.strength         = GUIcontrols.glitchStrength;
			glitchProgram.bottomDistortion = GUIcontrols.glitchBottomDistortion;
			glitchProgram.compute(clock.getElapsedTime(), postprocTarget2, null);

			// gammaToneProgram.exposure = GUIcontrols.exposure;
			// gammaToneProgram.compute(postprocTarget1, null);
		}

	
		requestAnimationFrame(animate);
	}

	function onAmmoLoaded() {
		Ammo().then( function ( AmmoLib ) {
			Ammo = AmmoLib;
			tokenizedStart();
		});
	}

	let token = 0;
	function tokenizedStart() {
		token++;
		if(token < 2) return;

		initGraphics();
		initPhysics();
		initObjects();
		initInput();
	}


	const objectsToRemove = [];
	for ( let i = 0; i < 500; i ++ ) {
		objectsToRemove[ i ] = null;
	}
	let numObjectsToRemove = 0

	// Rigid bodies include all movable objects
	const rigidBodies = [];
	const gravityConstant = 7.8;
	const pos = new THREE.Vector3();
	const quat = new THREE.Quaternion();
	const margin = 0.05;
	const convexBreaker = new ConvexObjectBreaker();
	const mouseCoords = new THREE.Vector2();
	const raycaster = new THREE.Raycaster();
	const ballMaterial = new THREE.MeshPhongMaterial( { color: 0x202020 } );
	const impactPoint = new THREE.Vector3();
	const impactNormal = new THREE.Vector3();
	let collisionConfiguration, dispatcher, broadphase, solver, physicsWorld, transformAux1, tempBtVec3_1;

	function initGraphics() {
		canvasContainerEl.appendChild( renderer.domElement );

		bloomProgram     = new Bloom(renderer, camera, scene, { iterations: 5 });
		gammaToneProgram = new GammaAndTonemapping(renderer, { exposure: 1 });
		glitchProgram    = new Glitch(renderer);
		positionProgram  = new Position(renderer);
		DOFProgram       = new DOF(renderer);



		// let cubeMesh = new THREE.Mesh(
		// 	new THREE.BoxBufferGeometry(3, 3, 3), 
		// 	new THREE.MeshPhongMaterial({
		// 		roughness: 1, 
		// 		color: 0xffffff,
		// 		map: new THREE.TextureLoader().load("assets/landscape.jpg"), 
		// 	})
		// );
		// cubeMesh.position.set(0, 0, 0);
		// scene.add(cubeMesh);


		let light1 = new THREE.PointLight(0x3366ff, 100, 100); 
		light1.position.set(-25, 25, 25); 
		scene.add(light1);

		let light2 = new THREE.PointLight(0xff6633, 100, 100); 
		light2.position.set(+25, 25, 25);
		scene.add(light2);


		// request animation only when we're fully mounted
		requestAnimationFrame(animate);
	}

	function initPhysics() {
		collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
		broadphase = new Ammo.btDbvtBroadphase();
		solver = new Ammo.btSequentialImpulseConstraintSolver();
		physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
		physicsWorld.setGravity( new Ammo.btVector3( 0, - gravityConstant, 0 ) );

		transformAux1 = new Ammo.btTransform();
		tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 );
	}

	function initObjects() {
		pos.set( 0, - 0.5, 0 );
		quat.set( 0, 0, 0, 1 );
		const ground = createParalellepipedWithPhysics( 40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );

		for(let i = 0; i < 3; i++) {
			// Tower 1
			const towerMass = 1000;
			const towerHalfExtents = new THREE.Vector3( 2, 5, 2 );
			pos.set( -8 + i * 10, 5, 0 );
			quat.set( 0, 0, 0, 1 );
			createObject( towerMass, towerHalfExtents, pos, quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
		}
	}

	function createParalellepipedWithPhysics( sx, sy, sz, mass, pos, quat, material ) {
		const object = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
		const shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
		shape.setMargin( margin );

		createRigidBody( object, shape, mass, pos, quat );

		return object;
	}

	function createObject( mass, halfExtents, pos, quat, material ) {
		const object = new THREE.Mesh( new THREE.BoxGeometry( halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2 ), material );
		object.position.copy( pos );
		object.quaternion.copy( quat );
		convexBreaker.prepareBreakableObject( object, mass, new THREE.Vector3(), new THREE.Vector3(), true );
		createDebrisFromBreakableObject( object );
	}

	function createDebrisFromBreakableObject( object ) {
		const shape = createConvexHullPhysicsShape( object.geometry.attributes.position.array );
		shape.setMargin( margin );

		const body = createRigidBody( object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity );

		// Set pointer back to the three object only in the debris objects
		const btVecUserData = new Ammo.btVector3( 0, 0, 0 );
		btVecUserData.threeObject = object;
		body.setUserPointer( btVecUserData );
	}

	function createConvexHullPhysicsShape( coords ) {
		const shape = new Ammo.btConvexHullShape();

		for ( let i = 0, il = coords.length; i < il; i += 3 ) {
			tempBtVec3_1.setValue( coords[ i ], coords[ i + 1 ], coords[ i + 2 ] );
			const lastOne = ( i >= ( il - 3 ) );
			shape.addPoint( tempBtVec3_1, lastOne );
		}

		return shape;
	}

	function createRigidBody( object, physicsShape, mass, pos, quat, vel, angVel ) {

		if ( pos ) object.position.copy( pos );
		else pos = object.position;

		if ( quat ) object.quaternion.copy( quat );
		else quat = object.quaternion;

		const transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
		transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
		const motionState = new Ammo.btDefaultMotionState( transform );

		const localInertia = new Ammo.btVector3( 0, 0, 0 );
		physicsShape.calculateLocalInertia( mass, localInertia );

		const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
		const body = new Ammo.btRigidBody( rbInfo );

		body.setFriction( 0.5 );

		if ( vel ) {
			body.setLinearVelocity( new Ammo.btVector3( vel.x, vel.y, vel.z ) );
		}

		if ( angVel ) {
			body.setAngularVelocity( new Ammo.btVector3( angVel.x, angVel.y, angVel.z ) );
		}

		object.userData.physicsBody = body;
		object.userData.collided = false;

		scene.add( object );

		if ( mass > 0 ) {
			rigidBodies.push( object );
		
			// Disable deactivation
			body.setActivationState( 4 );
		}

		physicsWorld.addRigidBody( body );
		return body;
	}

	function initInput() {

		window.addEventListener( 'pointerdown', function ( event ) {
		
			mouseCoords.set(
				( event.clientX / window.innerWidth ) * 2 - 1,
				- ( event.clientY / window.innerHeight ) * 2 + 1
			);
		
			raycaster.setFromCamera( mouseCoords, camera );
		
			// Creates a ball and throws it
			const ballMass = 35;
			const ballRadius = 0.4;
		
			const ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 14, 10 ), ballMaterial );
			const ballShape = new Ammo.btSphereShape( ballRadius );
			ballShape.setMargin( margin );
			pos.copy( raycaster.ray.direction );
			pos.add( raycaster.ray.origin );
			quat.set( 0, 0, 0, 1 );
			const ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );
		
			pos.copy( raycaster.ray.direction );
			pos.multiplyScalar( 24 );
			ballBody.setLinearVelocity( new Ammo.btVector3( pos.x * 3, pos.y * 3, pos.z * 3 ) );
		
		});
	}

	function updatePhysics( deltaTime ) {

		// Step world
		physicsWorld.stepSimulation( deltaTime, 10 );

		// Update rigid bodies
		for ( let i = 0, il = rigidBodies.length; i < il; i ++ ) {
			const objThree = rigidBodies[ i ];
			const objPhys = objThree.userData.physicsBody;
			const ms = objPhys.getMotionState();
		
			if ( ms ) {
				ms.getWorldTransform( transformAux1 );
				const p = transformAux1.getOrigin();
				const q = transformAux1.getRotation();
				objThree.position.set( p.x(), p.y(), p.z() );
				objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
			
				objThree.userData.collided = false;
			}
		}

		for ( let i = 0, il = dispatcher.getNumManifolds(); i < il; i ++ ) {
			const contactManifold = dispatcher.getManifoldByIndexInternal( i );
			const rb0 = Ammo.castObject( contactManifold.getBody0(), Ammo.btRigidBody );
			const rb1 = Ammo.castObject( contactManifold.getBody1(), Ammo.btRigidBody );
		
			const threeObject0 = Ammo.castObject( rb0.getUserPointer(), Ammo.btVector3 ).threeObject;
			const threeObject1 = Ammo.castObject( rb1.getUserPointer(), Ammo.btVector3 ).threeObject;
		
			if ( ! threeObject0 && ! threeObject1 ) {
				continue;
			}
		
			const userData0 = threeObject0 ? threeObject0.userData : null;
			const userData1 = threeObject1 ? threeObject1.userData : null;
		
			const breakable0 = userData0 ? userData0.breakable : false;
			const breakable1 = userData1 ? userData1.breakable : false;
		
			const collided0 = userData0 ? userData0.collided : false;
			const collided1 = userData1 ? userData1.collided : false;
		
			if ( ( ! breakable0 && ! breakable1 ) || ( collided0 && collided1 ) ) {
				continue;
			}
		
			let contact = false;
			let maxImpulse = 0;
			for ( let j = 0, jl = contactManifold.getNumContacts(); j < jl; j ++ ) {
				const contactPoint = contactManifold.getContactPoint( j );
			
				if ( contactPoint.getDistance() < 0 ) {
					contact = true;
					const impulse = contactPoint.getAppliedImpulse();
				
					if ( impulse > maxImpulse ) {
						maxImpulse = impulse;
						const pos = contactPoint.get_m_positionWorldOnB();
						const normal = contactPoint.get_m_normalWorldOnB();
						impactPoint.set( pos.x(), pos.y(), pos.z() );
						impactNormal.set( normal.x(), normal.y(), normal.z() );
					}
				
					break;
				}
			}
		
			// If no point has contact, abort
			if ( ! contact ) continue;
		
			// Subdivision
			const fractureImpulse = 200;

			if ( breakable0 && !collided0 && maxImpulse > fractureImpulse ) {
			
				const debris = convexBreaker.subdivideByImpact( threeObject0, impactPoint, impactNormal, 1, 2, 1.5 );
			
				const numObjects = debris.length;
				for ( let j = 0; j < numObjects; j ++ ) {
					const vel = rb0.getLinearVelocity();
					const angVel = rb0.getAngularVelocity();
					const fragment = debris[ j ];
					fragment.userData.velocity.set( vel.x(), vel.y(), vel.z() );
					fragment.userData.angularVelocity.set( angVel.x(), angVel.y(), angVel.z() );
				
					createDebrisFromBreakableObject( fragment );
				}
			
				objectsToRemove[ numObjectsToRemove ++ ] = threeObject0;
				userData0.collided = true;
			}
		
			if ( breakable1 && ! collided1 && maxImpulse > fractureImpulse ) {
			
				const debris = convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal, 1, 2, 1.5 );
			
				const numObjects = debris.length;
				for ( let j = 0; j < numObjects; j ++ ) {
				
					const vel = rb1.getLinearVelocity();
					const angVel = rb1.getAngularVelocity();
					const fragment = debris[ j ];
					fragment.userData.velocity.set( vel.x(), vel.y(), vel.z() );
					fragment.userData.angularVelocity.set( angVel.x(), angVel.y(), angVel.z() );
				
					createDebrisFromBreakableObject( fragment );
				
				}
			
				objectsToRemove[ numObjectsToRemove ++ ] = threeObject1;
				userData1.collided = true;
			
			}
		
		}

		for ( let i = 0; i < numObjectsToRemove; i ++ ) {
			removeDebris( objectsToRemove[ i ] );
		}

		numObjectsToRemove = 0;
	}

	function removeDebris( object ) {
		scene.remove( object );
		physicsWorld.removeRigidBody( object.userData.physicsBody );
	}

</script>




<svelte:head>
	<script src="assets/ammo.wasm.js" on:load={onAmmoLoaded}></script>
</svelte:head>

<div bind:this={canvasContainerEl}></div>



<style>
	:global(html, body) {
		width: 100%;
		height: 100%;
		overflow: hidden;
		margin: 0;
		padding: 0;
	}
</style>