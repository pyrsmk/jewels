import { EffectInterface } from '../core/EffectInterface.js';

export class GlowEffect extends EffectInterface {

  constructor(options = {}) {
    const defaults = {
      glow: 1.30,
      glowGrainResponse: 1.0,
      glowMode: 'post',
    };
    super({ ...defaults, ...options },
      ['glow', 'glowGrainResponse', 'glowMode'],
      ['glowVal', 'glowGrainResponseVal']
    );
  }

  syncValueDisplays() {}

  getRebuildKey(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    return `glow:${hasGrainAfter ? 'grain' : 'nograin'}`;
  }

  transform({ gl, locs }) {
    const mode = this.options.glowMode ?? 'post';
    const glowMode = mode === 'post' ? 1 : mode === 'post2' ? 2 : 0;
    const glowVal = +(this.options.glow ?? 1.3);
    gl.uniform1f(locs.u_glow, glowVal);
    gl.uniform1f(locs.u_glowMode, glowMode);
    gl.uniform1f(locs.u_glowGrainResponse, +(this.options.glowGrainResponse ?? 1.0));
  }

  getPostShaderUniforms(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    let s = `
  uniform float u_glow;
  uniform float u_glowMode;`;
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
      vec3 glow;
      if (u_glowMode < 0.5) {
        glow = (
      sampleScene(uv + vec2(px.x, 0.0)) +
      sampleScene(uv - vec2(px.x, 0.0)) +
      sampleScene(uv + vec2(0.0, px.y)) +
      sampleScene(uv - vec2(0.0, px.y))
    ) * 0.25;
        combined += glow * u_glow * 0.6;
      }
      else if (u_glowMode < 1.5) {
        vec3 src = sampleScene(uv);
        float srcLum = dot(src, vec3(0.2126, 0.7152, 0.0722));
        float brightMask = smoothstep(0.10, 0.85, srcLum);
        vec3 glowNear = blurCross9(uv, 2.0);
        vec3 glowWide = blurCross9(uv, 5.0);
        glow = (glowNear * 0.7 + glowWide * 0.5) * brightMask;
        combined += glow * u_glow * 0.85;
      }
      else {
        vec3 glowNear = blurBrightCross9(uv, 2.0);
        vec3 glowWide = blurBrightCross9(uv, 5.0);
        glow = glowNear * 0.75 + glowWide * 0.55;
        combined += glow * u_glow * 0.95;
      }${hasGrainAfter ? grainMaskCode : ''}
    }`;
  }
}