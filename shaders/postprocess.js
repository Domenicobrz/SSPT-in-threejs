let postprocess_vs = `
varying vec2 vUv;

void main() {
    gl_Position = vec4(position, 1.0);
    vUv = uv;
}
`;

let postprocess_fs = `
varying vec2 vUv;

uniform sampler2D uTexture;
uniform vec4      uPointer;
uniform float     uAspect;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {

    vec2 uv = vUv;

    // pointer distortion
    vec2  puv   = uPointer.xy;
    float ptime = uPointer.z * 2.0;
    float dist  = length(vUv - puv);
    float radTimeMult = 0.2;
    // float rad   = 0.05 + ptime * radTimeMult;  
    // float maxRad = rad + radTimeMult; 
    float rad    = 0.2;  
    float maxRad = 0.2; 
    float intref = 0.0;
    if(dist < rad && ptime < 1.0) {
        // float intensity = ptime < 0.5 ? ptime * 2.0 : (ptime - 0.5) * 2.0;
        float pyrTime = ptime < 0.5 ? 
            smoothstep(0.0, 1.0, ptime * 2.0) : 
            smoothstep(0.0, 1.0, 1.0 - (ptime - 0.5) * 2.0);

        // pyrTime *= 0.2;
        // pyrTime += ptime * 0.8;

        // float intensity = (sin(dist * 100.0 + ptime)) * pyrTime;



        float rangeLength = 0.6;
        float rangeStart  = -0.6 + ptime * (1.0 + rangeLength); 
        float rangeEnd    = rangeLength + rangeStart;

        float t = dist / maxRad;
        t = (t - rangeStart) / rangeLength;
        t = clamp(t, 0.0, 1.0);
        
        // pyramided t
        float pt = t < 0.5 ? 
            smoothstep(0.0, 1.0, t * 2.0) : 
            smoothstep(0.0, 1.0, 1.0 - (t - 0.5) * 2.0);

        t = sin(t * 8.0) * pt;

        float intensity = t * 0.2;
        intref = intensity;

        vec2 dir = normalize(vUv - puv);

        uv += dir * 0.03 * (intensity); 
    }


    float dist_from_hor_center = abs(uv.x - 0.5);
    float spread = 0.004 * dist_from_hor_center;

    spread += intref * 0.02;
    spread += (rand(uv) * 2.0 - 1.0) * intref * 0.02;


    // vec2 offs = normalize(uv - vec2(0.5)) * spread;
    vec2 offs = vec2(spread, 0.0);

    
    vec4 c1 = texture2D(uTexture, uv + offs);
    vec4 c2 = texture2D(uTexture, uv);
    vec4 c3 = texture2D(uTexture, uv - offs);

    c1 *= vec4(1.0, 0.2, 0.0, 1.0);
    c2 *= vec4(0.0, 0.6, 0.0, 1.0);
    c3 *= vec4(0.0, 0.2, 1.0, 1.0);


    gl_FragColor = vec4(c1 + c2 + c3);
}
`;

export { postprocess_fs, postprocess_vs };