import * as THREE from "./dependencies/three.module.js";
import { standardMaterial_fs, standardMaterial_vs } from "./shaders/standardMaterial.js";
import { litStatueMaterial_fs, litStatueMaterial_vs } from "./shaders/litStatueMaterial.js";
import { OBJLoader } from "./dependencies/OBJLoader.js";
import { ConvexObjectBreaker } from './dependencies/ConvexObjectBreaker.js';
import { ConvexGeometry } from './dependencies/ConvexGeometry.js';
import { scene, camera } from "./main.js";

let sceneType = 0;
let cornellBGreenMat;
let perlinNoiseEmissiveMaterial;
let emissiveTestMaterial;
let testMaterial;

let testWhiteMaterial = new THREE.ShaderMaterial({
    uniforms: {
        "uEmissive": { value: new THREE.Vector3(0,0,0) },
        "uAlbedo": { value: new THREE.Vector3(1,1,1) },
        "uRoughness": { value: 1 },
        "uStep": { value: 0 },
    },
    fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
});

let testDarkMaterial = new THREE.ShaderMaterial({
    uniforms: {
        "uEmissive": { value: new THREE.Vector3(0,0,0) },
        "uAlbedo": { value: new THREE.Vector3(0.01, 0.01, 0.01) },
        "uRoughness": { value: 1 },
        "uStep": { value: 0 },
    },
    fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
});

let testPastel1Material = new THREE.ShaderMaterial({
    uniforms: {
        "uEmissive": { value: new THREE.Vector3(0,0,0) },
        "uAlbedo": { value: new THREE.Vector3(1.0, 0.4, 0.25) },
        "uRoughness": { value: 1 },
        "uStep": { value: 0 },
    },
    fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
});
let testPastel2Material = new THREE.ShaderMaterial({
    uniforms: {
        "uEmissive": { value: new THREE.Vector3(0,0,0) },
        "uAlbedo": { value: new THREE.Vector3(0.25, 0.4, 1.0) },
        "uRoughness": { value: 1 },
        "uStep": { value: 0 },
    },
    fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
});
let testPastel3Material = new THREE.ShaderMaterial({
    uniforms: {
        "uEmissive": { value: new THREE.Vector3(0,0,0) },
        "uAlbedo": { value: new THREE.Vector3(0.25, 1.0, 0.4) },
        "uRoughness": { value: 1 },
        "uStep": { value: 0 },
    },
    fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
});

