let atrous_vs = `
varying vec2 vUv;

void main() {
    gl_Position = vec4(position, 1.0);
    vUv = uv;
}
`;

let atrous_fs = `varying vec2 vUv;

uniform sampler2D uMaterial;
uniform sampler2D uRadiance;
uniform sampler2D uPosition;
uniform sampler2D uNormal;
uniform sampler2D uHistoryAccum;
uniform float uFilterHistoryModulation;
uniform float uMaxFramesHistory;
uniform float uStep;
uniform vec2  uScreenSize;
uniform float uC_phi;
uniform float uN_phi;
uniform float uP_phi;
uniform float uH_phi;
uniform float uIteration;


void main() {

    #ifdef atrous5x5
    float kernel[25];
    kernel[20] = 0.00390625; kernel[21] = 0.015625; kernel[22] = 0.0234375; kernel[23] = 0.015625; kernel[24] = 0.00390625;
    kernel[15] = 0.015625;   kernel[16] = 0.0625;   kernel[17] = 0.09375;   kernel[18] = 0.0625;   kernel[19] = 0.015625;
    kernel[10] = 0.0234375;  kernel[11] = 0.09375;  kernel[12] = 0.140625;  kernel[13] = 0.09375;  kernel[14] = 0.0234375;
    kernel[5]  = 0.015625;   kernel[6]  = 0.0625;   kernel[7]  = 0.09375;   kernel[8]  = 0.0625;   kernel[9]  = 0.015625;
    kernel[0]  = 0.00390625; kernel[1]  = 0.015625; kernel[2]  = 0.0234375; kernel[3]  = 0.015625; kernel[4]  = 0.00390625;

    vec2 offs[25];
    offs[20] = vec2(-2.0, +2.0); offs[21] = vec2(-1.0, +2.0); offs[22] = vec2(+0.0, +2.0); offs[23] = vec2(+1.0, +2.0); offs[24] = vec2(+2.0, +2.0);
    offs[15] = vec2(-2.0, +1.0); offs[16] = vec2(-1.0, +1.0); offs[17] = vec2(+0.0, +1.0); offs[18] = vec2(+1.0, +1.0); offs[19] = vec2(+2.0, +1.0);
    offs[10] = vec2(-2.0, +0.0); offs[11] = vec2(-1.0, +0.0); offs[12] = vec2(+0.0, +0.0); offs[13] = vec2(+1.0, +0.0); offs[14] = vec2(+2.0, +0.0);
    offs[5]  = vec2(-2.0, -1.0); offs[6]  = vec2(-1.0, -1.0); offs[7]  = vec2(+0.0, -1.0); offs[8]  = vec2(+1.0, -1.0); offs[9]  = vec2(+2.0, -1.0);
    offs[0]  = vec2(-2.0, -2.0); offs[1]  = vec2(-1.0, -2.0); offs[2]  = vec2(+0.0, -2.0); offs[3]  = vec2(+1.0, -2.0); offs[4]  = vec2(+2.0, -2.0);
    const int loopSteps = 25;
    #endif


    #ifdef atrous3x3
    float kernel[9];
    kernel[6] = 0.0625; kernel[7] = 0.125; kernel[8] = 0.0625;
    kernel[3] = 0.125;  kernel[4] = 0.25;  kernel[5] = 0.125; 
    kernel[0] = 0.0625; kernel[1] = 0.125; kernel[2] = 0.0625;

    vec2 offs[9];
    offs[6] = vec2(-1.0, +1.0); offs[7] = vec2(+0.0, +1.0); offs[8] = vec2(+1.0, +1.0);
    offs[3] = vec2(-1.0, +0.0); offs[4] = vec2(+0.0, +0.0); offs[5] = vec2(+1.0, +0.0);
    offs[0] = vec2(-1.0, -1.0); offs[1] = vec2(+0.0, -1.0); offs[2] = vec2(+1.0, -1.0);
    const int loopSteps = 9;
    #endif


    float c_phi = uC_phi;
    float n_phi = uN_phi;
    float p_phi = uP_phi;
    float h_phi = uH_phi;
    float stepwidth = uStep;

    vec4 sum = vec4(0.0);
    vec2 step  = vec2(1./uScreenSize.x, 1./uScreenSize.y);
    vec2 hstep = step * 0.0;
    vec4 cval = texture2D(uRadiance, vUv.st + hstep);
    vec4 nval = texture2D(uNormal,   vUv.st + hstep);
    vec4 pval = texture2D(uPosition, vUv.st + hstep);
    if(pval == vec4(0.0, 0.0, 0.0, 0.0)) {
        gl_FragColor = cval;
        return;
    }
    vec4 hval = texture2D(uHistoryAccum, vUv.st + hstep);


    float history = texture2D(uHistoryAccum, vUv.st + hstep).x;
    // here I'm multiplying the history by 0.5 because the
    // perceived variance in the samples that are exactly at maxFrameHistory
    // is almost 2x lower than the samples that are at maxFrameHistory * 2
    // in practice: if some fragments have been accumulated 40 times each 
    // (with maxframehis. == 20) they will show a much reduced variance 
    // compared to a set of fragments that have been accumulated for 20 frames.
    // So essentially when a frame is at "uMaxFramesHistory * 2", it will have the same 
    // perceived variance of the frames that have accumulated much 
    // longer than $uMaxFramesHistory
    float clampedHistory = min(history * 0.5, uMaxFramesHistory);
    stepwidth *= 1.0 - (1.0 - (uMaxFramesHistory - clampedHistory) / uMaxFramesHistory) * uFilterHistoryModulation;
    // stepwidth *= history >= uMaxFramesHistory * 4.0 ? 0.0 : 1.0;

    // **************** mirror-like materials
    vec4 material = texture2D(uMaterial, vUv.st + hstep);
    if(material.x < 0.9) stepwidth *= 0.5;
    // **************** mirror-like materials






    float aggressivity = clamp(1.0 - ((hval.x) / uMaxFramesHistory), 0.1, 1.0) * 4.0; 
    aggressivity = max(aggressivity, 1.0);
    // if the history is low, be less aggressive with the restrictions
    n_phi *= aggressivity;
    // p_phi *= aggressivity;

    // if(pval.y < -4.95) {
    //     stepwidth *= 2.5;
    //     p_phi *= length(pval) / 0.375;
    // }


    float cum_w = 0.0;
    for(int i = 0; i < loopSteps; i++) {
        vec2 uv = vUv.st + hstep + offs[i] * step * stepwidth;

        vec4 ctmp = texture2D(uRadiance, uv);
        vec4 t = cval - ctmp;
        float dist2 = dot(t,t);
        float c_w = min(exp(-(dist2)/c_phi), 1.0);

        vec4 ntmp = texture2D(uNormal, uv);
        t = nval - ntmp;
        dist2 = max(dot(t,t)/(stepwidth*stepwidth),0.0);
        float n_w = min(exp(-(dist2)/n_phi), 1.0);

        vec4 ptmp = texture2D(uPosition, uv);
        t = pval - ptmp;
        dist2 = dot(t,t);
        float p_w;
        p_w = min(exp(-(dist2)/p_phi), 1.0);

        // float htmp = texture2D(uHistoryAccum, uv).x;
        // float h_w = ((htmp + 1.0) / uMaxFramesHistory) * h_phi;

        // float htmp = texture2D(uHistoryAccum, uv).x;
        // float h_w  = 1.0;
        // // // i nuovi sono attratti dai vecchi
        // if(hval.x < 1.0 && htmp >= (uMaxFramesHistory - 1.0)) {
        //     h_w = ((htmp + 1.0) / uMaxFramesHistory) * h_phi;
        //     p_w = pow(p_w, 0.3);
        //     n_w = pow(n_w, 0.3);

        //     // sum = ctmp;
        //     // cum_w = 1.0;
        //     // break;
        // }
        // if(hval.x < 1.0 && htmp < (uMaxFramesHistory - 1.0) && uMaxFramesHistory > 5.0) {
        //     continue;
        // }

        // // i vecchi NON sono attratti dai nuovi
        // if(hval.x >= 1.0 && htmp < (hval.x - 1.0)) {
        //     h_w = 0.0000001;
        // }


        
        // float weight = c_w * n_w * p_w * h_w;
        float weight = c_w * n_w * p_w;
        sum += ctmp * weight * kernel[i];

        cum_w += weight * kernel[i];
    }





    // if(hval.x < (uMaxFramesHistory - 1.0)){ 
    if(hval.x < (uMaxFramesHistory - 1.0) && uIteration < 2.5) {
        
        float best_w  = 0.0;
        vec4 best_col = vec4(0.0);
        for(int i = 0; i < loopSteps; i++) {
            vec2 uv = vUv.st + hstep + offs[i] * step * stepwidth;
        
            vec4 ctmp = texture2D(uRadiance, uv);
            vec4 t = cval - ctmp;
            float dist2 = dot(t,t);
            float c_w = min(exp(-(dist2)/c_phi), 1.0);

            vec4 ntmp = texture2D(uNormal, uv);
            t = nval - ntmp;
            dist2 = max(dot(t,t)/(stepwidth*stepwidth),0.0);
            float n_w = min(exp(-(dist2)/n_phi), 1.0);

            vec4 ptmp = texture2D(uPosition, uv);
            t = pval - ptmp;
            dist2 = dot(t,t);
            float p_w = min(exp(-(dist2)/p_phi), 1.0);

            float htmp = texture2D(uHistoryAccum, uv).x;

            float weight = n_w * p_w;

            if(htmp >= (uMaxFramesHistory - 1.0) && weight > best_w) {
                best_w = weight;
                best_col = ctmp;
            }
        }

        if(best_w != 0.0) {
            float t = 0.9;
            if(uIteration > 0.5) t = 0.65;
            if(uIteration > 1.5) t = 0.35;

            sum = best_col * t + sum * (1.0 - t);
            cum_w = 1.0;
        }

        // if(best_w != 0.0 && uIteration < 5.0) {
        //     float t = best_w / (cum_w + best_w);
        //     sum = sum / cum_w * (1.0 - t) + best_col * (t);
        //     cum_w = 1.0;
        // }
    }












    if(length(sum) == 0.0 || cum_w == 0.0) {
        sum = cval;
        cum_w = 1.0;
    }
    
    vec4 color = sum / cum_w;

    gl_FragColor = color;
}
`;

export { atrous_fs, atrous_vs };