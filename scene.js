import * as THREE from "./dependencies/three.module.js";
import { standardMaterial_fs, standardMaterial_vs } from "./shaders/standardMaterial.js";
import { litStatueMaterial_fs, litStatueMaterial_vs } from "./shaders/litStatueMaterial.js";
import { OBJLoader } from "./dependencies/OBJLoader.js";

let sceneType = 0;
let cornellBGreenMat;
let perlinNoiseEmissiveMaterial;
let emissiveTestMaterial;
let testMaterial;

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

    
    
    // window.cornellBoxMesh  = new THREE.Mesh(new THREE.BoxBufferGeometry(10, 10, 10), culledTestMaterial);
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

    
    // window.lightBoxMesh1   = new THREE.Mesh(new THREE.BoxBufferGeometry(8, 0.1, 8), emissiveTestMaterial);
    // lightBoxMesh1.position.set(0, +4.9, 0);
    // scene.add(lightBoxMesh1);




    window.boxes = [];
    for(let j = 0; j < 50 /*80*/; j++) {
        let r = 0.95; //Math.random();
        let g = 0.95; //Math.random();
        let b = 0.95; //Math.random();

        let roughnss = Math.random() > 0.75 ? 0 : 1;
        let emss     = Math.random() > 0.95 ? new THREE.Vector3(r * em,g * em,b * em) : new THREE.Vector3(0,0,0); 


        emss = new THREE.Vector3(0,0,0);
        // let ra = Math.random();
        // if (ra < 0.2) {
        //     emss = new THREE.Vector3(10,1,1);
        // }
        // if(ra < 0.1) {
        //     emss = new THREE.Vector3(1,10,1);
        // }

        // let emss     = new THREE.Vector3(0,0,0);  
        let testMaterial = new THREE.ShaderMaterial({
            uniforms: {
                "uEmissive": { value: emss },
                "uAlbedo": { value: new THREE.Vector3(r,g,b) },
                "uRoughness": { value: 1 },
                "uStep": { value: 0 },
            },
            fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
        });

        for(let i = 0; i < 3; i++) {
            let size1 = Math.random() * 1.1 + 0.1;
            let size2 = Math.random() * 1.1 + 0.1;
            let size3 = Math.random() * 1.1 + 0.1;

            let accuracy = Math.floor(4 + size3 * 10);

            let box = new THREE.Mesh(new THREE.SphereBufferGeometry(size3, accuracy, accuracy), testMaterial);
            box.position.set(
                (Math.random() * 2 - 1) * 6.5,
                (Math.pow(Math.random(), 4.0) * 4.5) - 2,
                (Math.random() * 2 - 1) * 6.5,
            );
            box.rotXSpeed    = Math.pow(Math.random(), 2.0) * 0.02;
            box.rotYSpeed    = Math.pow(Math.random(), 2.0) * 0.02;
            box.rotZSpeed    = Math.pow(Math.random(), 2.0) * 0.02;
            
            box.translXSpeed = Math.random() * 0.02;
            box.translYSpeed = Math.random() * 0.02;
            box.translZSpeed = Math.random() * 0.02;
    
            box.basePosition = [box.position.x, box.position.y, box.position.z];
            boxes.push(box);

            scene.add(box);
        }
    }


    for(let i = 0; i < 2; i++) {

        let rotX = Math.random() * Math.PI;
        let rotY = Math.random() * Math.PI;

        let r = Math.random() * 10;
        let g = Math.random() * 10;
        let b = Math.random() * 10;

        let rad = Math.random() * 3 + 5;

        const geometry = new THREE.TorusGeometry( rad, 0.5, 16, 100 );
        const torus = new THREE.Mesh( geometry, new THREE.ShaderMaterial({
            uniforms: {
                "uEmissive": { value: new THREE.Vector3(r, g, b) },
                "uAlbedo": { value: new THREE.Vector3(1,1,1) },
                "uRoughness": { value: 1 },
                "uStep": { value: 0 },
            },
            fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
        }));

        torus.rotation.x = rotX;
        torus.rotation.y = rotY;

        scene.add( torus );
    
    }

    // window.cbox3 = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10), new THREE.ShaderMaterial({ uniforms: { "uEmissive": { value: new THREE.Vector3(0,0,0) },
    // "uAlbedo": { value: new THREE.Vector3(1,1,1) }, "uStep": { value: 0 }, "uRoughness": { value: 0 },
    // }, fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.BackSide,
    // }));
    // cbox3.position.set(0, -4.9975, 0);
    // cbox3.rotation.x = Math.PI * 0.5;
    // scene.add(cbox3);

    // cbox2.material = perlinNoiseEmissiveMaterial;
    // perlinNoiseEmissiveMaterial.side = THREE.BackSide;

    window.addEventListener("keypress", (e) => {
        if(e.key == "e") {
            sceneSwitch(scene);
        }
        if(e.key == "r") {
            switchLights();
        }
    });
}

function updateScene(now, scene) {
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES
    for(let i = 0; i < scene.children.length; i++) {
        scene.children[i].oldWorldMatrix = scene.children[i].matrixWorld.clone();
    }
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES
    // OBJECTS ARE IN CHARGE OF KEEPING A COPY OF THEIR OLDER WORLD MATRICES

    for(let i = 0; i < boxes.length; i++) {
        boxes[i].position.set(
            boxes[i].basePosition[0] + Math.sin(now * boxes[i].translXSpeed) * 3.5,
            boxes[i].basePosition[1] + Math.sin(now * boxes[i].translYSpeed) * 3.5,
            boxes[i].basePosition[2] + Math.sin(now * boxes[i].translZSpeed) * 3.5,
        );
        boxes[i].updateMatrixWorld();
    }
}

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

export { createScene, updateScene, switchSceneLights };