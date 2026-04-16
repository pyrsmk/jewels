import { EffectInterface } from '../core/EffectInterface.js';

export class BlockGlitch2Effect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      bg2: 0.20,
      bg2Speed: 2.00,
      bg2Scale: 1.50,
    };
    super({ ...defaults, ...options },
      ['bg2', 'bg2Speed', 'bg2Scale'],
      ['bg2Val', 'bg2SpeedVal', 'bg2ScaleVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_bg2, +(this.options.bg2 ?? 0.20));
    gl.uniform1f(locs.u_bg2Speed, +(this.options.bg2Speed ?? 2.00));
    gl.uniform1f(locs.u_bg2Scale, 1.0 / Math.max(+(this.options.bg2Scale ?? 1.50), 0.001));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_bg2;
  uniform float u_bg2Speed;
  uniform float u_bg2Scale;`;
  }

  getPostShaderGuards() {
    return `
    bool hasBg2 = (u_bg2 > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasBg2';
  }

  getPostShaderHelpers() {
    return `
  vec3 applyBlockGlitch2(vec3 color, vec2 uv, float time) {
    time = mod(time, 3600.0);
    float t = floor(time * (2.0 + u_bg2Speed * 3.0));
    float scale = 6.0 + u_bg2Scale * 10.0;
    vec2 grid = vec2(14.0, 8.0) * scale;
    vec2 cell = floor(uv * grid);
    float gate = smoothstep(0.78, 0.995, noise21(cell + vec2(t, 7.0)));
    vec2 offs = vec2(
      (noise21(cell + vec2(17.0, t * 0.71)) - 0.5) * 0.28,
      (noise21(cell + vec2(47.0, t * 0.53)) - 0.5) * 0.10
    ) * u_bg2;
    vec3 block = sampleScene(clamp((cell + 0.5) / grid + offs, 0.0, 1.0));
    block = mix(block, block.bgr, smoothstep(0.55, 0.95, noise21(cell + vec2(91.0, t))));
    return mix(color, block, clamp(gate * u_bg2 * 0.5, 0.0, 1.0));
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasBg2) {
      combined = applyBlockGlitch2(combined, uv, u_time);
    }`;
  }
}