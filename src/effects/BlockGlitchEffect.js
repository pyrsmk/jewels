import { EffectInterface } from '../core/EffectInterface.js';

export class BlockGlitchEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      blockGlitch: 0.20,
      blockGlitchSpeed: 2.00,
      blockGlitchScale: 1.50,
    };
    super({ ...defaults, ...options },
      ['blockGlitch', 'blockGlitchSpeed', 'blockGlitchScale'],
      ['blockGlitchVal', 'blockGlitchSpeedVal', 'blockGlitchScaleVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_blockGlitch, +(this.options.blockGlitch ?? 0.20));
    gl.uniform1f(locs.u_blockGlitchSpeed, +(this.options.blockGlitchSpeed ?? 2.00));
    gl.uniform1f(locs.u_blockGlitchScale, +(this.options.blockGlitchScale ?? 1.50));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_blockGlitch;
  uniform float u_blockGlitchSpeed;
  uniform float u_blockGlitchScale;`;
  }

  getPostShaderGuards() {
    return `
    bool hasBlockGlitch = (u_blockGlitch > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasBlockGlitch';
  }

  getPostShaderHelpers() {
    return `
  vec3 applyBlockGlitch(vec3 color, vec2 uv, float time) {
    time = mod(time, 3600.0);
    float scale = 1.0 / max(u_blockGlitchScale, 0.001);
    vec2 grid = floor(uv * vec2(18.0, 10.0) * scale);
    float t = time * u_blockGlitchSpeed;
    float mask = step(0.72, noise21(grid + vec2(floor(t * 3.0), 7.0)));
    vec2 shift = vec2(
      (noise21(grid + 11.3) - 0.5) * 0.08,
      (noise21(grid + 41.7) - 0.5) * 0.03
    ) * u_blockGlitch;
    return mix(
      color,
      sampleScene(clamp(uv + shift * mask, 0.0, 1.0)),
      clamp(mask * u_blockGlitch, 0.0, 1.0)
    );
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasBlockGlitch) {
      combined = applyBlockGlitch(combined, uv, u_time);
    }`;
  }
}