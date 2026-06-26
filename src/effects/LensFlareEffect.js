import { EffectInterface } from '../core/EffectInterface.js';
import { clamp, smooth } from '../utils/math.js';

export class LensFlareEffect extends EffectInterface {
  constructor(options = {}) {
    const defaults = {
      lensFlare: true,
      grainResponse: 0.5,
      type: 'horizontal',
      anamorphic: true,
      thickness: 3,
      length: 60,
      diffusion: 2.5,
      duration: 4000,
      triggerMin: 10,
      triggerMax: 60,
      fadeIn: 13,
      hold: 10,
      fadeOut: 77,
      edgeDistance: 0,
      ghostEnabled: true,
      ghostIntensity: 0.3,
      ghostCount: 2,
      ghostSpacing: 0.17,
      ghostSize: 1.8,
      ghostDiffusion: 2.5,
      ghostDecay: 0.50,
    };
    super({ ...defaults, ...options },
      [
        'lensFlare', 'grainResponse', 'type', 'anamorphic',
        'thickness', 'length', 'diffusion', 'duration',
        'triggerMin', 'triggerMax', 'fadeIn', 'hold', 'fadeOut',
        'edgeDistance', 'ghostEnabled', 'ghostIntensity', 'ghostCount',
        'ghostSpacing', 'ghostSize', 'ghostDiffusion', 'ghostDecay',
      ],
      [
        'lensFlareGrainResponseVal', 'flareDurationVal', 'flareMinVal', 'flareMaxVal',
        'thicknessVal', 'lengthVal', 'diffusionVal', 'fadeInVal',
        'holdVal', 'fadeOutVal', 'edgeDistanceVal', 'ghostIntensityVal',
        'ghostCountVal', 'ghostSpacingVal', 'ghostSizeVal', 'ghostDiffusionVal',
        'ghostDecayVal',
      ]
    );
    this.flareState = { x: 0.5, y: 0.5, s: 0 };
    this.flareEvent = {
      active: false,
      nextAt: Infinity,
      startAt: 0,
      fadeIn: 0,
      hold: 0,
      fadeOut: 0,
      anchor: { x: 0.5, y: 0.5, s: 0 },
    };
    this._lastFlareMin = this.options.triggerMin;
    this._lastFlareMax = this.options.triggerMax;
    this.scheduleNextFlare(0);
  }

  syncValueDisplays() {}

  onSettingsChanged(t) {
    this.scheduleNextFlare(t);
  }

