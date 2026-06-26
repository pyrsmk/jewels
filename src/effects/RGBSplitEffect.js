import { EffectInterface } from '../core/EffectInterface.js';

export class RGBSplitEffect extends EffectInterface {
  constructor(options = {}) {
    const defaults = {
      intensity: 1.8,
      speed: 2.20,
      scale: 2.00,
    };
    super({ ...defaults, ...options },
      ['intensity', 'speed', 'scale'],
      ['intensityVal', 'speedVal', 'scaleVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_rgbSplit, +(this.options.intensity ?? 1.8));
    gl.uniform1f(locs.u_rgbSplitSpeed, +(this.options.speed ?? 2.20));
    gl.uniform1f(locs.u_rgbSplitScale, +(this.options.scale ?? 2.00));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_rgbSplit;
  uniform float u_rgbSplitSpeed;
  uniform float u_rgbSplitScale;`;
  }

  getPostShaderGuards() {
    return `
    bool hasRgbSplit = (u_rgbSplit > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasRgbSplit';
  }

  getPostShaderHelpers() {
    return `
  vec3 applyRgbSplit(vec3 color, vec2 uv, float time) {
    time = mod(time, 3600.0);
    float t = time * (0.7 + u_rgbSplitSpeed * 1.4);
    float scale = 0.7 + u_rgbSplitScale * 1.6;
    vec2 cell = floor(uv * vec2(24.0, 14.0) * scale);
    float event = smoothstep(0.62, 0.98, noise21(cell + vec2(floor(t * 2.0), 13.0)));
    vec2 dir = normalize(
      vec2(noise21(cell + 21.0) - 0.5, noise21(cell + 57.0) - 0.5) + vec2(0.001, 0.0)
    );
    vec2 shift = dir * event * u_rgbSplit * (0.008 + 0.02 * noise21(cell + 89.0));
    vec3 split;
    split.r = sampleScene(uv + shift).r;
    split.g = sampleScene(uv).g;
    split.b = sampleScene(uv - shift).b;
    return mix(color, split, clamp(event * u_rgbSplit * 0.55, 0.0, 1.0));
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasRgbSplit) {
      combined = applyRgbSplit(combined, uv, u_time);
    }`;
  }
}
