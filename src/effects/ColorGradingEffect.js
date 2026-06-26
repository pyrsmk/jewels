import { EffectInterface } from "../core/EffectInterface.js";

export class ColorGradingEffect extends EffectInterface {
  constructor(options = {}) {
    const defaults = {
      brightness: 0.0,
      contrast: 0.0,
      saturation: 0.0,
      warmth: 0.0,
      hue: 0.0,
      shadows: 0.0,
      highlights: 0.0,
    };
    super({ ...defaults, ...options },
      ["brightness", "contrast", "saturation", "warmth", "hue",
        "shadows", "highlights"],
      []
    );
  }

  syncValueDisplays() {}

  getRebuildKey() {
    return "colorgrading";
  }

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_cgBrightness, +(this.options.brightness ?? 0.0));
    gl.uniform1f(locs.u_cgContrast, +(this.options.contrast ?? 0.0));
    gl.uniform1f(locs.u_cgSaturation, +(this.options.saturation ?? 0.0));
    gl.uniform1f(locs.u_cgWarmth, +(this.options.warmth ?? 0.0));
    gl.uniform1f(locs.u_cgHue, +(this.options.hue ?? 0.0));
    gl.uniform1f(locs.u_cgShadows, +(this.options.shadows ?? 0.0));
    gl.uniform1f(locs.u_cgHighlights, +(this.options.highlights ?? 0.0));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_cgBrightness;
  uniform float u_cgContrast;
  uniform float u_cgSaturation;
  uniform float u_cgWarmth;
  uniform float u_cgHue;
  uniform float u_cgShadows;
  uniform float u_cgHighlights;`;
  }

  getPostShaderGuards() {
    return `
    bool hasCg = (
      abs(u_cgBrightness) > 0.001 || abs(u_cgContrast) > 0.001 ||
      abs(u_cgSaturation) > 0.001 || abs(u_cgWarmth) > 0.001 ||
      abs(u_cgHue) > 0.001 || abs(u_cgShadows) > 0.001 ||
      abs(u_cgHighlights) > 0.001
    );`;
  }

  getPostShaderGuardSymbol() {
    return "hasCg";
  }

  getPostShaderHelpers() {
    return [
      "  vec3 cgRgbToHsv(vec3 c) {",
      "    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);",
      "    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));",
      "    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));",
      "    float d = q.x - min(q.w, q.y);",
      "    float e = 1.0e-10;",
      "    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);",
      "  }",
      "  vec3 cgHsvToRgb(vec3 c) {",
      "    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);",
      "    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);",
      "    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);",
      "  }",
      "  vec3 applyColorGrading(vec3 color) {",
      "    color = clamp(color + u_cgBrightness * 0.5, 0.0, 1.0);",
      "    if (abs(u_cgContrast) > 0.001) {",
      "      float c = 1.0 + u_cgContrast * 1.5;",
      "      color = clamp((color - 0.5) * c + 0.5, 0.0, 1.0);",
      "    }",
      "    if (abs(u_cgShadows) > 0.001) {",
      "      float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));",
      "      float shadowMask = 1.0 - smoothstep(0.0, 0.5, lum);",
      "      color = clamp(color + u_cgShadows * 0.6 * shadowMask, 0.0, 1.0);",
      "    }",
      "    if (abs(u_cgHighlights) > 0.001) {",
      "      float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));",
      "      float highlightMask = smoothstep(0.5, 1.0, lum);",
      "      color = clamp(color + u_cgHighlights * 0.6 * highlightMask, 0.0, 1.0);",
      "    }",
      "    vec3 hsv = cgRgbToHsv(color);",
      "    hsv.x = fract(hsv.x + u_cgHue / 360.0);",
      "    hsv.y = clamp(hsv.y + u_cgSaturation * 0.5, 0.0, 1.0);",
      "    color = cgHsvToRgb(hsv);",
      "    color.r = clamp(color.r + u_cgWarmth * 0.15, 0.0, 1.0);",
      "    color.g = clamp(color.g + u_cgWarmth * 0.05, 0.0, 1.0);",
      "    color.b = clamp(color.b - u_cgWarmth * 0.15, 0.0, 1.0);",
      "    return color;",
      "  }",
    ].join("\n");
  }

  getPostShaderPostCode() {
    return `
    if (hasCg) {
      combined = applyColorGrading(combined);
    }`;
  }
}