  findEdgeClusterAnchor(useLeftEdge, context = {}) {
    const source = context.moduleHost.getSources()[0];
    const particles = source?.particles || [];
    const w = Math.max(context.state.width, 1);
    const h = Math.max(context.state.height, 1);
    const edgeDistanceUv = (+(this.options.edgeDistance ?? 0)) / w;
    const jitterPx = 50.0;
    const jitterUvX = jitterPx / w;
    const jitterUvY = jitterPx / h;
    const targetX = useLeftEdge ? edgeDistanceUv : 1.0 - edgeDistanceUv;
    const bandPx = 140.0;
    const bandUv = bandPx / w;
    const bins = 18;
    const scores = new Float32Array(bins);
    const weightedY = new Float32Array(bins);
    let bestBright = null;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const px = p.x * 0.5 + 0.5;
      const py = p.y * 0.5 + 0.5;
      const dx = Math.abs(px - targetX);
      if (dx > bandUv) continue;
      const edgeWeight = 1.0 - clamp(dx / Math.max(bandUv, 0.0001), 0.0, 1.0);
      const score = (0.25 + p.bright * 0.75) * edgeWeight * (0.2 + p.fade * 0.8);
      const bin = Math.max(0, Math.min(bins - 1, Math.floor(py * bins)));
      scores[bin] += score;
      weightedY[bin] += py * score;
      if (!bestBright || score > bestBright.score) {
        bestBright = { x: px, y: py, score, bright: p.bright };
      }
    }
    let bestBin = -1;
    let bestScore = 0;
    for (let i = 0; i < bins; i++) {
      const neighborhood = scores[i]
        + (i > 0 ? scores[i - 1] * 0.55 : 0)
        + (i < bins - 1 ? scores[i + 1] * 0.55 : 0);
      if (neighborhood > bestScore) { bestScore = neighborhood; bestBin = i; }
    }
    let y = 0.5;
    let strength = 0.65;
    if (bestBin >= 0 && bestScore > 0.0001) {
      const localScore = scores[bestBin];
      if (localScore > 0.0001) y = weightedY[bestBin] / localScore;
      else y = (bestBin + 0.5) / bins;
      strength = clamp(0.45 + bestScore * 0.6, 0.45, 1.0);
    } else if (bestBright) {
      y = bestBright.y;
      strength = clamp(0.45 + bestBright.bright * 0.7, 0.45, 1.0);
    }
    const x = clamp(targetX + (Math.random() - 0.5) * 2.0 * jitterUvX, 0.0, 1.0);
    y = clamp(y + (Math.random() - 0.5) * 2.0 * jitterUvY, 0.02, 0.98);
    return { x, y, s: strength };
  }

  scheduleNextFlare(t) {
    const enabled = !!this.options.lensFlare;
    if (!enabled) {
      this.flareEvent.active = false;
      this.flareEvent.nextAt = Infinity;
      this.flareState = { x: 0.5, y: 0.5, s: 0 };
      return;
    }
    const rawMin = +(this.options.triggerMin ?? 10);
    const rawMax = +(this.options.triggerMax ?? 60);
    const minI = Math.min(rawMin, rawMax);
    const maxI = Math.max(rawMin, rawMax);
    this.flareEvent.active = false;
    this.flareEvent.nextAt = t + minI + Math.random() * (maxI - minI);
    this.flareState = { x: 0.5, y: 0.5, s: 0 };
  }

  update({ time, moduleHost: mh, state: st } = {}) {
    const t = time ?? 0;
    if (
      this._lastFlareMin !== this.options.triggerMin ||
      this._lastFlareMax !== this.options.triggerMax
    ) {
      this._lastFlareMin = this.options.triggerMin;
      this._lastFlareMax = this.options.triggerMax;
      if (!this.flareEvent.active) this.scheduleNextFlare(t);
    }
    if (!this.options.lensFlare) {
      this.flareEvent.active = false;
      this.flareEvent.nextAt = Infinity;
      this.flareState = { x: 0.5, y: 0.5, s: 0 };
      return;
    }
    if (!this.flareEvent.active && t >= this.flareEvent.nextAt) {
      this.flareEvent.active = true;
      const useLeftEdge = Math.random() < 0.5;
      this.flareEvent.anchor = this.findEdgeClusterAnchor(
        useLeftEdge, { moduleHost: mh, state: st }
      );
      this.flareEvent.startAt = t;
      const totalDuration = (+(this.options.duration ?? 4000)) / 1000.0;
      const fi = +(this.options.fadeIn ?? 13);
      const ho = +(this.options.hold ?? 10);
      const fo = +(this.options.fadeOut ?? 77);
      const sum = Math.max(fi + ho + fo, 0.0001);
      this.flareEvent.fadeIn = totalDuration * (fi / sum);
      this.flareEvent.hold = totalDuration * (ho / sum);
      this.flareEvent.fadeOut = totalDuration * (fo / sum);
    }
    if (this.flareEvent.active) {
      const local = t - this.flareEvent.startAt;
      let amp = 0;
      if (local < this.flareEvent.fadeIn) {
        const u = clamp(local / Math.max(this.flareEvent.fadeIn, 0.0001), 0.0, 1.0);
        amp = smooth(u);
      } else if (local < this.flareEvent.fadeIn + this.flareEvent.hold) {
        amp = 1.0;
      } else if (
        local < this.flareEvent.fadeIn + this.flareEvent.hold + this.flareEvent.fadeOut
      ) {
        const elapsed = local - this.flareEvent.fadeIn - this.flareEvent.hold;
        const u = clamp(elapsed / Math.max(this.flareEvent.fadeOut, 0.0001), 0.0, 1.0);
        amp = 1.0 - smooth(u);
      } else {
        this.flareEvent.active = false;
        const rawMin = +(this.options.triggerMin ?? 10);
        const rawMax = +(this.options.triggerMax ?? 60);
        const minI = Math.min(rawMin, rawMax);
        const maxI = Math.max(rawMin, rawMax);
        this.flareEvent.nextAt = t + minI + Math.random() * (maxI - minI);
        amp = 0;
      }
      const a = this.flareEvent.anchor;
      const strength = Math.max(a.s, 0.65) * amp;
      this.flareState = { x: a.x, y: a.y, s: strength };
    } else {
      this.flareState = { x: 0.5, y: 0.5, s: 0 };
    }
  }

  getRebuildKey(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    return `lensflare:${hasGrainAfter ? 'grain' : 'nograin'}`;
  }

  transform({ gl, locs, effectStack }) {
    const typeMap = { horizontal: 0.6, vertical: 1.0, star: 2.0 };
    const lensMode = !!this.options.lensFlare
      ? (typeMap[this.options.type ?? 'horizontal'] || 1.0)
      : 0.0;
    gl.uniform1f(locs.u_lensMode, lensMode);
    const lensAnamorphic = !!this.options.anamorphic ? 1.0 : 0.0;
    gl.uniform1f(locs.u_lensAnamorphic, lensAnamorphic);
    gl.uniform1f(locs.u_lensThickness, +(this.options.thickness ?? 3));
    gl.uniform1f(locs.u_lensLength, (+(this.options.length ?? 60)) / 100.0);
    gl.uniform1f(locs.u_lensDiffusion, +(this.options.diffusion ?? 2.5));
    gl.uniform1f(locs.u_ghostEnabled, !!this.options.ghostEnabled ? 1.0 : 0.0);
    gl.uniform1f(locs.u_ghostIntensity, +(this.options.ghostIntensity ?? 0.3));
    gl.uniform1f(locs.u_ghostCount, +(this.options.ghostCount ?? 2));
    gl.uniform1f(locs.u_ghostSpacing, +(this.options.ghostSpacing ?? 0.17));
    gl.uniform1f(locs.u_ghostSize, +(this.options.ghostSize ?? 1.8));
    gl.uniform1f(locs.u_ghostDiffusion, +(this.options.ghostDiffusion ?? 2.5));
    gl.uniform1f(locs.u_ghostDecay, +(this.options.ghostDecay ?? 0.50));
    gl.uniform2f(locs.u_flarePos, this.flareState.x, this.flareState.y);
    gl.uniform1f(locs.u_flareStrength, this.flareState.s * 1.6);
    const hasGrainAfter = effectStack?.hasEffectAfter('GrainEffect') || false;
    if (hasGrainAfter) {
      gl.uniform1f(locs.u_lensFlareGrainResponse, +(this.options.grainResponse ?? 0.5));
    }
  }

  getPostShaderUniforms(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    let s = `
  uniform float u_lensMode;
  uniform float u_lensAnamorphic;
  uniform float u_lensThickness;
  uniform float u_lensLength;
  uniform float u_lensDiffusion;
  uniform float u_ghostEnabled;
  uniform float u_ghostIntensity;
  uniform float u_ghostCount;
  uniform float u_ghostSpacing;
  uniform float u_ghostSize;
  uniform float u_ghostDiffusion;
  uniform float u_ghostDecay;
  uniform vec2 u_flarePos;
  uniform float u_flareStrength;`;
    if (hasGrainAfter) {
      s += `
  uniform float u_lensFlareGrainResponse;`;
    }
    return s;
  }

  getPostShaderGuards() {
    return `
    bool hasFlare = (u_lensMode > 0.5);`;
  }

  getPostShaderGuardSymbol() {
    return 'hasFlare';
  }

  getPostShaderHelpers(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    const grainHelperCode = hasGrainAfter ? `
  float lensFlareLuma(vec3 lensFlareColor) {
    return dot(lensFlareColor, vec3(0.2126, 0.7152, 0.0722));
  }

  float lensFlareGrainMask(vec2 uv) {
    if (u_lensMode < 0.5) return 1.0;
    float flareLum = lensFlareLuma(lensFlare(uv));
    float flareMask = smoothstep(0.02, 0.55, flareLum);
    return mix(1.0, clamp(u_lensFlareGrainResponse, 0.0, 1.0), flareMask);
  }` : '';

    return `
  vec3 lensFlare(vec2 uv) {
    if (u_lensMode < 0.5) return vec3(0.0);
    vec2 p = u_flarePos;
    float st = u_flareStrength;
    if (st <= 0.001) return vec3(0.0);
    vec2 d = uv - p;
    float thicknessPx = max(u_lensThickness, 0.001);
    float sigmaCorePx = max(thicknessPx / 2.355, 0.5);
    float diffusionAmount = clamp(u_lensDiffusion / 5.0, 0.0, 1.0);
    float diffusionPx = max(u_lensDiffusion, 0.0) * 8.0;
    float sigmaSoftPx = max((thicknessPx + diffusionPx) / 2.355, sigmaCorePx + 0.25);
    float thicknessCoreUvX = sigmaCorePx / u_resolution.x;
    float thicknessCoreUvY = sigmaCorePx / u_resolution.y;
    float thicknessSoftUvX = sigmaSoftPx / u_resolution.x;
    float thicknessSoftUvY = sigmaSoftPx / u_resolution.y;
    float lengthFrac = clamp(u_lensLength, 0.01, 1.0);
    float axisScale = mix(1.0, 1.8, step(0.5, u_lensAnamorphic));
    float lenCoreX = max(lengthFrac * 0.5 * axisScale, 0.001);
    float lenCoreY = max(lengthFrac * 0.5 * axisScale, 0.001);
    float lenSoftX = lenCoreX;
    float lenSoftY = lenCoreY;
    vec3 tint = vec3(1.0, 1.0, 1.0);
    vec3 c = vec3(0.0);
    if (u_lensMode > 1.5) {
      float r = length(d);
      float starThicknessUvX = max(thicknessCoreUvX, 0.0005);
      float starThicknessUvY = max(thicknessCoreUvY, 0.0005);
      float starSoftUvX = max(thicknessSoftUvX, starThicknessUvX + 0.00025);
      float starSoftUvY = max(thicknessSoftUvY, starThicknessUvY + 0.00025);
      float starLenX = max(lenCoreX, 0.001);
      float starLenY = max(lenCoreY, 0.001);
      float starSoftLenX = max(lenSoftX * (1.0 + diffusionAmount * 0.35), starLenX);
      float starSoftLenY = max(lenSoftY * (1.0 + diffusionAmount * 0.35), starLenY);
      float horizCore = exp(-0.5 * pow(abs(d.y) / starThicknessUvY, 2.0))
        * exp(-pow(abs(d.x) / starLenX, 1.10));
      float vertCore = exp(-0.5 * pow(abs(d.x) / starThicknessUvX, 2.0))
        * exp(-pow(abs(d.y) / starLenY, 1.10));
      float horizSoft = exp(-0.5 * pow(abs(d.y) / starSoftUvY, 2.0))
        * exp(-pow(abs(d.x) / starSoftLenX, 1.18));
      float vertSoft = exp(-0.5 * pow(abs(d.x) / starSoftUvX, 2.0))
        * exp(-pow(abs(d.y) / starSoftLenY, 1.18));
      float starCore = horizCore + vertCore;
      float starSoft = horizSoft + vertSoft;
      float starProfile = mix(starCore, starSoft, diffusionAmount);
      float coreRadius = max(
        (thicknessPx + diffusionPx * 0.6) / max(min(u_resolution.x, u_resolution.y), 1.0),
        0.002
      );
      float core = exp(-pow(r / coreRadius, 1.55)) * (1.0 + diffusionAmount * 0.2);
      float haloRadius = max(coreRadius * (2.2 + diffusionAmount * 2.8), coreRadius + 0.001);
      float halo = exp(-pow(r / haloRadius, 1.35)) * mix(0.18, 0.42, diffusionAmount);
      c += tint * (core + halo + starProfile * 1.55) * st;
    } else if (u_lensMode > 0.9) {
      float coreThin = exp(-0.5 * pow(abs(d.x) / thicknessCoreUvX, 2.0));
      float coreLong = exp(-pow(abs(d.y) / lenCoreY, 1.08));
      float softThin = exp(-0.5 * pow(abs(d.x) / thicknessSoftUvX, 2.0));
      float softLong = exp(-pow(abs(d.y) / lenSoftY, 1.08));
      float coreLine = coreThin * coreLong;
      float softStreak = softThin * softLong;
      float dispersed = mix(coreLine, softStreak, diffusionAmount);
      float centerReduction = mix(1.0, 0.62, diffusionAmount);
      float profile = dispersed * centerReduction;
      c += tint * profile * st * 2.35;
    } else {
      float coreThin = exp(-0.5 * pow(abs(d.y) / thicknessCoreUvY, 2.0));
      float coreLong = exp(-pow(abs(d.x) / lenCoreX, 1.08));
      float softThin = exp(-0.5 * pow(abs(d.y) / thicknessSoftUvY, 2.0));
      float softLong = exp(-pow(abs(d.x) / lenSoftX, 1.08));
      float coreLine = coreThin * coreLong;
      float softStreak = softThin * softLong;
      float dispersed = mix(coreLine, softStreak, diffusionAmount);
      float centerReduction = mix(1.0, 0.62, diffusionAmount);
      float profile = dispersed * centerReduction;
      c += tint * profile * st * 2.35;
    }
    if (u_ghostEnabled > 0.5 && u_ghostIntensity > 0.001) {
      vec2 center = vec2(0.5, 0.5);
      float countF    = clamp(u_ghostCount,   1.0, 5.0);
      float spacing   = clamp(u_ghostSpacing, 0.01, 0.5);
      float sizeBase  = max(u_ghostSize,      0.05);
      float diffBase  = max(u_ghostDiffusion, 0.05);
      float decay     = clamp(u_ghostDecay,   0.0, 1.0);
      for (int gi = 0; gi < 5; gi++) {
        float idx = float(gi);
        if (idx >= countF) break;
        float t = (idx + 1.0) * spacing;
        vec2 gp = mix(p, center, t);
        vec2 d2 = uv - gp;
        float fall = mix(1.0, exp(-idx * 2.2), decay);
        float ghostSize = max(sizeBase * 0.08, 0.001);
        float ghostDiff = max(diffBase, 0.05);
        float ghostR = length(d2);
        float ghost = exp(-pow(ghostR / (ghostSize + 0.0001), 1.55));
        ghost *= exp(-ghostR * (1.0 / max(ghostDiff, 0.05)) * 2.0);
        c += tint * ghost * st * u_ghostIntensity * fall;
      }
    }
    return c;
  }

${grainHelperCode}`;
  }

  getPostShaderPreCode(context = {}) {
    const hasGrainAfter = context.effectStack?.hasEffectAfter('GrainEffect') || false;
    const grainMaskCode = hasGrainAfter ? `
    grainResponseMask *= lensFlareGrainMask(uv);` : '';

    return `
    if (hasFlare) {
      vec3 flare = lensFlare(uv);
      combined += flare;
      srcAlpha = max(srcAlpha, dot(flare, vec3(0.2126, 0.7152, 0.0722)));
    }${grainMaskCode}`;
  }
}
