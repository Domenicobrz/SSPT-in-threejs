import * as THREE from "./dependencies/three.module.js";
import { OrbitControls } from "./dependencies/orbitControls.js";
import { position_fs, position_vs } from "./shaders/position.js";
import { material_fs, material_vs } from "./shaders/material.js";
import { normal_fs, normal_vs } from "./shaders/normals.js";
import { display_fs, display_vs } from "./shaders/display.js";
import { makeSceneShaders } from "./shaders/radiance.js";
import { atrous_fs, atrous_vs } from "./shaders/atrous.js";
import { momentMove_fs, momentMove_vs } from "./shaders/momentMove.js";
import { historyTest_fs, historyTest_vs, historyAccum_fs, historyAccum_vs } from "./shaders/history.js";
import { radianceAccum_fs, radianceAccum_vs } from "./shaders/radianceAccum.js";
import { standardMaterial_fs, standardMaterial_vs } from "./shaders/standardMaterial.js";
import * as dat from './dependencies/dat.gui.js';
import Stats from "./dependencies/stats.js";


window.addEventListener("load", init);

let scene; 
let displayScene;
let camera;
let controls;
let renderer;
let pmremGenerator;
let hdrCubeRenderTarget;
let HDRtexture;

let positionRT;
let normalRT;
let emissionRT;
let radianceRT;
let atrousRT;
let momentMoveRT;
let historyRT;

let positionBufferMaterial;
let materialBufferMaterial;
let normalBufferMaterial;
let radianceBufferMaterial;
let momentBufferMaterial;
let historyTestMaterial;
let historyAccumMaterial;
let radianceAccumMaterial;
let atrousMaterial;

let displayQuadMesh;
let mesh;

let kpress;
let lpress;
let opress;
let ppress;
let jpress;
let npress;
let mpress;
let ipress;

let pixelRatio = 0.5;
let pr_width   = Math.floor(innerWidth  * pixelRatio);
let pr_height  = Math.floor(innerHeight * pixelRatio);

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

let culledScene;
let nonCulledScene;
let momentBufferScene;