function createScene(scene) {
    let em = 10;
    emissiveTestMaterial = new THREE.ShaderMaterial({
        uniforms: {
            // "uEmissive": { value: new THREE.Vector3(0.5 * em, 0.4 * em, 0.3 * em) },
            "uEmissive": { value: new THREE.Vector3(0.5 * em, 0.3 * em, 0.1 * em) },
            "uAlbedo": { value: new THREE.Vector3(1,1,1) },
            "uRoughness": { value: 1 },
            "uStep": { value: 0 },
        },
        fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    });

    let culledTestMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uEmissive": { value: new THREE.Vector3(0,0,0) },
            "uAlbedo": { value: new THREE.Vector3(1,1,1) },
            "uRoughness": { value: 1 },
            "uStep": { value: 0 },
        },
        fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.BackSide,
    });

    perlinNoiseEmissiveMaterial = new THREE.ShaderMaterial({ uniforms: { 
            "uEmissive": { value: new THREE.Vector3(0,0,0) },
            "uAlbedo": { value: new THREE.Vector3(1,1,1) }, 
            "uStep": { value: 0 }, 
            "uTime": { value: 0 }, 
            "uRoughness": { value: 0 },
        }, fragmentShader: litStatueMaterial_fs, vertexShader: litStatueMaterial_vs, side: THREE.DoubleSide,
    });

    testMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uEmissive": { value: new THREE.Vector3(0,0,0) },
            "uAlbedo": { value: new THREE.Vector3(1,1,1) },
            "uRoughness": { value: 1 },
            "uStep": { value: 0 },
        },
        fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    });

    
    
    // window.cornellBoxMesh  = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), culledTestMaterial);
    // scene.add(cornellBoxMesh);


    // window.sphereMesh  = new THREE.Mesh(new THREE.SphereBufferGeometry(5, 20, 20), new THREE.ShaderMaterial({
    //     uniforms: {
    //         "uEmissive": { value: new THREE.Vector3(0,0,0) },
    //         "uAlbedo": { value: new THREE.Vector3(1,1,1) },
    //         "uRoughness": { value: 0 },
    //         "uStep": { value: 0 },
    //     },
    //     fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    // }));
    // scene.add(sphereMesh);

    
    // window.lightBoxMesh1 = new THREE.Mesh(new THREE.BoxGeometry(48, 0.1, 48), new THREE.ShaderMaterial({
    //     uniforms: {
    //         "uEmissive": { value: new THREE.Vector3(10,10,10) },
    //         "uAlbedo": { value: new THREE.Vector3(1,1,1) },
    //         "uRoughness": { value: 0 },
    //         "uStep": { value: 0 },
    //     },
    //     fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    // }));
    // lightBoxMesh1.rotation.x = Math.PI * 0.5;
    // lightBoxMesh1.position.set(0, +34.9, -40);
    // lightBoxMesh1.userData = {
    //     physicsBody: {
    //         mass: 100
    //     }
    // };

    // scene.add(lightBoxMesh1);




    // window.boxes = [];
    // for(let j = 0; j < 50 /*80*/; j++) {
    //     let r = Math.random();
    //     let g = r; // * 0.6 + Math.random() * 0.4; // Math.random();
    //     let b = r; // * 0.6 + Math.random() * 0.4; // Math.random();

    //     let roughnss = Math.random() > 0.75 ? 0 : 1;
    //     let emss     = Math.random() > 0.95 ? new THREE.Vector3(r * em,g * em,b * em) : new THREE.Vector3(0,0,0); 

    //     emss = new THREE.Vector3(0,0,0);
    //     // let ra = Math.random();
    //     // if (ra < 0.2) {
    //     //     emss = new THREE.Vector3(10,1,1);
    //     // }
    //     // if(ra < 0.1) {
    //     //     emss = new THREE.Vector3(1,10,1);
    //     // }

    //     // let emss     = new THREE.Vector3(0,0,0);  
    //     let testMaterial = new THREE.ShaderMaterial({
    //         uniforms: {
    //             "uEmissive": { value: emss },
    //             "uAlbedo": { value: new THREE.Vector3(r,g,b) },
    //             "uRoughness": { value: roughnss },
    //             "uStep": { value: 0 },
    //         },
    //         fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    //     });

    //     for(let i = 0; i < 2; i++) {
    //         let size1 = Math.random() * 1.1 + 0.1;
    //         let size2 = Math.random() * 1.1 + 0.1;
    //         let size3 = Math.random() * 1.1 + 0.1;

    //         let box = new THREE.Mesh(new THREE.BoxGeometry(size1, size2, size3), testMaterial);
    //         box.position.set(
    //             (Math.random() * 2 - 1) * 5,
    //             (Math.pow(Math.random(), 4.0) * 3.5) - 4.5,
    //             (Math.random() * 2 - 1) * 5,
    //         );
    //         box.rotXSpeed    = Math.pow(Math.random(), 2.0) * 0.02;
    //         box.rotYSpeed    = Math.pow(Math.random(), 2.0) * 0.02;
    //         box.rotZSpeed    = Math.pow(Math.random(), 2.0) * 0.02;
            
    //         box.translXSpeed = Math.random() * 0.02;
    //         box.translYSpeed = Math.random() * 0.02;
    //         box.translZSpeed = Math.random() * 0.02;
    
    //         box.basePosition = [box.position.x, box.position.y, box.position.z];
    //         boxes.push(box);

    //         scene.add(box);
    //     }
    // }

    // let cornellBRedMat = new THREE.ShaderMaterial({ uniforms: { "uEmissive": { value: new THREE.Vector3(0,0,0) },
    //             "uAlbedo": { value: new THREE.Vector3(1,0.1,0.2) }, "uStep": { value: 0 }, "uRoughness": { value: 1 },
    //     }, fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.BackSide,
    // });
    // cornellBGreenMat = new THREE.ShaderMaterial({ uniforms: { "uEmissive": { value: new THREE.Vector3(0,0,0) },
    //         "uAlbedo": { value: new THREE.Vector3(0.1,1,0.2) }, "uStep": { value: 0 }, "uRoughness": { value: 1 },
    //     }, fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.BackSide,
    // });
    // window.cbox1 = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10), cornellBRedMat);
    // cbox1.position.set(+4.9975, 0, 0);
    // cbox1.rotation.y = Math.PI * 0.5;
    // scene.add(cbox1);
    
    // window.cbox2 = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10), cornellBGreenMat);
    // cbox2.position.set(-4.9975, 0, 0);
    // cbox2.rotation.y = -Math.PI * 0.5;
    // scene.add(cbox2);

    // window.cbox4 = new THREE.Mesh(
    //     new THREE.PlaneBufferGeometry(100, 100), 
    //     new THREE.ShaderMaterial({ uniforms: { "uEmissive": { value: new THREE.Vector3(0,0,0) },
    //         "uAlbedo": { value: new THREE.Vector3(1,1,1) }, "uStep": { value: 0 }, "uRoughness": { value: 1 },
    //         }, fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.BackSide,
    //     })
    // );
    // cbox4.position.set(0, -5, 0);
    // cbox4.rotation.x = Math.PI * 0.5;
    // scene.add(cbox4);

    // window.cbox3 = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10), new THREE.ShaderMaterial({ uniforms: { "uEmissive": { value: new THREE.Vector3(0,0,0) },
    // "uAlbedo": { value: new THREE.Vector3(1,1,1) }, "uStep": { value: 0 }, "uRoughness": { value: 0 },
    // }, fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.BackSide,
    // }));
    // cbox3.position.set(0, -4.9975, 0);
    // cbox3.rotation.x = Math.PI * 0.5;
    // scene.add(cbox3);

    // cbox2.material = perlinNoiseEmissiveMaterial;
    // perlinNoiseEmissiveMaterial.side = THREE.BackSide;



    // const loader = new OBJLoader();

    // // load a resource
    // loader.load(
    //     // resource URL
    //     'assets/models/archangel2.obj',
    //     // called when resource is loaded
    //     function ( object ) {
    //         let mesh = object.children[0];
    //         window.mesh2 = mesh.clone();


    //         mesh.material = new THREE.ShaderMaterial({ uniforms: { 
    //                 "uEmissive": { value: new THREE.Vector3(0,0,0) },
    //                 "uAlbedo": { value: new THREE.Vector3(0.81,0.81,0.81) }, 
    //                 "uStep": { value: 0 }, 
    //                 "uRoughness": { value: 0 },
    //             }, fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    //         });
    //         mesh.rotateY(-0.635);
    //         mesh.scale.set(-1, 1, 1);
    //         mesh.position.set(-2, -5, -3);
    //         scene.add( mesh );


    //         mesh2.material = new THREE.ShaderMaterial({ uniforms: { 
    //                 "uEmissive": { value: new THREE.Vector3(0,0,0) },
    //                 "uAlbedo": { value: new THREE.Vector3(1,1,1) }, 
    //                 "uStep": { value: 0 }, 
    //                 "uRoughness": { value: 1 },
    //             }, fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    //         });
    //         // mesh2.material = perlinNoiseEmissiveMaterial
    //         mesh2.rotateY(+0.635);
    //         mesh2.position.set(+2, -5, -3);
    //         scene.add( mesh2 );
    //     },
    //     // called when loading is in progresses
    //     function ( xhr ) {
    //         console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    //     },
    //     // called when loading has errors
    //     function ( error ) {
    //         console.log( 'An error happened' );
    //     }
    // );


    // for(let i = 0; i < 2; i++) {

    //     let rotX = Math.random() * Math.PI;
    //     let rotY = Math.random() * Math.PI;

    //     let r = Math.random() * 60;
    //     let g = Math.random() * 60;
    //     let b = Math.random() * 60;

    //     let rad = Math.random() * 3 * 12 + 5 * 12;

    //     const geometry = new THREE.TorusGeometry( rad, 36.5, 16, 100 );
    //     const torus = new THREE.Mesh( geometry, new THREE.ShaderMaterial({
    //         uniforms: {
    //             "uEmissive": { value: new THREE.Vector3(r, g, b) },
    //             "uAlbedo": { value: new THREE.Vector3(1,1,1) },
    //             "uRoughness": { value: 1 },
    //             "uStep": { value: 0 },
    //         },
    //         fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    //     }));

    //     torus.rotation.x = rotX;
    //     torus.rotation.y = rotY;

    //     torus.userData = {
    //         physicsBody: {
    //             mass: 100
    //         }
    //     };

    //     scene.add( torus );
    // }



    window.addEventListener("keypress", (e) => {
        if(e.key == "e") {
            sceneSwitch(scene);
        }
        if(e.key == "r") {
            switchLights();
        }
    });
}

