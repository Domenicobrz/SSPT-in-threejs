import * as THREE from "./dependencies/three.module.js";
import { standardMaterial_fs, standardMaterial_vs } from "./shaders/standardMaterial.js";
import { OBJLoader } from "./dependencies/OBJLoader.js";

function createScene(culledScene, nonCulledScene) {
    let em = 10;
    let emissiveTestMaterial = new THREE.ShaderMaterial({
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
    
   
    
    window.cornellBoxMesh  = new THREE.Mesh(new THREE.BoxBufferGeometry(10, 10, 10), culledTestMaterial);
    culledScene.add(cornellBoxMesh);

    // window.lightBoxMesh1   = new THREE.Mesh(new THREE.BoxBufferGeometry(2, 0.1, 2), emissiveTestMaterial);
    window.lightBoxMesh1   = new THREE.Mesh(new THREE.BoxBufferGeometry(8, 0.1, 8), emissiveTestMaterial);
    lightBoxMesh1.position.set(0, +4.9, 0);
    // window.lightBoxMesh1   = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 5, 5), emissiveTestMaterial);
    // lightBoxMesh1.position.set(-4.9, -2, 0);
    nonCulledScene.add(lightBoxMesh1);

    window.boxes = [];
    for(let j = 0; j < 40; j++) {
        let r = Math.random();
        let g = Math.random();
        let b = Math.random();

        let roughnss = Math.random() > 0.75 ? 0 : 1;
        let emss     = Math.random() > 0.9 ? new THREE.Vector3(r * em,g * em,b * em) : new THREE.Vector3(0,0,0); 
        let testMaterial = new THREE.ShaderMaterial({
            uniforms: {
                "uEmissive": { value: emss },
                "uAlbedo": { value: new THREE.Vector3(r,g,b) },
                "uRoughness": { value: roughnss },
                "uStep": { value: 0 },
            },
            fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
        });

        for(let i = 0; i < 2; i++) {
            let size = Math.random() * 0.8 + 0.15;
            let box = new THREE.Mesh(new THREE.BoxBufferGeometry(size, size, size), testMaterial);
            box.position.set(
                (Math.random() * 2 - 1) * 5,
                (Math.random() * 2 - 1) * 1.5 - 3,
                (Math.random() * 2 - 1) * 5,
            );
            nonCulledScene.add(box);
            box.rotXSpeed    = Math.pow(Math.random(), 2.0) * 0.02;
            box.rotYSpeed    = Math.pow(Math.random(), 2.0) * 0.02;
            box.rotZSpeed    = Math.pow(Math.random(), 2.0) * 0.02;
            
            box.translXSpeed = Math.random() * 0.02;
            box.translYSpeed = Math.random() * 0.02;
            box.translZSpeed = Math.random() * 0.02;
    
            box.basePosition = [box.position.x, box.position.y, box.position.z];
            boxes.push(box);
        }
    }

    let cornellBRedMat = new THREE.ShaderMaterial({ uniforms: { "uEmissive": { value: new THREE.Vector3(0,0,0) },
                "uAlbedo": { value: new THREE.Vector3(1,0.1,0.2) }, "uStep": { value: 0 }, "uRoughness": { value: 1 },
        }, fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.BackSide,
    });
    let cornellBGreenMat = new THREE.ShaderMaterial({ uniforms: { "uEmissive": { value: new THREE.Vector3(0,0,0) },
            "uAlbedo": { value: new THREE.Vector3(0.1,1,0.2) }, "uStep": { value: 0 }, "uRoughness": { value: 1 },
        }, fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.BackSide,
    });
    let cbox1 = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10), cornellBRedMat);
    cbox1.position.set(+4.9975, 0, 0);
    cbox1.rotation.y = Math.PI * 0.5;
    culledScene.add(cbox1);
    
    let cbox2 = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10), cornellBGreenMat);
    cbox2.position.set(-4.9975, 0, 0);
    cbox2.rotation.y = -Math.PI * 0.5;
    culledScene.add(cbox2);




    const loader = new OBJLoader();

    // load a resource
    loader.load(
        // resource URL
        'assets/models/archangel2.obj',
        // called when resource is loaded
        function ( object ) {
            let mesh = object.children[0];
            mesh.material = new THREE.ShaderMaterial({ uniforms: { 
                    "uEmissive": { value: new THREE.Vector3(0,0,0) },
                    "uAlbedo": { value: new THREE.Vector3(1,1,1) }, 
                    "uStep": { value: 0 }, 
                    "uRoughness": { value: 1 },
                }, fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.BackSide,
            });
            // mesh.scale.set(3, 3, 3);
            mesh.position.set(0, -5, -3);
            // mesh.geometry.computeVertexNormals();

            // mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(3, 20, 20), mesh.material);

            nonCulledScene.add( mesh );
        },
        // called when loading is in progresses
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
        }
    );
}

function updateScene(now, culledScene, nonCulledScene) {
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES
    for(let i = 0; i < culledScene.children.length; i++) {
        culledScene.children[i].oldWorldMatrix = culledScene.children[i].matrixWorld.clone();
    }
    for(let i = 0; i < nonCulledScene.children.length; i++) {
        nonCulledScene.children[i].oldWorldMatrix = nonCulledScene.children[i].matrixWorld.clone();
    }
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES




    // lightBoxMesh1.rotateX(0.06);
    // lightBoxMesh1.rotateY(0.03);
    // lightBoxMesh1.rotateZ(0.02);
    // lightBoxMesh1.position.set(-3, Math.cos(now * 0.3) * 3, -3);
    // lightBoxMesh1.updateMatrixWorld();
    
    // lightBoxMesh2.rotateX(0.03);
    // lightBoxMesh2.rotateY(0.02);
    // lightBoxMesh2.rotateZ(0.01);
    // lightBoxMesh2.position.set(+3, Math.cos(now * 0.5) * 3, +3);
    // lightBoxMesh2.updateMatrixWorld();

    for(let i = 0; i < boxes.length; i++) {
        boxes[i].rotateX(boxes[i].rotXSpeed);
        boxes[i].rotateY(boxes[i].rotYSpeed);
        boxes[i].rotateZ(boxes[i].rotZSpeed);
        
        boxes[i].position.set(
            boxes[i].basePosition[0] + Math.sin(now * boxes[i].translXSpeed) * 0.5,
            boxes[i].basePosition[1] + Math.sin(now * boxes[i].translYSpeed) * 0.5,
            boxes[i].basePosition[2] + Math.sin(now * boxes[i].translZSpeed) * 0.5,
        );
        boxes[i].updateMatrixWorld();
    }
}

export { createScene, updateScene };