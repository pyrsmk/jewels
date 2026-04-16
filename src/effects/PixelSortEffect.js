import { EffectInterface } from '../core/EffectInterface.js';

export class PixelSortEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      hGlitch: 0.20,
      hGlitchSpeed: 1.40,
      hGlitchScale: 2.50,
      hGlitchThreshold: 0.05,
    };
    super({ ...defaults, ...options },
      ['hGlitch', 'hGlitchSpeed', 'hGlitchScale', 'hGlitchThreshold'],
      ['hGlitchVal', 'hGlitchSpeedVal', 'hGlitchScaleVal', 'hGlitchThresholdVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_hGlitch, +(this.options.hGlitch ?? 0.20));
    gl.uniform1f(locs.u_hGlitchSpeed, +(this.options.hGlitchSpeed ?? 1.40));
    gl.uniform1f(locs.u_hGlitchScale, +(this.options.hGlitchScale ?? 2.50));
    gl.uniform1f(locs.u_hGlitchThreshold, +(this.options.hGlitchThreshold ?? 0.05));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_hGlitch;
  uniform float u_hGlitchSpeed;
  uniform float u_hGlitchScale;
  uniform float u_hGlitchThreshold;`;
  }

  getPostShaderGuards() {
    return `
    bool hasHGlitch = (u_hGlitch > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasHGlitch';
  }

  getPostShaderHelpers() {
    return `
  vec3 applyPixelSort(vec3 color, vec2 uv, float time) {
    time = mod(time, 3600.0);
    float t = time * (0.5 + u_hGlitchSpeed * 1.2);
    float len = (0.004 + 0.035 * u_hGlitch) * (0.8 + 0.35 * u_hGlitchScale);
    float band = smoothstep(0.56, 0.95, noise21(vec2(
      floor(uv.y * (60.0 + 60.0 * u_hGlitchScale)),
      floor(t * 3.0)
    )));
    vec3 best = color;
    float bestLum = dot(best, vec3(0.2126, 0.7152, 0.0722));
    for (int i = 1; i <= 4; i++) {
      float fi = float(i);
      vec3 s = sampleScene(uv + vec2(len * fi, 0.0));
      float lum = dot(s, vec3(0.2126, 0.7152, 0.0722));
      if (lum > bestLum) {
        bestLum = lum;
        best = s;
      }
    }
    float sourceLum = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float sourceMask = smoothstep(u_hGlitchThreshold * 0.15, u_hGlitchThreshold, sourceLum);
    return mix(color, best, clamp(band * u_hGlitch * 0.45 * sourceMask, 0.0, 1.0));
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasHGlitch) {
      combined = applyPixelSort(combined, uv, u_time);
    }`;
  }
}