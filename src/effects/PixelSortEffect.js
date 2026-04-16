import { EffectInterface } from '../core/EffectInterface.js';

export class PixelSortEffect extends EffectInterface {
  static uiTitle = 'Pixel Sorting local';

  constructor(options = {}) {
    const defaults = {
      pixelSort: 0.20,
      pixelSortSpeed: 1.40,
      pixelSortScale: 2.50,
      pixelSortThreshold: 0.05,
    };
    super({ ...defaults, ...options },
      ['pixelSort', 'pixelSortSpeed', 'pixelSortScale', 'pixelSortThreshold'],
      ['pixelSortVal', 'pixelSortSpeedVal', 'pixelSortScaleVal', 'pixelSortThresholdVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_pixelSort, +(this.options.pixelSort ?? 0.20));
    gl.uniform1f(locs.u_pixelSortSpeed, +(this.options.pixelSortSpeed ?? 1.40));
    gl.uniform1f(locs.u_pixelSortScale, +(this.options.pixelSortScale ?? 2.50));
    gl.uniform1f(locs.u_pixelSortThreshold, +(this.options.pixelSortThreshold ?? 0.05));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_pixelSort;
  uniform float u_pixelSortSpeed;
  uniform float u_pixelSortScale;
  uniform float u_pixelSortThreshold;`;
  }

  getPostShaderGuards() {
    return `
    bool hasPixelSort = (u_pixelSort > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasPixelSort';
  }

  getPostShaderHelpers() {
    return `
  vec3 applyPixelSort(vec3 color, vec2 uv, float time) {
    float t = time * (0.5 + u_pixelSortSpeed * 1.2);
    float len = (0.004 + 0.035 * u_pixelSort) * (0.8 + 0.35 * u_pixelSortScale);
    float band = smoothstep(0.56, 0.95, noise21(vec2(
      floor(uv.y * (60.0 + 60.0 * u_pixelSortScale)),
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
    float sourceMask = smoothstep(u_pixelSortThreshold * 0.15, u_pixelSortThreshold, sourceLum);
    return mix(color, best, clamp(band * u_pixelSort * 0.45 * sourceMask, 0.0, 1.0));
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasPixelSort) {
      combined = applyPixelSort(combined, uv, u_time);
    }`;
  }
}