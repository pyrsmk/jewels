import { EffectInterface } from '../core/EffectInterface.js';

export class BlockGlitch3Effect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      bg3: 1.50,
      bg3Speed: 1.50,
      bg3Scale: 1.50,
    };
    super({ ...defaults, ...options },
      ['bg3', 'bg3Speed', 'bg3Scale'],
      ['bg3Val', 'bg3SpeedVal', 'bg3ScaleVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_bg3, +(this.options.bg3 ?? 1.50));
    gl.uniform1f(locs.u_bg3Speed, +(this.options.bg3Speed ?? 1.50));
    gl.uniform1f(locs.u_bg3Scale, +(this.options.bg3Scale ?? 1.50));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_bg3;
  uniform float u_bg3Speed;
  uniform float u_bg3Scale;`;
  }

  getPostShaderGuards() {
    return `
    bool hasBg3 = (u_bg3 > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasBg3';
  }

  getPostShaderHelpers() {
    return `
  vec3 applyBlockGlitch3(vec3 color, vec2 uv, float time) {
    time = mod(time, 3600.0);
    float scale = max(u_bg3Scale, 0.001);
    float phase = floor(time * u_bg3Speed * 6.0);
    vec2 grid = floor(uv * vec2(32.0, 18.0) * scale);
    float gate = step(0.78, noise21(grid + vec2(phase, 13.0)));
    vec2 motion = vec2(
      (noise21(grid + vec2(phase, 3.0)) - 0.5) * 0.05,
      (noise21(grid + vec2(phase, 9.0)) - 0.5) * 0.02
    ) * u_bg3;
    vec3 prev = texture2D(u_prev, clamp(uv + motion, 0.0, 1.0)).rgb;
    return mix(color, prev, gate * clamp(u_bg3, 0.0, 1.0));
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasBg3) {
      combined = applyBlockGlitch3(combined, uv, u_time);
    }`;
  }
}