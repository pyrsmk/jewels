import { EffectInterface } from '../core/EffectInterface.js';

export class ChromaticNoiseEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      chromaticNoise: 4.00,
      chromaticNoiseSpeed: 2.10,
      chromaticNoiseScale: 2.80,
    };
    super({ ...defaults, ...options },
      ['chromaticNoise', 'chromaticNoiseSpeed', 'chromaticNoiseScale'],
      ['chromaticNoiseVal', 'chromaticNoiseSpeedVal', 'chromaticNoiseScaleVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_chromaticNoise, +(this.options.chromaticNoise ?? 4.00));
    gl.uniform1f(locs.u_chromaticNoiseSpeed, +(this.options.chromaticNoiseSpeed ?? 2.10));
    gl.uniform1f(locs.u_chromaticNoiseScale, +(this.options.chromaticNoiseScale ?? 2.80));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_chromaticNoise;
  uniform float u_chromaticNoiseSpeed;
  uniform float u_chromaticNoiseScale;`;
  }

  getPostShaderGuards() {
    return `
    bool hasChromaticNoise = (u_chromaticNoise > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasChromaticNoise';
  }

  getPostShaderHelpers() {
    return `
  vec3 chromaticNoise(vec2 uv, vec2 fragCoord, float time) {
    time = mod(time, 3600.0);
    float scale = max(u_chromaticNoiseScale, 0.001);
    vec2 pFine = fragCoord * (0.009 * scale);
    vec2 pCoarse = fragCoord * (0.0035 * scale);
    float t = time * u_chromaticNoiseSpeed;
    vec3 fine = vec3(
      noise21(pFine + vec2(t * 0.83, -t * 0.41) + 7.1),
      noise21(pFine * 1.23 + vec2(-t * 0.57, t * 0.91) + 29.4),
      noise21(pFine * 0.91 + vec2(t * 1.09, t * 0.37) + 53.8)
    ) - 0.5;
    vec3 coarse = vec3(
      noise21(pCoarse + vec2(-t * 0.21, t * 0.17) + 11.0),
      noise21(pCoarse * 1.07 + vec2(t * 0.13, -t * 0.19) + 37.0),
      noise21(pCoarse * 0.94 + vec2(-t * 0.16, t * 0.23) + 71.0)
    ) - 0.5;
    vec3 n = fine * 0.65 + coarse * 0.95;
    return n * (0.34 * u_chromaticNoise);
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasChromaticNoise) {
      float lum3 = dot(combined, vec3(0.2126, 0.7152, 0.0722));
      float noiseMask = max(srcAlpha, clamp(lum3, 0.0, 1.0));
      combined += chromaticNoise(uv, gl_FragCoord.xy, u_time) * noiseMask;
    }`;
  }
}