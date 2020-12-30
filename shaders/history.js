let historyTest_vs = `
varying mat4 vProjectionViewMatrix;
varying vec3 vFragPos;
varying vec3 vWorldFragPos;
varying vec3 vNormal;

uniform vec3 uCameraPos;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vProjectionViewMatrix = projectionMatrix * modelViewMatrix;
    vFragPos = position; // multiplied by PVM in fragment shader
    vWorldFragPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normal;
}
`;

let historyTest_fs = `
varying mat4 vProjectionViewMatrix;
varying vec3 vFragPos;
varying vec3 vWorldFragPos;
varying vec3 vNormal;

uniform sampler2D uNormalBuffer;
uniform sampler2D uPositionBuffer;
uniform sampler2D uMomentMove;
uniform vec2 uInvScreenSize;

void main() {
    vec4 projected = vProjectionViewMatrix * vec4(vFragPos, 1.0);
    projected /= projected.w;
    vec2 uv = projected.xy * 0.5 + 0.5;

    vec3 success = vec3(1.0);
   
    // reprojection test
    vec2 olduv = uv + texture2D(uMomentMove, uv).xy;
    vec3 oldNormal = texture2D(uNormalBuffer, olduv).xyz;
    vec3 oldWorldPosition = texture2D(uPositionBuffer, olduv).xyz;

    vec3 normal = normalize(vNormal);


    if(dot(oldNormal, normal) < 0.9) success = vec3(0.0);
    if(length(oldWorldPosition - vWorldFragPos) > 0.25) success = vec3(0.0);

    gl_FragColor = vec4(success, 1.0);
}
`;






let historyAccum_vs = `
varying vec2 vUv;

void main() {
    gl_Position = vec4(position, 1.0);
    vUv = uv;
}
`;

let historyAccum_fs = `
varying vec2 vUv;

uniform sampler2D uHistoryTest;
uniform sampler2D uHistoryAccum;
uniform sampler2D uMomentMove;

void main() {

    // quesito interessante.. l'accumulazione va fatta basandosi
    // sul valore accumulato del pixel reproiettato o su quello corrente?
    vec2 olduv = vUv + texture2D(uMomentMove, vUv).xy;

    float lastTestResult = texture2D(uHistoryTest, vUv).x;
    float accum = texture2D(uHistoryAccum, olduv).x;

    float updatedAccum = lastTestResult < 0.5 ? 0.0 : accum + 1.0;
    gl_FragColor = vec4(vec3(updatedAccum), 1.0);
}
`;


export { historyTest_fs, historyTest_vs, historyAccum_vs, historyAccum_fs };