function updateScene(now, scene, deltatime) {
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES
    for(let i = 0; i < scene.children.length; i++) {
        scene.children[i].oldWorldMatrix = scene.children[i].matrixWorld.clone();
    }
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES

    let toRemove = [];
    for(let i = 0; i < scene.children.length; i++) {
        let object = scene.children[i];
        let y_position = object.position.y;
        let bs_radius = object.geometry.boundingSphere?.radius || 999;
        let expired_ball = object.isBall && (new Date() - object.ballTimeStamp > 2000);

        if(expired_ball) {
            console.log("removing ball");
        }

        if(y_position < -40 || (bs_radius < 3.6 && !object.isBall) || expired_ball) {
        // if(object.position.y < -40 || (object.userData.physicsBody.mass > 0.0001 && object.userData.physicsBody.mass < 10)) {
            toRemove.push(object);
        }
    }
    for(let i = 0; i < toRemove.length; i++) {
        console.log("removing debris");
        removeDebris(toRemove[i]);
    }

    // let maxObjects = 400;
    // if(scene.children.length > maxObjects) {
    //     let ordered = [...scene.children];

    //     ordered.sort((a, b) => {
    //         let a_w = (a.geometry.boundingSphere?.radius || 999);
    //         let b_w = (b.geometry.boundingSphere?.radius || 999);

    //         if(a.isBall) a_w = 999;
    //         if(b.isBall) b_w = 999;

    //         return a_w - b_w;
    //     });
    
    //     let howManyToRemove = scene.children.length - maxObjects;
    //     for(let i = 0; i < howManyToRemove; i++) {
    //         removeDebris(ordered[i]);
    //     }
    // }




    if(physicsWorld) {
        updatePhysics(deltatime);
    }

    // if(sceneType === 1) {
    //     cbox2.material.uniforms.uTime.value = now;
    // }
}

