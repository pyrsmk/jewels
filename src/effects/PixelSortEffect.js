import { EffectInterface } from '../core/EffectInterface.js';

export class PixelSortEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      hGlitch: 1.0,
      hGlitchSpeed: 1.20,
      hGlitchScale: 0,
    };
    super({ ...defaults, ...options },
      ['hGlitch', 'hGlitchSpeed', 'hGlitchScale'],
      ['hGlitchVal', 'hGlitchSpeedVal', 'hGlitchScaleVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_hGlitch, +(this.options.hGlitch ?? 1.0));
    gl.uniform1f(locs.u_hGlitchSpeed, +(this.options.hGlitchSpeed ?? 1.20));
    gl.uniform1f(locs.u_hGlitchScale, +(this.options.hGlitchScale ?? 0));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_hGlitch;
  uniform float u_hGlitchSpeed;
  uniform float u_hGlitchScale;`;
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
    for (int i = -4; i <= 4; i++) {
      if (i == 0) continue;
      vec3 s = sampleScene(uv + vec2(len * float(i), 0.0));
      float lum = dot(s, vec3(0.2126, 0.7152, 0.0722));
      if (lum > bestLum) {
        bestLum = lum;
        best = s;
      }
    }
    return mix(color, best, clamp(band * u_hGlitch, 0.0, 1.0));
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasHGlitch) {
      combined = applyPixelSort(combined, uv, u_time);
    }`;
  }
}