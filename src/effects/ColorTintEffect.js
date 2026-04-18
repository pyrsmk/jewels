import { EffectInterface } from '../core/EffectInterface.js';

export class ColorTintEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = { colors: ['#5900ff', '#00d5ff'] };
    super({ ...defaults, ...options }, [], []);
    this.accentCache = new Float32Array(24);
    this.accentCountCache = 0;
    this.rebuildAccentCache();
  }

  setColors(colors) {
    this.options.colors = colors;
    this.rebuildAccentCache();
  }

  getColors() {
    return this.options.colors;
  }

  rebuildAccentCache() {
    const rgbFromHex = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    };

    const colors = (this.options.colors ?? ['#5900ff', '#00d5ff']).slice(0, 8);
    this.accentCountCache = colors.length;

    for (let i = 0; i < 8; i++) {
      const o = i * 3;
      if (i < colors.length) {
        const rgb = rgbFromHex(colors[i]);
        this.accentCache[o] = rgb[0];
        this.accentCache[o + 1] = rgb[1];
        this.accentCache[o + 2] = rgb[2];
      } else {
        this.accentCache[o] = 0;
        this.accentCache[o + 1] = 0;
        this.accentCache[o + 2] = 0;
      }
    }
  }

  setParameters(saved) {
    super.setParameters(saved);
    if (Array.isArray(this.options.colors)) {
      const valid = this.options.colors
        .filter((c) => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c))
        .slice(0, 8);
      this.options.colors = valid.length ? valid : ['#5900ff', '#00d5ff'];
    }
    this.rebuildAccentCache();
  }

  onSettingsChanged(t) {
    this.rebuildAccentCache();
  }

  applyScenePass({ gl, locs }) {
    if (locs.u_accents !== undefined)
      gl.uniform3fv(locs.u_accents, this.accentCache);
    if (locs.u_accentCount !== undefined)
      gl.uniform1i(locs.u_accentCount, this.accentCountCache);
  }

  transform({ gl, locs }) {
    if (locs.u_accents !== undefined) gl.uniform3fv(locs.u_accents, this.accentCache);
    if (locs.u_accentCount !== undefined) gl.uniform1i(locs.u_accentCount, this.accentCountCache);
  }

  getPostShaderPreCode() {
    return `
    if (u_accentCount > 0) {
      vec3 tint = paletteColor(clamp(uv.x, 0.0, 1.0));
      combined = clamp(combined + tint * srcAlpha, 0.0, 1.0);
    }`;
  }
}