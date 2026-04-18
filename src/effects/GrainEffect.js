import { EffectInterface } from '../core/EffectInterface.js';

export class GrainEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = { grainAmount: 6.0 };
    super({ ...defaults, ...options }, ['grainAmount'], ['grainAmountVal']);
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_grainAmount, +(this.options.grainAmount ?? 6.0));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_grainAmount;`;
  }

  getPostShaderGuards() {
    return `
    bool hasGrain = (u_grainAmount > 0.01);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasGrain';
  }

  getRebuildKey() {
    return 'grain';
  }

  getPostShaderHelpers() {
    return `
  float grainHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float scanGrain(vec2 p, float t) {
    float frame = mod(floor(t * 24.0), 512.0);
    vec2 px = floor(p);
    vec2 ta = fract(frame * vec2(17.0 / 512.0, 23.0 / 512.0));
    vec2 tb = fract(frame * vec2(29.0 / 512.0, 31.0 / 512.0));
    vec2 tc = fract(frame * vec2( 7.0 / 512.0, 11.0 / 512.0));
    float a = grainHash(px / 256.0 + ta) - 0.5;
    float b = grainHash(px.yx / 256.0 + tb) - 0.5;
    float c = grainHash(floor(px * 0.5) / 256.0 + tc) - 0.5;
    return a * 0.76 + b * 0.18 + c * 0.06;
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasGrain) {
      vec2 gp = gl_FragCoord.xy;
      float lum = dot(combined, vec3(0.2126, 0.7152, 0.0722));
      float grain = scanGrain(gp, u_time);
      float mask = 0.35 + smoothstep(0.015, 0.45, lum) * 0.95;
      mask *= grainResponseMask;
      combined = clamp(combined + vec3(grain) * (0.10 * u_grainAmount) * mask, 0.0, 1.0);
    }`;
  }
}