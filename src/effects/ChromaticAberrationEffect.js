import { EffectInterface } from '../core/EffectInterface.js';

export class ChromaticAberrationEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      chromaticMode: 'edges',
      chromaticWidth: 0.55,
      chromaticOffset: 0.75,
    };
    super({ ...defaults, ...options },
      ['chromaticMode', 'chromaticWidth', 'chromaticOffset'],
      ['chromaticWidthVal', 'chromaticOffsetVal']
    );
  }

  getRebuildKey(context = {}) {
    return 'chromatic';
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(
      locs.u_chromaticMode,
      (this.options.chromaticMode ?? 'edges') === 'edges' ? 1.0 : 0.0
    );
    gl.uniform1f(locs.u_chromaticWidth, +(this.options.chromaticWidth ?? 0.55));
    gl.uniform1f(locs.u_chromaticOffset, +(this.options.chromaticOffset ?? 0.75));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_chromaticMode;
  uniform float u_chromaticWidth;
  uniform float u_chromaticOffset;`;
  }

  getPostShaderHelpers() {
    return `
  vec3 applyChromaticAberration(vec2 uv, vec2 px) {
    vec3 base = sampleScene(uv);
    vec3 chromatic;
    if (u_chromaticMode < 0.5) {
      vec2 shift = px * (1.25 * u_chromaticOffset);
      chromatic.r = sampleScene(uv + shift).r;
      chromatic.g = base.g;
      chromatic.b = sampleScene(uv - shift).b;
    } else {
      vec2 centered = uv - 0.5;
      vec2 rect = abs(centered) * 2.0;
      float edgeMetric = max(rect.x, rect.y);
      float edgeStart = clamp(1.0 - u_chromaticWidth, 0.0, 0.99);
      float edge = smoothstep(edgeStart, 1.0, edgeMetric);
      float dirLen = length(centered);
      vec2 dir = dirLen > 0.0001 ? centered / dirLen : vec2(0.0);
      vec2 shift = dir * px * (1.25 * u_chromaticOffset + edge * 5.0 * u_chromaticOffset) * edge;
      chromatic.r = sampleScene(uv + shift).r;
      chromatic.g = base.g;
      chromatic.b = sampleScene(uv - shift).b;
    }
    return chromatic;
  }`;
  }

  getPostShaderPreCode() {
    return `
    combined = applyChromaticAberration(uv, px);`;
  }
}