function init() {
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.autoClear = false;
    renderer.setPixelRatio(pixelRatio);
    document.body.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    culledScene = new THREE.Scene();
    nonCulledScene = new THREE.Scene();
    momentBufferScene = new THREE.Scene();
    displayScene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.0875;
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.screenSpacePanning = true;

    //controls.update() must be called after any manual changes to the camera's transform
    camera.position.set( 0, 1, 18 );
    controls.target.set( 0, 0, 0 );
    controls.update();


    let filterMode = THREE.NearestFilter;

    positionRT = new THREE.WebGLRenderTarget(pr_width, pr_height, {
        magFilter: filterMode,
        minFilter: filterMode,
        type: THREE.FloatType,
        stencilBuffer: false,
    });

    normalRT = new THREE.WebGLRenderTarget(pr_width, pr_height, {
        magFilter: filterMode,
        minFilter: filterMode,
        type: THREE.FloatType,
        stencilBuffer: false,
    });

    emissionRT = new THREE.WebGLRenderTarget(pr_width, pr_height, {
        magFilter: filterMode,
        minFilter: filterMode,
        type: THREE.FloatType,
        stencilBuffer: false,
    });

    momentMoveRT = new THREE.WebGLRenderTarget(pr_width, pr_height, {
        magFilter: filterMode,
        minFilter: filterMode,
        type: THREE.FloatType,
        stencilBuffer: false,
    }); 
    

    atrousRT = createDoubleFBO(pr_width, pr_height, filterMode);
    historyRT = createTripleFBO(pr_width, pr_height, filterMode);
    radianceRT = createTripleFBO(pr_width, pr_height, filterMode);



    positionBufferMaterial = new THREE.ShaderMaterial({
        fragmentShader: position_fs,
        vertexShader: position_vs,
        side: THREE.DoubleSide,
    });

    normalBufferMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uCameraPos": { value: camera.position },
        },
        fragmentShader: normal_fs,
        vertexShader: normal_vs,
        side: THREE.DoubleSide,
    });

    momentBufferMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uOldModelViewMatrix": { value: new THREE.Matrix4() },
        },
        fragmentShader: momentMove_fs,
        vertexShader: momentMove_vs,
        side: THREE.DoubleSide,
    });

    radianceBufferMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uRadMult":    { value: 1 },
            "uCameraPos":    { value: camera.position },
            "uCameraTarget": { value: controls.target },
            "uAspectRatio": { value: pr_width / pr_height },
            "uRandom": { value: new THREE.Vector4(0, 0, 0, 0) },
            "uTime": { value: 0 },

            "uMirrorIndex": { value: 1 },

            "uPositionBuffer": { type: "t", value: positionRT.texture },
            "uNormalBuffer":   { type: "t", value: normalRT.texture },
            "uEmissionBuffer": { type: "t", value: emissionRT.texture },
        },
        transparent: true,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,

        fragmentShader: radiance_fs,
        vertexShader: radiance_vs,
        side: THREE.DoubleSide,
    });

    atrousMaterial = new THREE.ShaderMaterial({
        defines: {
            "atrous3x3": true,
        },
        uniforms: {
            "uRadiance": { type: "t", value: radianceRT.rt3.texture },
            "uNormal":   { type: "t",   value: normalRT.texture   },
            "uPosition": { type: "t", value: positionRT.texture },
            "uHistoryAccum": { type: "t", value: historyRT.rt3.texture },
            "uFilterHistoryModulation": { value: 0 },
            "uMaxFramesHistory": { value: 0 },
            "uStep": { value: 1.0 },
            "uScreenSize": { value: new THREE.Vector2(pr_width, pr_height) },
            "uC_phi": { value: 0.0 },
            "uN_phi": { value: 0.0 },
            "uP_phi": { value: 0.0 },
        },
        fragmentShader: atrous_fs,
        vertexShader: atrous_vs,
        side: THREE.DoubleSide,
    });

    historyTestMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uNormalBuffer":   { type: "t", value: normalRT.texture   },
            "uPositionBuffer": { type: "t", value: positionRT.texture },
            "uMomentMove":     { type: "t", value: momentMoveRT.texture },
            "uCameraPos":      { type: "t", value: camera.position },
            "uInvScreenSize":  { value: new THREE.Vector2(1 / pr_width, 1 / pr_height) },
        },
        fragmentShader: historyTest_fs,
        vertexShader: historyTest_vs,
        side: THREE.DoubleSide,
    });


    historyAccumMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uHistoryTest": { type: "t",  value: null },
            "uHistoryAccum": { type: "t", value: null },
            "uMomentMove": { type: "t", value: momentMoveRT.texture },
        },
        fragmentShader: historyAccum_fs,
        vertexShader: historyAccum_vs,
        side: THREE.DoubleSide,
    });

    radianceAccumMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uCurrentRadiance": { type: "t",  value: null },
            "uAccumulatedRadiance": { type: "t", value: null },
            "uHistoryBuffer": { type: "t", value: null },
            "uMomentMoveBuffer": { type: "t", value: null },
            "uMaxFramesHistory": { type: "t", value: null },
        },
        fragmentShader: radianceAccum_fs,
        vertexShader: radianceAccum_vs,
        side: THREE.DoubleSide,
    });

    window.displayMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uTexture": { type: "t", value: radianceRT.rt3.texture },
        },
        fragmentShader: display_fs,
        vertexShader: display_vs,
        side: THREE.DoubleSide,
    });





    let emissiveTestMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uEmissive": { value: new THREE.Vector3(5, 0.5, 0.5) },
            "uColor": { value: new THREE.Vector3(1,1,1) },
            "uStep": { value: 0 },
        },
        fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    });

    let emissiveTestMaterial2 = new THREE.ShaderMaterial({
        uniforms: {
            "uEmissive": { value: new THREE.Vector3(0.5, 0.5,5) },
            "uColor": { value: new THREE.Vector3(1,1,1) },
            "uStep": { value: 0 },
        },
        fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    });

    let culledTestMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uEmissive": { value: new THREE.Vector3(0,0,0) },
            "uColor": { value: new THREE.Vector3(1,1,1) },
            "uStep": { value: 0 },
        },
        fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.BackSide,
    });
    
    let testMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "uEmissive": { value: new THREE.Vector3(0,0,0) },
            "uColor": { value: new THREE.Vector3(1,1,1) },
            "uStep": { value: 0 },
        },
        fragmentShader: standardMaterial_fs, vertexShader: standardMaterial_vs, side: THREE.DoubleSide,
    });
    
    let cornellBoxMesh  = new THREE.Mesh(new THREE.BoxBufferGeometry(10, 10, 10), culledTestMaterial);
    culledScene.add(cornellBoxMesh);

    let testBox         = new THREE.Mesh(new THREE.BoxBufferGeometry(2, 2, 2), testMaterial);
    let lightBoxMesh1   = new THREE.Mesh(new THREE.BoxBufferGeometry(2, 2, 2), emissiveTestMaterial);
    let lightBoxMesh2   = new THREE.Mesh(new THREE.BoxBufferGeometry(2, 2, 2), emissiveTestMaterial2);
    lightBoxMesh1.position.set(+3, +3, 0);
    lightBoxMesh2.position.set(-3, -3, 0);
    nonCulledScene.add(testBox, lightBoxMesh1, lightBoxMesh2);




    window.addEventListener("keydown", (e) => {
        if(e.key == "k") kpress = true;
        if(e.key == "l") lpress = true;
        if(e.key == "p") ppress = true;
        if(e.key == "o") opress = true;
        if(e.key == "j") jpress = true;
        if(e.key == "m") mpress = true;
        if(e.key == "n") npress = true;
        if(e.key == "i") ipress = true;
        
    });
    window.addEventListener("keyup", (e) => {
        if(e.key == "k") kpress = false;
        if(e.key == "l") lpress = false;
        if(e.key == "p") ppress = false;
        if(e.key == "o") opress = false;
        if(e.key == "j") jpress = false;
        if(e.key == "m") mpress = false;
        if(e.key == "n") npress = false;
        if(e.key == "i") ipress = false;
    });



    displayQuadMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2), displayMaterial);
    displayScene.add(displayQuadMesh);


    initGUI();
    animate(0);
}

