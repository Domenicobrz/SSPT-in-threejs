let feedbackloop_vs = `
varying vec2 vUv;

void main() {
    gl_Position = vec4(position, 1.0);
    vUv = uv;
}
`;

let feedbackloop_fs = `
varying vec2 vUv;

uniform float uFeedbackLoopFactor;
uniform sampler2D uRadianceAccumRT;
uniform sampler2D uAtrousRT;
uniform sampler2D uHistory;

uniform float uMaxFramesHistory; 

void main() {
    vec4 col1 = texture2D(uRadianceAccumRT, vUv);
    vec4 col2 = texture2D(uAtrousRT, vUv);

    float maxFrames = uMaxFramesHistory;
    float history = min(texture2D(uHistory, vUv).x, maxFrames) / maxFrames;

    // float factor = uFeedbackLoopFactor * (1.0 - history);
    float factor = uFeedbackLoopFactor;

    gl_FragColor = col1 * (1.0 - factor) + col2 * (factor);
}
`;

export { feedbackloop_fs, feedbackloop_vs };