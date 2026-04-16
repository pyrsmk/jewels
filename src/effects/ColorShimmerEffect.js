import { EffectInterface } from '../core/EffectInterface.js';

export class ColorShimmerEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      colorTint2Palette: 'all',
      colorTint2: 3.0,
      colorTint2Speed: 0.60,
      colorTint2Scale: 1.10,
      colorTint2Mode: 'source',
    };
    super({ ...defaults, ...options },
      ['colorTint2Palette', 'colorTint2', 'colorTint2Speed', 'colorTint2Scale', 'colorTint2Mode'],
      ['colorTint2Val', 'colorTint2SpeedVal', 'colorTint2ScaleVal']
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    const paletteMap = {
      all: 0.0, warm: 1.0, cool: 2.0, fluo: 3.0, cyberpunk: 4.0,
      aurora: 5.0, fire: 6.0, sunset: 7.0, toxic: 8.0, ice: 9.0, midnight: 10.0,
    };
    const paletteIndex = paletteMap[this.options.colorTint2Palette ?? 'all'] ?? 0.0;

    const modeMap = { source: 0.0, background: 1.0, both: 2.0 };
    gl.uniform1f(locs.u_colorTint2, +(this.options.colorTint2 ?? 3.0));
    gl.uniform1f(locs.u_colorTint2Palette, paletteIndex);
    gl.uniform1f(locs.u_colorTint2Speed, +(this.options.colorTint2Speed ?? 0.60));
    gl.uniform1f(locs.u_colorTint2Scale, +(this.options.colorTint2Scale ?? 1.10));
    gl.uniform1f(locs.u_colorTint2Mode, modeMap[this.options.colorTint2Mode ?? 'source'] ?? 0.0);
  }

  getPostShaderUniforms() {
    return `
  uniform float u_colorTint2;
  uniform float u_colorTint2Palette;
  uniform float u_colorTint2Speed;
  uniform float u_colorTint2Scale;
  uniform float u_colorTint2Mode;`;
  }

  getPostShaderGuards() {
    return `
    bool hasColorTint2 = (u_colorTint2 > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasColorTint2';
  }

  getPostShaderHelpers() {
    return `
  vec3 colorShimmer(vec2 uv, float time) {
    time = mod(time, 3600.0);
    float scale = max(u_colorTint2Scale, 0.001);
    float t = time * u_colorTint2Speed;
    vec2 p1 = uv * (1.45 * scale);
    vec2 p2 = uv * (1.05 * scale);
    vec2 p3 = uv * (1.85 * scale);
    float n1 = noise21(p1 + vec2(t * 0.12, -t * 0.09) + 3.0);
    float n2 = noise21(p2 + vec2(-t * 0.08, t * 0.11) + 17.0);
    float n3 = noise21(p3 + vec2(t * 0.06, t * 0.14) + 31.0);
    vec3 c1;
    vec3 c2;
    vec3 c3;
    float amp = 1.0;
    if (u_colorTint2Palette < 0.5) {
      vec3 centered = vec3(n1, n2, n3) * 2.0 - 1.0;
      vec3 outCol = centered * vec3(1.25, 0.85, 1.45);
      float lum = dot(sampleScene(uv), vec3(0.2126, 0.7152, 0.0722));
      float lumaMask;
      if (u_colorTint2Mode < 0.5) {
        lumaMask = smoothstep(0.0, 0.4, lum);
      } else if (u_colorTint2Mode < 1.5) {
        lumaMask = smoothstep(0.4, 0.0, lum);
      } else {
        lumaMask = 1.0;
      }
      return outCol * (0.24 * u_colorTint2) * lumaMask;
    } else if (u_colorTint2Palette < 1.5) {
      c1 = vec3(1.40, 0.18, 0.08); c2 = vec3(1.34, 0.52, 0.06); c3 = vec3(1.08, 0.84, 0.14);
      amp = 2.60;
    } else if (u_colorTint2Palette < 2.5) {
      c1 = vec3(0.08, 0.98, 1.34); c2 = vec3(0.10, 0.34, 1.42); c3 = vec3(0.44, 0.24, 1.14);
      amp = 2.50;
    } else if (u_colorTint2Palette < 3.5) {
      c1 = vec3(1.60, 0.02, 1.12); c2 = vec3(0.00, 1.18, 1.48); c3 = vec3(0.50, 1.54, 0.02);
      amp = 2.90;
    } else if (u_colorTint2Palette < 4.5) {
      c1 = vec3(1.10, 0.02, 1.30); c2 = vec3(0.55, 0.02, 1.60); c3 = vec3(0.90, 0.02, 1.50);
      amp = 2.80;
    } else if (u_colorTint2Palette < 5.5) {
      c1 = vec3(0.04, 1.42, 1.02); c2 = vec3(0.06, 1.48, 0.46); c3 = vec3(0.72, 0.28, 1.30);
      amp = 2.60;
    } else if (u_colorTint2Palette < 6.5) {
      c1 = vec3(1.54, 0.06, 0.02); c2 = vec3(1.48, 0.58, 0.00); c3 = vec3(1.52, 1.34, 0.40);
      amp = 2.70;
    } else if (u_colorTint2Palette < 7.5) {
      c1 = vec3(1.52, 0.30, 0.28); c2 = vec3(1.38, 0.54, 0.06); c3 = vec3(0.72, 0.10, 1.10);
      amp = 2.60;
    } else if (u_colorTint2Palette < 8.5) {
      c1 = vec3(0.22, 1.56, 0.02); c2 = vec3(0.84, 1.50, 0.00); c3 = vec3(0.60, 1.44, 0.52);
      amp = 2.80;
    } else if (u_colorTint2Palette < 9.5) {
      c1 = vec3(0.36, 0.72, 1.46); c2 = vec3(0.28, 1.20, 1.38); c3 = vec3(0.74, 1.02, 1.48);
      amp = 2.40;
    } else {
      c1 = vec3(0.04, 0.10, 1.40); c2 = vec3(0.28, 0.04, 1.30); c3 = vec3(0.54, 0.06, 1.10);
      amp = 2.50;
    }
    float s1 = (n1 - 0.5) * 2.0;
    float s2 = (n2 - 0.5) * 2.0;
    float s3 = (n3 - 0.5) * 2.0;
    vec3 paletteSignal = max(c1 * s1 + c2 * s2 + c3 * s3, 0.0);
    float pulse = 0.78 + 0.22 * sin((uv.x + uv.y) * (5.0 + scale * 1.4) + t * 1.6);
    float lum = dot(sampleScene(uv), vec3(0.2126, 0.7152, 0.0722));
    float lumaMask;
    if (u_colorTint2Mode < 0.5) {
      lumaMask = smoothstep(0.0, 0.4, lum);
    } else if (u_colorTint2Mode < 1.5) {
      lumaMask = smoothstep(0.4, 0.0, lum);
    } else {
      lumaMask = 1.0;
    }
    return paletteSignal * amp * (0.24 * u_colorTint2) * pulse * lumaMask;
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasColorTint2) {
      vec3 shimmer = colorShimmer(uv, u_time);
      combined = clamp(combined + shimmer + combined * shimmer * 0.35, 0.0, 1.0);
    }`;
  }
}