function createDoubleFBO(w, h, filtering) {
    let rt1 = new THREE.WebGLRenderTarget(w, h, {
        type:          THREE.FloatType,
        minFilter:     filtering || THREE.LinearFilter,
        magFilter:     filtering || THREE.LinearFilter,
        wrapS:         THREE.ClampToEdgeWrapping,
        wrapT:         THREE.ClampToEdgeWrapping,
        format:        THREE.RGBAFormat,
        stencilBuffer: false,
        anisotropy:    1,
    });

    let rt2 = new THREE.WebGLRenderTarget(w, h, {
        type:          THREE.FloatType,
        minFilter:     filtering || THREE.LinearFilter,
        magFilter:     filtering || THREE.LinearFilter,
        wrapS:         THREE.ClampToEdgeWrapping,
        wrapT:         THREE.ClampToEdgeWrapping,
        format:        THREE.RGBAFormat,
        stencilBuffer: false,
        anisotropy:    1,
    });

    return {
        read:  rt1,
        write: rt2,
        swap: function() {
            let temp   = this.read;
            this.read  = this.write;
            this.write = temp;
        }
    };
}

function createTripleFBO(w, h, filtering) {
    let rt1 = new THREE.WebGLRenderTarget(w, h, {
        type:          THREE.FloatType,
        minFilter:     filtering || THREE.LinearFilter,
        magFilter:     filtering || THREE.LinearFilter,
        wrapS:         THREE.ClampToEdgeWrapping,
        wrapT:         THREE.ClampToEdgeWrapping,
        format:        THREE.RGBAFormat,
        stencilBuffer: false,
        anisotropy:    1,
    });

    let rt2 = new THREE.WebGLRenderTarget(w, h, {
        type:          THREE.FloatType,
        minFilter:     filtering || THREE.LinearFilter,
        magFilter:     filtering || THREE.LinearFilter,
        wrapS:         THREE.ClampToEdgeWrapping,
        wrapT:         THREE.ClampToEdgeWrapping,
        format:        THREE.RGBAFormat,
        stencilBuffer: false,
        anisotropy:    1,
    });

    let rt3 = new THREE.WebGLRenderTarget(w, h, {
        type:          THREE.FloatType,
        minFilter:     filtering || THREE.LinearFilter,
        magFilter:     filtering || THREE.LinearFilter,
        wrapS:         THREE.ClampToEdgeWrapping,
        wrapT:         THREE.ClampToEdgeWrapping,
        format:        THREE.RGBAFormat,
        stencilBuffer: false,
        anisotropy:    1,
    });

    return {
        rt1: rt1,
        rt2: rt2,
        rt3: rt3,
        swap_rt2_rt3: function() {
            let temp = this.rt2;
            this.rt2 = this.rt3;
            this.rt3 = temp;
        }
    };
}

