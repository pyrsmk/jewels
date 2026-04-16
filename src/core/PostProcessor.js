import { EffectStack } from './EffectStack.js';

export class PostProcessor {
  constructor({ moduleHost, pipelineRuntime }) {
    this.moduleHost = moduleHost;
    this.pipelineRuntime = pipelineRuntime;
    this.effectProgramCache = new Map();
  }

  _getRebuildKey(effect, effectStack) {
    return `${effect.constructor.name}:${effect.getRebuildKey?.({ effectStack }) ?? ''}`;
  }

  _getOrBuildProgram(effect, effectStack) {
    const key = this._getRebuildKey(effect, effectStack);
    if (!this.effectProgramCache.has(key)) {
      const program = this.pipelineRuntime.buildEffectProgram(effect, effectStack);
      const locs = this.pipelineRuntime.buildEffectLocs(program);
      this.effectProgramCache.set(key, { program, locs });
    }
    return this.effectProgramCache.get(key);
  }

  invalidateCache() {
    this.effectProgramCache.clear();
    this.pipelineRuntime.resetPostChain();
  }

  render(t) {
    const { pipelineRuntime, moduleHost } = this;
    const effects = moduleHost.getEffects();
    const gl = pipelineRuntime.gl;
    const prevTexture = pipelineRuntime.getPreviousFrameTexture(pipelineRuntime.getSceneTarget().tex);
    let inputTex = pipelineRuntime.getSceneTarget().tex;
    let lastOut = null;

    for (const effect of effects) {
      const effectStack = new EffectStack(effects, effect);
      const { program, locs } = this._getOrBuildProgram(effect, effectStack);
      const out = pipelineRuntime.getNextPostTarget();
      pipelineRuntime.bindEffectPass(program, locs, inputTex, out.fbo, prevTexture, t);
      effect.transform({ gl, locs, time: t, effectStack });
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      inputTex = out.tex;
      lastOut = out;
    }

    if (lastOut) {
      pipelineRuntime.blitToScreen(lastOut.tex);
      pipelineRuntime.pushFrameHistory(lastOut.tex);
    } else {
      pipelineRuntime.blitToScreen(inputTex);
      pipelineRuntime.pushFrameHistory(inputTex);
    }
  }
}