window.addEventListener("keypress", (e) => {
    if(e.key == "t") {
        let toRemove = [];
        for(let i = 0; i < scene.children.length; i++) {
            let object = scene.children[i];
            if((object.userData.physicsBody.mass > 0.0001 && object.userData.physicsBody.mass < 20)) {
                toRemove.push(object);
            }
        }
        for(let i = 0; i < toRemove.length; i++) {
            console.log("removing debris");
            removeDebris(toRemove[i]);
        }
    }
});

function sceneSwitch(scene) {
    sceneType = (sceneType + 1) % 2;

    if(sceneType === 1) {
        cbox2.material = perlinNoiseEmissiveMaterial;
        perlinNoiseEmissiveMaterial.side = THREE.BackSide;
        scene.remove(lightBoxMesh1);
        for(let i = 0; i < window.boxes.length; i++) {
            if(!window.boxes[i].material.uniforms.uEmissiveRef) {
                window.boxes[i].material.uniforms.uEmissiveRef = { value: window.boxes[i].material.uniforms.uEmissive.value.clone() };
            }
            window.boxes[i].material.uniforms.uEmissive.value = new THREE.Vector3(0,0,0);
        }
    } else {
        scene.add(lightBoxMesh1);
        cbox2.material = cornellBGreenMat;
        
        for(let i = 0; i < window.boxes.length; i++) {
            window.boxes[i].material.uniforms.uEmissive.value = window.boxes[i].material.uniforms.uEmissiveRef.value.clone();
        }
    }
}

let noLights = true;
function switchSceneLights() {
    noLights = !noLights;

    if(!noLights) {
        lightBoxMesh1.material = testMaterial;
    } else {
        lightBoxMesh1.material = emissiveTestMaterial;
    }

    for(let i = 0; i < window.boxes.length; i++) {
        let emss = new THREE.Vector3(0,0,0);
        let ra = Math.random();
        let strength = 24;
        if(ra < 0.15) {
            emss = new THREE.Vector3(Math.random() * strength, Math.random() * strength, Math.random() * strength);
        }

        if(noLights) {
            emss = new THREE.Vector3(0,0,0);
        }

        window.boxes[i].material.uniforms.uEmissive.value = emss;
    }

}


















// function onAmmoLoaded() {
    Ammo().then( function ( AmmoLib ) {
        Ammo = AmmoLib;
        tokenizedStart();
    });
// }

