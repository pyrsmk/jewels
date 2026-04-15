import { EffectInterface } from '../core/EffectInterface.js';

export class DreamyGlowEffect extends EffectInterface {
  static uiTitle = 'Dreamy Glow';

  constructor(options = {}) {
    const defaults = {
      dreamyEnabled: true,
      dreamyGlow: 4,
      dreamyGrainResponse: 1.0,
      dreamyEdgeBoost: 3,
    };
    super({ ...defaults, ...options },
      ['dreamyEnabled', 'dreamyGlow', 'dreamyGrainResponse', 'dreamyEdgeBoost'],
      ['dreamyVal', 'dreamyGrainResponseVal', 'dreamyEdgeBoostVal']
    );
  }

  syncValueDisplays() {}

  getRebuildKey(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    return `dreamy:${hasGrainAfter ? 'grain' : 'nograin'}`;
  }

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_dreamyGlow, this.options.dreamyEnabled ? +(this.options.dreamyGlow ?? 4) : 0.0);
    gl.uniform1f(locs.u_dreamyEdgeBoost, +(this.options.dreamyEdgeBoost ?? 3));
    gl.uniform1f(locs.u_dreamyGrainResponse, +(this.options.dreamyGrainResponse ?? 1.0));
  }

  getPostShaderUniforms(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    let s = `
  uniform float u_dreamyGlow;
  uniform float u_dreamyEdgeBoost;`;
    if (hasGrainAfter) {
      s += `
  uniform float u_dreamyGrainResponse;`;
    }
    return s;
  }

  getPostShaderGuards() {
    return `
    bool hasDreamy = (u_dreamyGlow > 0.001);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasDreamy';
  }

  getPostShaderHelpers() {
    return `
  vec3 dreamyBloom(vec2 uv) {
    float rSoft = 2.5 + u_dreamyGlow * 2.5;
    float rWide = 5.5 + u_dreamyGlow * 5.5;
    vec3 soft = blurCross9(uv, rSoft);
    vec3 wide = blurCross9(uv, rWide);
    vec3 blur = mix(soft, wide, 0.62);
    float luma = dot(blur, vec3(0.2126, 0.7152, 0.0722));
    float mask = smoothstep(0.03, 0.32, luma);
    return blur * mask;
  }`;
  }

  getPostShaderPreCode(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    const grainMaskCode = `
      float dreamyLum = dot(
        dreamy * (0.35 + u_dreamyGlow * 0.85) * edgeBoost,
        vec3(0.2126, 0.7152, 0.0722)
      );
      float dreamyMask = smoothstep(0.02, 0.35, dreamyLum);
      grainResponseMask *= mix(1.0, clamp(u_dreamyGrainResponse, 0.0, 1.0), dreamyMask);`;

    return `
    if (hasDreamy) {
      vec3 dreamy = dreamyBloom(uv);
      vec2 centered = uv - 0.5;
      vec2 rect = abs(centered) * 2.0;
      float edgeMetric = max(rect.x, rect.y);
      float edgeMask = smoothstep(0.92, 0.995, edgeMetric);
      float edgeBoost = 1.0 + edgeMask * u_dreamyEdgeBoost;
      combined += dreamy * (0.35 + u_dreamyGlow * 0.85) * edgeBoost;${hasGrainAfter ? grainMaskCode : ''}
    }`;
  }
}