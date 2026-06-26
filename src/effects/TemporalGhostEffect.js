import { EffectInterface } from '../core/EffectInterface.js';

export class TemporalGhostEffect extends EffectInterface {
  constructor(options = {}) {
    const defaults = {
      intensity: 0.70,
      rgbShift: 0.80,
      speed: 1.20,
      offset: 1.50,
    };
    super({ ...defaults, ...options },
      [
        'intensity',
        'rgbShift', 'speed', 'offset',
      ],
      [
        'intensityVal', 'rgbShiftVal',
        'speedVal', 'offsetVal',
      ]
    );
  }

  syncValueDisplays() {}

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_temporalGhost, 1.0);
    gl.uniform1f(locs.u_temporalGhostOpacity, +(this.options.intensity ?? 0.70));
    gl.uniform1f(locs.u_temporalGhostRgbShift, +(this.options.rgbShift ?? 0.80));
    gl.uniform1f(locs.u_temporalGhostSpeed, +(this.options.speed ?? 1.20));
    gl.uniform1f(locs.u_temporalGhostScale, +(this.options.offset ?? 1.50));
  }

  getPostShaderUniforms() {
    return `
  uniform float u_temporalGhost;
  uniform float u_temporalGhostOpacity;
  uniform float u_temporalGhostRgbShift;
  uniform float u_temporalGhostSpeed;
  uniform float u_temporalGhostScale;`;
  }

  getPostShaderGuards() {
    return `
    bool hasTemporalGhost = (u_temporalGhost > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasTemporalGhost';
  }

  getPostShaderHelpers() {
    return `
  vec3 applyTemporalGhost(vec3 color, vec2 uv, float time) {
    time = mod(time, 3600.0);
    vec2 pxGhost = (1.0 / u_resolution) * max(u_temporalGhostScale, 0.001) * 6.0;
    float phase = time * u_temporalGhostSpeed;
    vec2 drift = vec2(sin(phase) * pxGhost.x, cos(phase * 0.73) * pxGhost.y);
    float rgbShift = u_temporalGhostRgbShift * 2.0;
    vec2 rgb = drift * rgbShift;
    vec3 prevCol = texture(u_prev, clamp(uv - drift, 0.0, 1.0)).rgb;
    vec3 prevShifted = vec3(
      texture(u_prev, clamp(uv - drift + rgb, 0.0, 1.0)).r,
      texture(u_prev, clamp(uv - drift, 0.0, 1.0)).g,
      texture(u_prev, clamp(uv - drift - rgb, 0.0, 1.0)).b
    );
    vec3 ghost = mix(prevCol, prevShifted, clamp(u_temporalGhostRgbShift, 0.0, 1.0));
    return mix(color, ghost, clamp(u_temporalGhostOpacity * u_temporalGhost, 0.0, 1.0));
  }`;
  }

  getPostShaderPostCode() {
    return `
    if (hasTemporalGhost) {
      combined = applyTemporalGhost(combined, uv, u_time);
    }`;
  }
}
