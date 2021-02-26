import * as THREE from "./dependencies/three.module.js";

let cubeScene = new THREE.Scene();
let cubeMat = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec3 vFragPos;

        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vFragPos = (modelMatrix * vec4(position, 1.0)).xyz;
        }
    `,
    fragmentShader: `
        varying vec3 vFragPos;

        void main() {
            gl_FragColor = vec4(normalize(vFragPos) * 10000.0, 1.0);
        }
    `,
    side: THREE.DoubleSide,
    depthWrite: false,
});

let cube = new THREE.Mesh(new THREE.BoxBufferGeometry(10, 10, 10), cubeMat);
cube.frustumCulled = false;
cubeScene.add(cube);
cubeScene.frustumCulled = false;

// let cubeCamera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);

function renderPositionCube(renderer, camera) {

    let prevCameraPosition = camera.position.clone();
    camera.position.set(0,0,0);

    renderer.render(cubeScene, camera);

    camera.position.set(prevCameraPosition.x, prevCameraPosition.y, prevCameraPosition.z);
}

export { renderPositionCube };