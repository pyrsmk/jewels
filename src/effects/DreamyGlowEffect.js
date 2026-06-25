import { EffectInterface } from '../core/EffectInterface.js';

export class DreamyGlowEffect extends EffectInterface {
  constructor(options = {}) {
    const defaults = {
      dreamyGlow: 4,
      dreamyGrainResponse: 1.0,
      dreamyEdgeBoost: 0.5,
      dreamyHaloDir: 15,
    };
    super({ ...defaults, ...options },
      ['dreamyGlow', 'dreamyGrainResponse', 'dreamyEdgeBoost', 'dreamyHaloDir'],
      ['dreamyVal', 'dreamyGrainResponseVal', 'dreamyEdgeBoostVal']
    );
  }

  syncValueDisplays() {}

  getRebuildKey(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    return `dreamy:${hasGrainAfter ? 'grain' : 'nograin'}`;
  }

  transform({ gl, locs }) {
    gl.uniform1f(locs.u_dreamyGlow, +(this.options.dreamyGlow ?? 4));
    gl.uniform1f(locs.u_dreamyEdgeBoost, +(this.options.dreamyEdgeBoost ?? 0.5));
    gl.uniform1f(locs.u_dreamyHaloDir, +(this.options.dreamyHaloDir ?? 15));
    gl.uniform1f(locs.u_dreamyGrainResponse, +(this.options.dreamyGrainResponse ?? 1.0));
  }

  getPostShaderUniforms(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    let s = `
  uniform float u_dreamyGlow;
  uniform float u_dreamyEdgeBoost;
  uniform float u_dreamyHaloDir;`;
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
  vec3 sampleSceneFaded(vec2 uv, float rayMix) {
    vec3 color = texture(u_scene, clamp(uv, 0.0, 1.0)).rgb;
    vec2 dist = max(-uv, uv - 1.0);
    float outside = max(dist.x, dist.y);
    if (outside > 0.0) {
      int haloDir = int(u_dreamyHaloDir);
      bool allowed = false;
      if (uv.y > 1.0) allowed = allowed || ((haloDir & 1) != 0);
      if (uv.y < 0.0) allowed = allowed || ((haloDir & 2) != 0);
      if (uv.x < 0.0) allowed = allowed || ((haloDir & 4) != 0);
      if (uv.x > 1.0) allowed = allowed || ((haloDir & 8) != 0);
      if (!allowed) return vec3(0.0);
      float pxSize = 1.0 / max(u_resolution.x, u_resolution.y);
      float nearEdge = 1.0 - smoothstep(0.0, pxSize * 4.0, outside);
      color *= max(nearEdge, rayMix);
    }
    return color;
  }

  vec3 dreamyBlurCross9(vec2 uv, float radius, float rayLen) {
    vec2 px = 1.0 / u_resolution;
    vec2 off = px * radius;
    vec3 s = vec3(0.0);
    s += sampleSceneFaded(uv - vec2(4.0 * off.x, 0.0), rayLen) * 0.05;
    s += sampleSceneFaded(uv - vec2(3.0 * off.x, 0.0), rayLen) * 0.09;
    s += sampleSceneFaded(uv - vec2(2.0 * off.x, 0.0), rayLen) * 0.12;
    s += sampleSceneFaded(uv - vec2(1.0 * off.x, 0.0), rayLen) * 0.15;
    s += sampleSceneFaded(uv, rayLen)                            * 0.18;
    s += sampleSceneFaded(uv + vec2(1.0 * off.x, 0.0), rayLen) * 0.15;
    s += sampleSceneFaded(uv + vec2(2.0 * off.x, 0.0), rayLen) * 0.12;
    s += sampleSceneFaded(uv + vec2(3.0 * off.x, 0.0), rayLen) * 0.09;
    s += sampleSceneFaded(uv + vec2(4.0 * off.x, 0.0), rayLen) * 0.05;
    s += sampleSceneFaded(uv - vec2(0.0, 4.0 * off.y), rayLen) * 0.05;
    s += sampleSceneFaded(uv - vec2(0.0, 3.0 * off.y), rayLen) * 0.09;
    s += sampleSceneFaded(uv - vec2(0.0, 2.0 * off.y), rayLen) * 0.12;
    s += sampleSceneFaded(uv - vec2(0.0, 1.0 * off.y), rayLen) * 0.15;
    s += sampleSceneFaded(uv + vec2(0.0, 1.0 * off.y), rayLen) * 0.15;
    s += sampleSceneFaded(uv + vec2(0.0, 2.0 * off.y), rayLen) * 0.12;
    s += sampleSceneFaded(uv + vec2(0.0, 3.0 * off.y), rayLen) * 0.09;
    s += sampleSceneFaded(uv + vec2(0.0, 4.0 * off.y), rayLen) * 0.05;
    return s * 0.5;
  }

  vec3 dreamyBloom(vec2 uv) {
    float rSoft = 2.5 + u_dreamyGlow * 2.5;
    float rWide = 5.5 + u_dreamyGlow * 5.5;
    vec3 soft = dreamyBlurCross9(uv, rSoft, u_dreamyEdgeBoost);
    vec3 wide = dreamyBlurCross9(uv, rWide, u_dreamyEdgeBoost);
    vec3 blur = mix(soft, wide, 0.62);
    float luma = dot(blur, vec3(0.2126, 0.7152, 0.0722));
    float mask = smoothstep(0.03, 0.32, luma);
    return blur * mask;
  }`;
  }

  getPostShaderPreCode(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    const grainMaskCode = `
      float dreamyLum = dot(dreamyContrib, vec3(0.2126, 0.7152, 0.0722));
      float dreamyMask = smoothstep(0.02, 0.35, dreamyLum);
      grainResponseMask *= mix(1.0, clamp(u_dreamyGrainResponse, 0.0, 1.0), dreamyMask);`;

    return `
    if (hasDreamy) {
      vec3 dreamy = dreamyBloom(uv);
      vec3 dreamyContrib = dreamy * (0.35 + u_dreamyGlow * 0.85);
      combined += dreamyContrib;
      srcAlpha = max(srcAlpha, dot(dreamyContrib, vec3(0.2126, 0.7152, 0.0722)));${hasGrainAfter ? grainMaskCode : ''}
    }`;
  }
}