function animate(now) {
    stats.begin();


    requestAnimationFrame( animate );

    now *= 0.001;


    // HAI DOVUTO DISABILITARE SCOPE.UPDATE() DURANTE IL MOUSEMOVE/MOUSEDOWN ETC
    // DENTRO LO SCRIPT ORBITCONTROLS.js,
    // ALTRIMENTI controls.lastViewMatrixInverse SAREBBE STATA UGUALE ALLA
    // CURRENT MATRIX (mentre cliccavi e facevi drag), FACENDO SBALLARE I CALCOLI 
    // DELL'HISTORYTEST.
    // NON HAI DISABILITATO SCOPE.UPDATE() NELL'HANDLING DEI TOUCH-EVENT, QUINDI 
    // QUESTO PROGETTO
    // NON FUNZIONERA' SUI MOBILES FINCHE' NON RIMUOVI SCOPE.UPDATE() ANCHE DA LI'
    controls.update();





    // we need to create moment buffers BEFORE we update normal/position RTs
    // **************** create moment buffers
    // are you surprised I'm using the matrixWorldInverse? then think more..
    let oldCameraMatrix = controls.lastViewMatrixInverse;

    momentBufferMaterial.needsUpdate = true;
    momentBufferMaterial.side = THREE.BackSide;

    renderer.setRenderTarget(momentMoveRT);
    renderer.clear();

    for(let i = culledScene.children.length - 1; i >= 0; i--) {
        culledScene.children[i].savedMaterial = culledScene.children[i].material;
        culledScene.children[i].material = momentBufferMaterial;

        let viewModelMatrix = new THREE.Matrix4();
        viewModelMatrix.multiplyMatrices(oldCameraMatrix, culledScene.children[i].matrixWorld);
        momentBufferMaterial.uniforms.uOldModelViewMatrix.value = viewModelMatrix;
        momentBufferMaterial.uniforms.uOldModelViewMatrix.needsUpdate = true;
        momentBufferMaterial.uniforms.needsUpdate = true;

        momentBufferScene.add(culledScene.children[i]);

        renderer.render( momentBufferScene, camera );

        // re-add again this object to culledScene since it was removed by momentBufferScene.add(...)
        // it should also remove the object from momentBufferScene
        culledScene.add(momentBufferScene.children[0]);
    }
    for(let i = 0; i < culledScene.children.length; i++) {
        culledScene.children[i].material = culledScene.children[i].savedMaterial;
    }

    // ---

    momentBufferMaterial.needsUpdate = true;
    momentBufferMaterial.side = THREE.DoubleSide;

    for(let i = nonCulledScene.children.length - 1; i >= 0; i--) {
        nonCulledScene.children[i].savedMaterial = nonCulledScene.children[i].material;
        nonCulledScene.children[i].material = momentBufferMaterial;

        let viewModelMatrix = new THREE.Matrix4();
        viewModelMatrix.multiplyMatrices(oldCameraMatrix, nonCulledScene.children[i].matrixWorld);
        momentBufferMaterial.uniforms.uOldModelViewMatrix.value = viewModelMatrix;
        momentBufferMaterial.uniforms.uOldModelViewMatrix.needsUpdate = true;
        momentBufferMaterial.uniforms.needsUpdate = true;

        momentBufferScene.add(nonCulledScene.children[i]);

        renderer.render( momentBufferScene, camera );

        // re-add again this object to culledScene since it was removed by momentBufferScene.add(...)
        // it should also remove the object from momentBufferScene
        nonCulledScene.add(momentBufferScene.children[0]);
    }
    for(let i = 0; i < nonCulledScene.children.length; i++) {
        nonCulledScene.children[i].material = nonCulledScene.children[i].savedMaterial;
    }
    // **************** create moment buffers - END



    // ************** create history buffer
    // will use uniform sampler2D uNormalBuffer;
    //          uniform sampler2D uPositionBuffer;
    // of the previous frames
    // on rt1 we add the success vs unsuccess buffer (either +1 or -1)
    historyTestMaterial.uniforms.uCameraPos.value = camera.position;
    historyTestMaterial.side = THREE.BackSide;
    
    for(let i = 0; i < culledScene.children.length; i++) {
        culledScene.children[i].savedMaterial = culledScene.children[i].material;
        culledScene.children[i].material = historyTestMaterial;
    }

    renderer.setRenderTarget(historyRT.rt1);
    renderer.clear();
    renderer.render( culledScene, camera );

    for(let i = 0; i < culledScene.children.length; i++) {
        culledScene.children[i].material = culledScene.children[i].savedMaterial;
    }

    // ---

    historyTestMaterial.side = THREE.DoubleSide;
    
    for(let i = 0; i < nonCulledScene.children.length; i++) {
        nonCulledScene.children[i].savedMaterial = nonCulledScene.children[i].material;
        nonCulledScene.children[i].material = historyTestMaterial;
    }

    renderer.render( nonCulledScene, camera );

    for(let i = 0; i < nonCulledScene.children.length; i++) {
        nonCulledScene.children[i].material = nonCulledScene.children[i].savedMaterial;
    }












    historyRT.swap_rt2_rt3();
    // rt2 now holds the previously accumulated values
    // rt3 updates the old accumulated values with the new buffer on rt1
    renderer.setRenderTarget(historyRT.rt3);
    renderer.clear();
    displayQuadMesh.material = historyAccumMaterial;
    historyAccumMaterial.uniforms.uHistoryTest.value = historyRT.rt1.texture;
    historyAccumMaterial.uniforms.uHistoryAccum.value = historyRT.rt2.texture;
    renderer.render( displayScene, camera );
    // ************** create history buffer - END




    // **************** creating buffers
    positionBufferMaterial.side = THREE.BackSide;

    for(let i = 0; i < culledScene.children.length; i++) {
        culledScene.children[i].savedMaterial = culledScene.children[i].material;
        culledScene.children[i].material = positionBufferMaterial;
    }

    renderer.setRenderTarget(positionRT);
    renderer.clear();
    renderer.render( culledScene, camera );

    for(let i = 0; i < culledScene.children.length; i++) {
        culledScene.children[i].material = culledScene.children[i].savedMaterial;
    }

    // ---

    positionBufferMaterial.side = THREE.DoubleSide;

    for(let i = 0; i < nonCulledScene.children.length; i++) {
        nonCulledScene.children[i].savedMaterial = nonCulledScene.children[i].material;
        nonCulledScene.children[i].material = positionBufferMaterial;
    }

    renderer.render( nonCulledScene, camera );

    for(let i = 0; i < nonCulledScene.children.length; i++) {
        nonCulledScene.children[i].material = nonCulledScene.children[i].savedMaterial;
    }









    // at this point all meshes have their material-materials assigned
    // ******* creating emission buffer ********
    for(let i = 0; i < culledScene.children.length; i++) {
        culledScene.children[i].material.uniforms.uStep = 0;
    }
    renderer.setRenderTarget(emissionRT);
    renderer.clear();
    renderer.render( culledScene, camera );

    // ---

    for(let i = 0; i < nonCulledScene.children.length; i++) {
        nonCulledScene.children[i].material.uniforms.uStep = 0;
    }
    renderer.render( nonCulledScene, camera );










    normalBufferMaterial.side = THREE.BackSide;
    normalBufferMaterial.uniforms.uCameraPos.value = camera.position;

    for(let i = 0; i < culledScene.children.length; i++) {
        culledScene.children[i].savedMaterial = culledScene.children[i].material;
        culledScene.children[i].material = normalBufferMaterial;
    }

    renderer.setRenderTarget(normalRT);
    renderer.clear();
    renderer.render( culledScene, camera );

    for(let i = 0; i < culledScene.children.length; i++) {
        culledScene.children[i].material = culledScene.children[i].savedMaterial;
    }
    
    // ---

    normalBufferMaterial.side = THREE.DoubleSide;

    for(let i = 0; i < nonCulledScene.children.length; i++) {
        nonCulledScene.children[i].savedMaterial = nonCulledScene.children[i].material;
        nonCulledScene.children[i].material = normalBufferMaterial;
    }

    renderer.render( nonCulledScene, camera );

    for(let i = 0; i < nonCulledScene.children.length; i++) {
        nonCulledScene.children[i].material = nonCulledScene.children[i].savedMaterial;
    }








    renderer.setRenderTarget(radianceRT.rt1);
    renderer.clear();
    for(let i = 0; i < controller.spp; i++) {
        renderer.setRenderTarget(radianceRT.rt1);
        radianceBufferMaterial.uniforms.uRadMult.value = 1 / (controller.spp);
        radianceBufferMaterial.uniforms.uCameraPos.value = camera.position;
        radianceBufferMaterial.uniforms.uCameraTarget.value = controls.target;
        radianceBufferMaterial.uniforms.uRandom.value = new THREE.Vector4(Math.random(), Math.random(), Math.random(), Math.random());
        radianceBufferMaterial.uniforms.uTime.value = now;
        radianceBufferMaterial.uniforms.uMirrorIndex.value = controller.mirrorIndex;
        displayQuadMesh.material = radianceBufferMaterial;
        renderer.render(displayScene, camera );
    }
        // ************** accumulating radiance 
        radianceRT.swap_rt2_rt3();

        renderer.setRenderTarget(radianceRT.rt3);
        renderer.clear();
        displayQuadMesh.material = radianceAccumMaterial;
        radianceAccumMaterial.uniforms.uCurrentRadiance.value = radianceRT.rt1.texture;
        radianceAccumMaterial.uniforms.uAccumulatedRadiance.value = radianceRT.rt2.texture;
        radianceAccumMaterial.uniforms.uHistoryBuffer.value = historyRT.rt3.texture;
        radianceAccumMaterial.uniforms.uMomentMoveBuffer.value = momentMoveRT.texture;
        radianceAccumMaterial.uniforms.uMaxFramesHistory.value = controller.maxFramesHistory;
        renderer.render(displayScene, camera );
        // ************** accumulating radiance - END


    // **************** creating buffers - END




    // **************** atrous
    atrousMaterial.uniforms.uN_phi.value = controller.n_phi;
    atrousMaterial.uniforms.uP_phi.value = controller.p_phi;
    atrousMaterial.uniforms.uC_phi.value = controller.c_phi;

    renderer.setRenderTarget(atrousRT.write);
    atrousMaterial.uniforms.uRadiance.value = radianceRT.rt3.texture;
    atrousMaterial.uniforms.uHistoryAccum.value = historyRT.rt3.texture;
    atrousMaterial.uniforms.uMaxFramesHistory.value = controller.maxFramesHistory;
    atrousMaterial.uniforms.uFilterHistoryModulation.value = controller.filterHistoryModulation;
    atrousMaterial.uniforms.uStep.value  = 1.0;
    displayQuadMesh.material = atrousMaterial;
    renderer.clear();
    renderer.render(displayScene, camera );

    for(let i = 0; i < Math.floor(controller.iterations); i++) {
        atrousRT.swap();

        renderer.setRenderTarget(atrousRT.write);
        atrousMaterial.uniforms.uRadiance.value = atrousRT.read.texture;
        atrousMaterial.uniforms.uStep.value  *= controller.stepMultiplier;
        atrousMaterial.uniforms.uC_phi.value *= controller.c_phiMultPerIt;
        displayQuadMesh.material = atrousMaterial;
        renderer.clear();
        renderer.render(displayScene, camera );
    }
    atrousRT.swap();
    // **************** atrous - END







    renderer.setRenderTarget(null);
    displayQuadMesh.material = displayMaterial;
    // displayQuadMesh.material.uniforms.uTexture.value = radianceRT.rt3.texture;
    displayQuadMesh.material.uniforms.uTexture.value = atrousRT.write.texture;
    // if(kpress) {
    //     // displayQuadMesh.material.uniforms.uTexture.value = momentMoveRT.texture;
    //     // displayQuadMesh.material.uniforms.uTexture.value = normalRT.texture;
    //     // displayQuadMesh.material.uniforms.uTexture.value = historyRT.rt1.texture;
    //     // displayQuadMesh.material.uniforms.uTexture.value = historyRT.rt3.texture;
    //     displayQuadMesh.material.uniforms.uTexture.value = radianceRT.rt3.texture;
    // }
        
    if(kpress) displayQuadMesh.material.uniforms.uTexture.value = radianceRT.rt3.texture;
    if(lpress) displayQuadMesh.material.uniforms.uTexture.value = normalRT.texture;
    if(opress) displayQuadMesh.material.uniforms.uTexture.value = positionRT.texture;
    if(jpress) displayQuadMesh.material.uniforms.uTexture.value = historyRT.rt1.texture;
    if(ppress) displayQuadMesh.material.uniforms.uTexture.value = historyRT.rt3.texture;
    if(npress) displayQuadMesh.material.uniforms.uTexture.value = momentMoveRT.texture;
    if(mpress) displayQuadMesh.material.uniforms.uTexture.value = radianceRT.rt1.texture;
    if(ipress) displayQuadMesh.material.uniforms.uTexture.value = materialRT.texture;

    renderer.clear();
    renderer.render(displayScene, camera);




	stats.end();
}

