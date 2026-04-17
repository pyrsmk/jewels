import { EffectInterface } from '../core/EffectInterface.js';

export class GlowEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      glow: 1.0,
      glowGrainResponse: 1.0,
    };
    super({ ...defaults, ...options },
      ['glow', 'glowGrainResponse'],
      ['glowVal', 'glowGrainResponseVal']
    );
  }

  syncValueDisplays() {}

  getRebuildKey(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    return `glow:${hasGrainAfter ? 'grain' : 'nograin'}`;
  }

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_glow, +(this.options.glow ?? 1.0));
    gl.uniform1f(locs.u_glowGrainResponse, +(this.options.glowGrainResponse ?? 1.0));
  }

  getPostShaderUniforms(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    let s = `
  uniform float u_glow;`;
    if (hasGrainAfter) {
      s += `
  uniform float u_glowGrainResponse;`;
    }
    return s;
  }

  getPostShaderGuards() {
    return `
    bool hasGlow = (u_glow > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasGlow';
  }

  getPostShaderPreCode(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    const grainMaskCode = `
      float glowLum = dot(glow, vec3(0.2126, 0.7152, 0.0722));
      float glowMask = smoothstep(0.02, 0.35, glowLum);
      grainResponseMask *= mix(1.0, clamp(u_glowGrainResponse, 0.0, 1.0), glowMask);`;

    return `
    if (hasGlow) {
      vec3 glowNear = blurBrightCross9(uv, 2.0);
      vec3 glowWide = blurBrightCross9(uv, 5.0);
      vec3 glow = glowNear * 0.75 + glowWide * 0.55;
      combined += glow * u_glow * 0.95;${hasGrainAfter ? grainMaskCode : ''}
    }`;
  }
}
