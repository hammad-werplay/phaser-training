precision mediump float;

uniform float time;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main() {
    vec2 uv = outTexCoord;
    
    // Wavy distortion
    uv.y += 0.03 * sin(uv.x * 20.0 + time * 3.0);
    
    vec4 color = texture2D(uMainSampler, uv);

    // Output with alpha preserved
    gl_FragColor = color;
}
