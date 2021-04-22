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
uniform vec4      uPointer [10];
uniform float     uAspect;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {

    vec2 uv = vUv;

    // pointer distortion
    float intref = 0.0;

    // editable parameters
    // float intensityMult  = 0.6;
    // float spreadIntMult  = 0.02;
    // float spreadRandMult = 0.01;
    
    float spreadIntMult = 0.02;
    float spreadRandMult = 0.0;
    // float brightnessMult = 1.1;

    for(int i = 0; i < 10; i++) {
        vec2  puv   = uPointer[i].xy;
        float ptime = uPointer[i].z * 1.475;
        
        float intensityMult  = 0.2;
    
        float dist        = length((vUv - puv) * vec2(uAspect, 1.0));
        float radTimeMult = 0.2;
        float rad         = 0.3;  

        if(uPointer[i].w > 0.5) {
            intensityMult = 0.35;
            rad = 0.51;
            ptime = uPointer[i].z * 0.975;
        }

        if(dist < rad && ptime < 1.0) {
            // float intensity = ptime < 0.5 ? ptime * 2.0 : (ptime - 0.5) * 2.0;
            float pyrTime = ptime < 0.5 ? 
                smoothstep(0.0, 1.0, ptime * 2.0) : 
                smoothstep(0.0, 1.0, 1.0 - (ptime - 0.5) * 2.0);
    
    
            float rangeLength = 1.0;
            // questa era la linea originale che ha senso matematicamente, quella
            // sotto da solo l'idea di essere più "reattiva"
            // float rangeStart  = -rangeLength + ptime * (1.0 + rangeLength); 
            float rangeStart  = -rangeLength * 0.5 + ptime * (1.0 + rangeLength); 
            float rangeEnd    = rangeLength + rangeStart;
    
            float t = dist / rad;
            t = (t - rangeStart) / rangeLength;
            t = clamp(t, 0.0, 1.0);
            
            // pyramided t
            float pt = t < 0.5 ? 
                smoothstep(0.0, 1.0, t * 2.0) : 
                smoothstep(0.0, 1.0, 1.0 - (t - 0.5) * 2.0);
    
            t = sin(t * 6.28 * 2.0) * pt;
    
            float intensity = t * intensityMult;
    
            // at the end of the range we want it faded
            if(dist > rad - 0.05) {
                intensity *= 1.0 - (dist - (rad - 0.05)) / 0.05;
            }
            intref += intensity;
    
            vec2 dir = normalize(vUv - puv);
            uv += dir * 0.03 * (intensity);
        }
    }
   


    float dist_from_hor_center = abs(uv.x - 0.5);
    float spread = 0.004 * dist_from_hor_center;

    spread += intref * spreadIntMult;
    spread += (rand(uv) * 2.0 - 1.0) * intref * spreadRandMult;


    // vec2 offs = normalize(uv - vec2(0.5)) * spread;
    vec2 offs = vec2(spread, 0.0);

    
    vec4 c1 = texture2D(uTexture, uv + offs);
    vec4 c2 = texture2D(uTexture, uv);
    vec4 c3 = texture2D(uTexture, uv - offs);

    c1 *= vec4(1.0, 0.2, 0.0, 1.0);
    c2 *= vec4(0.0, 0.6, 0.0, 1.0);
    c3 *= vec4(0.0, 0.2, 1.0, 1.0);

    vec4 fcol = c1 + c2 + c3;
    // fcol *= (1.0 + brightnessMult * intref);

    gl_FragColor = vec4(fcol);
}
`;

export { postprocess_fs, postprocess_vs };