let controller;
function initGUI() {

    var gui = new dat.GUI();

    var GUIcontroller = function() {
        this.c_phi = 105;
        this.n_phi = 0.01;
        this.p_phi = 1;

        this.c_phiMultPerIt = 0.34;

        this.stepMultiplier = 1.5;
        this.iterations = 10;

        this.atrous5x5 = false;

        this.maxFramesHistory = 10;
        this.filterHistoryModulation = 0.54;
        this.spp = 1;
        this.mirrorIndex = 1;

        this.lowQuality = function() {
            this.spp = 1;
            this.iterations = 7;
            this.filterHistoryModulation = 0.37;
            this.stepMultiplier = 1.7;
            this.atrous5x5 = false;
            this.maxFramesHistory = 10;
            this.c_phiMultPerIt = 0.34;
            this.c_phi = 105;
            this.n_phi = 0.01;
            this.p_phi = 1;

            this.updateGUI();
        };  

        this.mediumQuality = function() {
            this.spp = 2;
            this.iterations = 8;
            this.c_phiMultPerIt = 0.36;
            this.filterHistoryModulation = 0.42;
            this.stepMultiplier = 1.6;
            this.c_phi = 105;
            this.n_phi = 0.01;
            this.p_phi = 1;
            this.maxFramesHistory = 10;
            this.atrous5x5 = false;

            this.updateGUI();
        };  

        this.highQuality = function() {
            this.c_phi = 105;
            this.n_phi = 0.01;
            this.p_phi = 1;
    
            this.c_phiMultPerIt = 0.34;
    
            this.stepMultiplier = 1.5;
            this.iterations = 10;
    
            this.atrous5x5 = false;
    
            this.maxFramesHistory = 10;
            this.filterHistoryModulation = 0.54;
            this.spp = 3;

            this.updateGUI();
        }

        this.veryHighQuality = function() {
            this.c_phi = 105;
            this.n_phi = 0.01;
            this.p_phi = 1;
    
            this.c_phiMultPerIt = 0.34;
    
            this.stepMultiplier = 1.47;
            this.iterations = 10;
    
            this.atrous5x5 = false;
    
            this.maxFramesHistory = 7;
            this.filterHistoryModulation = 0.35;
            this.spp = 5;

            this.updateGUI();
        }

        this.updateGUI = function() {
            for(let folder in gui.__folders) {
                if(!gui.__folders.hasOwnProperty(folder)) continue;
        
                for(let j = 0; j < gui.__folders[folder].__controllers.length; j++) {
                    let property = gui.__folders[folder].__controllers[j].property;
        
                    if(controller.hasOwnProperty(property)) {
                        gui.__folders[folder].__controllers[j].setValue(controller[property]);
                    }
                }
            }
        };

    };    

    controller = new GUIcontroller();


    var wff = gui.addFolder('Wavelet Filter');
    var ptf = gui.addFolder('Path Tracer');
    var rpf = gui.addFolder('Reprojection Params');
    var qpf = gui.addFolder('Quality Presets');

    wff.add(controller, 'c_phi', 0, 200).onChange(function(value) {
        atrousMaterial.uniforms.uC_phi.value = value;
    });
    wff.add(controller, 'n_phi', 0.01, 30).onChange(function(value) {
        atrousMaterial.uniforms.uN_phi.value = value;
    }); 
    wff.add(controller, 'p_phi', 0, 30).onChange(function(value) {
        atrousMaterial.uniforms.uP_phi.value = value;
    }); 
    wff.add(controller, 'c_phiMultPerIt', 0, 1);
    wff.add(controller, 'stepMultiplier', 0, 5);
    wff.add(controller, 'iterations', 0, 10).step(1);
    wff.add(controller, 'atrous5x5').onChange(function(value) {
        if(value) {
            atrousMaterial.defines = {
                "atrous5x5": true,
            };
        } else {
            atrousMaterial.defines = {
                "atrous3x3": true,
            };
        }

        atrousMaterial.needsUpdate = true;
    });

    ptf.add(controller, 'spp', 1, 10).step(1);
    ptf.add(controller, 'mirrorIndex', 1, 4).step(1);

    rpf.add(controller, 'maxFramesHistory', 0, 100).step(1);
    rpf.add(controller, 'filterHistoryModulation', 0, 1);

    qpf.add(controller, 'lowQuality');
    qpf.add(controller, 'mediumQuality');
    qpf.add(controller, 'highQuality');
    qpf.add(controller, 'veryHighQuality');



    wff.open();
    ptf.open();
    rpf.open();
    qpf.open();
}


makeSceneShaders();