import { EffectInterface } from '../core/EffectInterface.js';

export class TemporalGhost2Effect extends EffectInterface {
  static uiTitle = 'Temporal Ghosting 2';

  constructor(options = {}) {
    const defaults = {
      tg2Opacity: 0.50,
      tg2: 0.20,
      tg2RgbShift: 0.80,
      tg2Speed: 1.20,
      tg2Scale: 1.50,
    };
    super({ ...defaults, ...options },
      ['tg2Opacity', 'tg2', 'tg2RgbShift', 'tg2Speed', 'tg2Scale'],
      ['tg2OpacityVal', 'tg2Val', 'tg2RgbShiftVal', 'tg2SpeedVal', 'tg2ScaleVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_tg2, +(this.options.tg2 ?? 0.20));
    gl.uniform1f(locs.u_tg2Opacity, +(this.options.tg2Opacity ?? 0.50));
    gl.uniform1f(locs.u_tg2RgbShift, +(this.options.tg2RgbShift ?? 0.80));
    gl.uniform1f(locs.u_tg2Speed, +(this.options.tg2Speed ?? 1.20));
    gl.uniform1f(locs.u_tg2Scale, +(this.options.tg2Scale ?? 1.50));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_tg2;
  uniform float u_tg2Opacity;
  uniform float u_tg2RgbShift;
  uniform float u_tg2Speed;
  uniform float u_tg2Scale;`;
  }

  getPostShaderGuards() {
    return `
    bool hasTg2 = (u_tg2 > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasTg2';
  }

  getPostShaderHelpers() {
    return `
  vec3 applyTemporalGhost2(vec3 color, vec2 uv, float time) {
    float t = time * (0.5 + u_tg2Speed);
    vec2 jitterA = vec2(
      noise21(uv * (8.0 + u_tg2Scale * 4.0) + vec2(t, 1.7)) - 0.5,
      noise21(uv.yx * (7.0 + u_tg2Scale * 3.0) + vec2(-t, 3.9)) - 0.5
    ) * (0.03 * u_tg2 * (0.6 + 0.4 * u_tg2Scale));
    vec2 rgbShift = vec2(
      noise21(uv * (11.0 + u_tg2Scale * 2.0) + vec2(t * 1.7, 9.3)) - 0.5,
      noise21(uv.yx * (10.0 + u_tg2Scale * 2.5) + vec2(-t * 1.3, 5.1)) - 0.5
    ) * (0.012 * u_tg2RgbShift);
    vec3 ghostBase = texture2D(u_prev, clamp(uv + jitterA, 0.0, 1.0)).rgb;
    vec3 ghostRgb;
    ghostRgb.r = texture2D(u_prev, clamp(uv + jitterA + rgbShift, 0.0, 1.0)).r;
    ghostRgb.g = ghostBase.g;
    ghostRgb.b = texture2D(u_prev, clamp(uv + jitterA - rgbShift, 0.0, 1.0)).b;
    float chromaMask = smoothstep(0.0, 0.2, u_tg2RgbShift);
    vec3 ghost = mix(ghostBase, ghostRgb, chromaMask);
    vec3 effected = clamp(color + ghost * (0.55 * u_tg2), 0.0, 1.0);
    return mix(color, effected, clamp(u_tg2Opacity, 0.0, 1.0));
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasTg2) {
      combined = applyTemporalGhost2(combined, uv, u_time);
    }`;
  }
}