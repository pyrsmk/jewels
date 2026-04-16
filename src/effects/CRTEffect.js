import { EffectInterface } from '../core/EffectInterface.js';

export class CRTEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      crt: 0.60,
      crtScanlines: 0.40,
      crtScanlinesSize: 2.0,
      crtFlicker: 0.25,
      crtVignette: 0.02,
      crtPhosphore: 0.20,
    };
    super({ ...defaults, ...options },
      ['crt', 'crtScanlines', 'crtScanlinesSize', 'crtFlicker', 'crtVignette', 'crtPhosphore'],
      ['crtVal', 'crtScanlinesVal', 'crtScanlinesSizeVal', 'crtFlickerVal', 'crtVignetteVal', 'crtPhosphoreVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_crt, +(this.options.crt ?? 0.60));
    gl.uniform1f(locs.u_crtScanlines, +(this.options.crtScanlines ?? 0.40));
    gl.uniform1f(locs.u_crtScanlinesSize, +(this.options.crtScanlinesSize ?? 2.0));
    gl.uniform1f(locs.u_crtFlicker, +(this.options.crtFlicker ?? 0.25));
    gl.uniform1f(locs.u_crtVignette, +(this.options.crtVignette ?? 0.02));
    gl.uniform1f(locs.u_crtPhosphore, +(this.options.crtPhosphore ?? 0.20));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_crt;
  uniform float u_crtScanlines;
  uniform float u_crtScanlinesSize;
  uniform float u_crtFlicker;
  uniform float u_crtVignette;
  uniform float u_crtPhosphore;`;
  }

  getPostShaderGuards() {
    return `
    bool hasCrt = (u_crt > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasCrt';
  }

  getPostShaderHelpers() {
    return `
  vec3 applyCRT(vec3 color, vec2 uv, float time) {
    vec3 result = color;
    time = mod(time, 3600.0);

    // Scanlines
    if (u_crtScanlines > 0.001) {
      float lineSize = max(u_crtScanlinesSize, 1.0);
      float line = mod(floor(uv.y * u_resolution.y / lineSize), 2.0);
      float scanMask = 1.0 - line * u_crtScanlines * 0.6;
      result *= scanMask;
    }

    // Flickering par bande horizontale
    if (u_crtFlicker > 0.001) {
      float ft = floor(time * 18.0);
      float band = floor(uv.y * 12.0);
      float flicker = noise21(vec2(band, ft)) * 2.0 - 1.0;
      float bandFlicker = 1.0 + flicker * u_crtFlicker * 0.18;
      float globalFlicker = 1.0 + (noise21(vec2(ft * 0.3, 7.1)) - 0.5) * u_crtFlicker * 0.08;
      result *= bandFlicker * globalFlicker;
    }

    // Vignette
    if (u_crtVignette > 0.0001) {
      vec2 vig = uv * 2.0 - 1.0;
      float radial = vig.x * vig.x + vig.y * vig.y;
      result *= clamp(1.0 - u_crtVignette * 20.0 * radial, 0.0, 1.0);
    }

    // Phosphore : frange verte persistante décalée d'un pixel
    if (u_crtPhosphore > 0.001) {
      vec2 shift = vec2(0.0, 1.0 / u_resolution.y);
      vec3 prev = sampleScene(clamp(uv + shift, 0.0, 1.0));
      vec3 phosphore = vec3(prev.r * 0.18, prev.g * 0.55, prev.b * 0.18);
      result = clamp(result + phosphore * u_crtPhosphore, 0.0, 1.0);
    }

    return mix(color, result, clamp(u_crt, 0.0, 1.0));
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasCrt) {
      combined = applyCRT(combined, uv, u_time);
    }`;
  }
}