let token = 0;
function tokenizedStart() {
    token++;
    if(token < 1) return;

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
const ballMaterial = testDarkMaterial;
const impactPoint = new THREE.Vector3();
const impactNormal = new THREE.Vector3();
let collisionConfiguration, dispatcher, broadphase, solver, physicsWorld, transformAux1, tempBtVec3_1;


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
    const ground = createParalellepipedWithPhysics( 40, 1, 40, 0, pos, quat, testDarkMaterial );

    pos.set( 0, 1.5, -20 );
    quat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
    const wall1 = createParalellepipedWithPhysics( 40, 3, 1, 0, pos, quat, testDarkMaterial );
    
    pos.set( -20, 1.5, 0 );
    quat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const wall2 = createParalellepipedWithPhysics( 1, 3, 40, 0, pos, quat, testDarkMaterial );
    
    pos.set( 20, 1.5, 0 );
    quat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const wall3 = createParalellepipedWithPhysics( 1, 3, 40, 0, pos, quat, testDarkMaterial );


    // for(let s = -2; s <= 2; s++) {
    //     for(let i = -2; i <= 2; i++) {
    //         let redness = Math.random() * 0.9;
    //         let brightness = Math.random() * 0.9 + 0.1;

    //         let b = brightness;
    //         let r = redness;

    //         let mat = new THREE.ShaderMaterial({
    //             uniforms: {
    //                 "uEmissive": { value: new THREE.Vector3(0,0,0) },
    //                 "uAlbedo": { value: new THREE.Vector3(b, b - r, b - r) },
    //                 "uRoughness": { value: 1 },
    //                 "uStep": { value: 0 },
    //             },
    //             fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    //         });

    //         let rad = 3.8;
    //         let dist = 7.8;
    //         let h = 3 + Math.random() * 6;

    //         // Tower 1
    //         const towerMass = 1000;
    //         const towerHalfExtents = new THREE.Vector3( rad, h, rad );
    //         pos.set( i * dist, h / 2, s * dist );
    //         quat.set( 0, 0, 0, 1 );
    //         createObject( towerMass, towerHalfExtents, pos, quat, mat );
    //     }
    // }


    
    for(let s = -3; s <= 3; s++) {
        for(let i = -3; i <= 3; i++) {
            let brightness = Math.random() * 0.9 + 0.1;
            let redness = Math.min(brightness, Math.random() * 0.9);

            let b = brightness;
            let r = redness;

            let et = Math.random();
            let er = 0, eb = 0, eg = 0;
            if(et > 0.95) {
                er = 20; eg = 0.4; eb = 0.75;
            } else if (et > 0.9) {
                er = 20; eg = 10; eb = 5;
            }

            let mat = new THREE.ShaderMaterial({
                uniforms: {
                    "uEmissive": { value: new THREE.Vector3(er, eg, eb) },
                    "uAlbedo": { value: new THREE.Vector3(b, b - r, b - r) },
                    "uRoughness": { value: 1 },
                    "uStep": { value: 0 },
                },
                fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
            });

            let rad = 2.6;
            let dist = 5.8;
            let h = 3 + Math.random() * 6 - s * 0.75;

            // Tower 1
            const towerMass = 1000;
            const towerHalfExtents = new THREE.Vector3( rad, h, rad );
            pos.set( i * dist, h / 2, s * dist );
            quat.set( 0, 0, 0, 1 );
            createObject( towerMass, towerHalfExtents, pos, quat, mat );
        }
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
    object.userData.physicsBody.mass = mass;
    object.userData.collided = false;

    object.oldWorldMatrix = object.matrixWorld.clone();
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
        const ballMass = 55;
        const ballRadius = 0.4;
    
        for(let i = 0; i < 3; i++) {
            let dir = raycaster.ray.direction.clone();
            if(i != 0) {
                dir.x *= 1 + Math.random() * 0.6 - 0.3;
                dir.y *= 1 + Math.random() * 0.6 - 0.3;
            }

            const ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 14, 10 ), ballMaterial );
            ball.isBall = true;
            ball.ballTimeStamp = new Date();
            const ballShape = new Ammo.btSphereShape( ballRadius );
            ballShape.setMargin( margin );
            pos.copy( dir );
            pos.add( raycaster.ray.origin );
            quat.set( 0, 0, 0, 1 );
            const ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );
        
            pos.copy( dir );
            pos.multiplyScalar( 38 );
            ballBody.setLinearVelocity( new Ammo.btVector3( pos.x * 3, pos.y * 3, pos.z * 3 ) );
        }
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
        // const fractureImpulse = 200;
        const fractureImpulse = 300;

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
        
            // const debris = convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal, 1, 2, 1.5 );
            const debris = convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal, 0.5, 1, 0.75 );
            // const debris = convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal, 0.25, 0.5, 0.375 );
        
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





































export { createScene, updateScene, switchSceneLights };