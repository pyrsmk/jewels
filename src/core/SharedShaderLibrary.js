export class SharedShaderLibrary {
  getColorUniforms() {
    return `
  uniform vec3 u_accents[8];
  uniform int u_accentCount;`;
  }

  getSamplingHelpers() {
    return `
  vec3 sampleScene(vec2 uv) {
    return texture2D(u_scene, clamp(uv, 0.0, 1.0)).rgb;
  }`;
  }

  getColorHelpers() {
    return `
  vec3 paletteColor(float t) {
    if (u_accentCount <= 0) return vec3(1.0);
    if (u_accentCount == 1) return u_accents[0];
    float scaled = clamp(t, 0.0, 0.9999) * float(u_accentCount - 1);
    int i0 = int(floor(scaled));
    int i1 = i0 + 1;
    if (i1 >= u_accentCount) i1 = u_accentCount - 1;
    float f = fract(scaled);
    vec3 c0 = vec3(0.0);
    vec3 c1 = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      if (i == i0) c0 = u_accents[i];
      if (i == i1) c1 = u_accents[i];
    }
    return mix(c0, c1, f);
  }`;
  }

  getBlurHelpers() {
    return `
  vec3 blurCross9(vec2 uv, float radius) {
    vec2 px = 1.0 / u_resolution;
    vec2 off = px * radius;
    vec3 s = vec3(0.0);
    s += sampleScene(uv - vec2(4.0 * off.x, 0.0)) * 0.05;
    s += sampleScene(uv - vec2(3.0 * off.x, 0.0)) * 0.09;
    s += sampleScene(uv - vec2(2.0 * off.x, 0.0)) * 0.12;
    s += sampleScene(uv - vec2(1.0 * off.x, 0.0)) * 0.15;
    s += sampleScene(uv)                            * 0.18;
    s += sampleScene(uv + vec2(1.0 * off.x, 0.0)) * 0.15;
    s += sampleScene(uv + vec2(2.0 * off.x, 0.0)) * 0.12;
    s += sampleScene(uv + vec2(3.0 * off.x, 0.0)) * 0.09;
    s += sampleScene(uv + vec2(4.0 * off.x, 0.0)) * 0.05;
    s += sampleScene(uv - vec2(0.0, 4.0 * off.y)) * 0.05;
    s += sampleScene(uv - vec2(0.0, 3.0 * off.y)) * 0.09;
    s += sampleScene(uv - vec2(0.0, 2.0 * off.y)) * 0.12;
    s += sampleScene(uv - vec2(0.0, 1.0 * off.y)) * 0.15;
    s += sampleScene(uv + vec2(0.0, 1.0 * off.y)) * 0.15;
    s += sampleScene(uv + vec2(0.0, 2.0 * off.y)) * 0.12;
    s += sampleScene(uv + vec2(0.0, 3.0 * off.y)) * 0.09;
    s += sampleScene(uv + vec2(0.0, 4.0 * off.y)) * 0.05;
    return s * 0.5;
  }

  vec3 sampleBrightScene(vec2 uv) {
    vec3 src = sampleScene(uv);
    float lum = dot(src, vec3(0.2126, 0.7152, 0.0722));
    float bright = smoothstep(0.10, 0.85, lum);
    return src * bright;
  }

  vec3 blurBrightCross9(vec2 uv, float radius) {
    vec2 px = 1.0 / u_resolution;
    vec2 off = px * radius;
    vec3 s = vec3(0.0);
    s += sampleBrightScene(uv - vec2(4.0 * off.x, 0.0)) * 0.05;
    s += sampleBrightScene(uv - vec2(3.0 * off.x, 0.0)) * 0.09;
    s += sampleBrightScene(uv - vec2(2.0 * off.x, 0.0)) * 0.12;
    s += sampleBrightScene(uv - vec2(1.0 * off.x, 0.0)) * 0.15;
    s += sampleBrightScene(uv)                            * 0.18;
    s += sampleBrightScene(uv + vec2(1.0 * off.x, 0.0)) * 0.15;
    s += sampleBrightScene(uv + vec2(2.0 * off.x, 0.0)) * 0.12;
    s += sampleBrightScene(uv + vec2(3.0 * off.x, 0.0)) * 0.09;
    s += sampleBrightScene(uv + vec2(4.0 * off.x, 0.0)) * 0.05;
    s += sampleBrightScene(uv - vec2(0.0, 4.0 * off.y)) * 0.05;
    s += sampleBrightScene(uv - vec2(0.0, 3.0 * off.y)) * 0.09;
    s += sampleBrightScene(uv - vec2(0.0, 2.0 * off.y)) * 0.12;
    s += sampleBrightScene(uv - vec2(0.0, 1.0 * off.y)) * 0.15;
    s += sampleBrightScene(uv + vec2(0.0, 1.0 * off.y)) * 0.15;
    s += sampleBrightScene(uv + vec2(0.0, 2.0 * off.y)) * 0.12;
    s += sampleBrightScene(uv + vec2(0.0, 3.0 * off.y)) * 0.09;
    s += sampleBrightScene(uv + vec2(0.0, 4.0 * off.y)) * 0.05;
    return s * 0.5;
  }`;
  }

  getNoiseHelpers() {
    return `
  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }`;
  }

  getAllHelpers() {
    return [
      this.getSamplingHelpers(),
      this.getColorHelpers(),
      this.getBlurHelpers(),
      this.getNoiseHelpers(),
    ].filter(Boolean).join('\n\n');
  }

  getSharedUniforms() {
    return [
      this.getColorUniforms(),
    ].filter(Boolean).join('\n');
  }
}

export const sharedShaderLibrary = new SharedShaderLibrary();