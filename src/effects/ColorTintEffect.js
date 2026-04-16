import { EffectInterface } from '../core/EffectInterface.js';

export class ColorTintEffect extends EffectInterface {
  static uiTitle = 'Couleurs';

  constructor(options = {}) {
    const defaults = {};
    super({ ...defaults, ...options }, [], []);
    this.colors = ['#5900ff', '#00d5ff'];
    this.accentCache = new Float32Array(24);
    this.accentCountCache = 0;
    this.rebuildAccentCache();
  }

  setColors(colors) {
    this.colors = colors;
    this.rebuildAccentCache();
  }

  getColors() {
    return this.colors;
  }

  rebuildAccentCache() {
    const rgbFromHex = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    };

    const colors = this.colors.slice(0, 8);
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
    if (!Array.isArray(saved.colors) || !saved.colors.length) return;
    const valid = saved.colors
      .filter((c) => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c))
      .slice(0, 8);
    if (!valid.length) return;
    this.setColors(valid);
  }

  getParameters() {
    return {
      colors: this.colors,
    };
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
      combined = mix(combined, combined * tint, 0.28);
    }`;
  }
}