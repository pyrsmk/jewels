import { EffectInterface } from '../core/EffectInterface.js';

export class GrainEffect extends EffectInterface {
  static uiTitle = 'Grain';

  constructor(options = {}) {
    const defaults = {
      grainMode: 'celluloid',
      grainAmount: 3.0,
    };
    super({ ...defaults, ...options }, ['grainMode', 'grainAmount'], ['grainAmountVal']);
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    const modeValue = this.options.grainMode ?? 'celluloid';
    const grainMode = modeValue === 'static' ? 1 : modeValue === 'celluloid' ? 2 : 0;
    gl.uniform1f(locs.u_grainMode, grainMode);
    gl.uniform1f(locs.u_grainAmount, +(this.options.grainAmount ?? 3.0));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_grainMode;
  uniform float u_grainAmount;`;
  }

  getPostShaderGuards() {
    return `
    bool hasGrain = (u_grainAmount > 0.01);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasGrain';
  }

  getRebuildKey(context = {}) {
    return 'grain';
  }

  getPostShaderHelpers() {
    return `
  float grainHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float analogGrain(vec2 p, float t) {
    float tw = mod(t, 64.0);
    float fine   = grainHash(p * 1.25 + vec2(tw * 173.0,  tw * 91.0)) - 0.5;
    float mid    = grainHash(p * 0.58 + vec2(-tw * 67.0,  tw * 53.0)) - 0.5;
    float coarse = grainHash(p * 0.18 + vec2( tw * 19.0, -tw * 23.0)) - 0.5;
    float weave  = sin((p.y + tw * 24.0) * 0.42) * 0.5 + 0.5;
    return fine * 0.58 + mid * 0.27 + coarse * 0.15 + (weave - 0.5) * 0.08;
  }

  float staticGrain(vec2 p, float t) {
    float tw = mod(t, 64.0);
    vec2 cellA = floor(p * 1.0);
    vec2 cellB = floor(p * 1.9 + vec2(31.0, 17.0));
    vec2 cellC = floor(p * 3.4 + vec2(73.0, 91.0));
    float base  = grainHash(cellA + vec2(11.0, 29.0)) - 0.5;
    float fine  = grainHash(cellB + vec2(47.0, 13.0)) - 0.5;
    float micro = grainHash(cellC + vec2(19.0, 61.0)) - 0.5;
    float pulse = 0.92 + 0.08 * sin(tw * 17.0 + grainHash(cellA + 7.0) * 6.2831853);
    return (base * 0.5 + fine * 0.32 + micro * 0.18) * pulse;
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
  }

  float filmGrainValue(vec2 p, float t) {
    if (u_grainMode < 0.5) return analogGrain(p, t);
    if (u_grainMode < 1.5) return staticGrain(p, t);
    return scanGrain(p, t);
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasGrain) {
      vec2 gp = gl_FragCoord.xy;
      float lum = dot(combined, vec3(0.2126, 0.7152, 0.0722));
      float grain = filmGrainValue(gp, u_time);
      float mask = 0.35 + smoothstep(0.015, 0.45, lum) * 0.95;
      mask *= grainResponseMask;
      combined = clamp(combined + vec3(grain) * (0.10 * u_grainAmount) * mask, 0.0, 1.0);
    }`;
  }
}