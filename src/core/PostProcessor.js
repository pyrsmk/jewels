import { EffectStack } from './EffectStack.js';

export class PostProcessor {
  constructor({ moduleHost, pipelineRuntime }) {
    this.moduleHost = moduleHost;
    this.pipelineRuntime = pipelineRuntime;
    this.effectProgramCache = new Map();
    this._effectStack = new EffectStack([], null);
    this._transformCtx = { gl: null, locs: null, time: 0, effectStack: this._effectStack };
    this._passExtra = { time: 0, effects: null };
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
    const groups = moduleHost.getSourceGroups();
    const gl = pipelineRuntime.gl;
    const prevTexture = pipelineRuntime.getPreviousFrameTexture(pipelineRuntime.getSceneTarget().tex);

    let isFirst = true;

    for (const group of groups) {
      this._passExtra.time = t;
      this._passExtra.effects = group.effects;
      group.source.renderScenePass(pipelineRuntime.buildPassContext(this._passExtra));

      pipelineRuntime.resetPostChain();
      let inputTex = pipelineRuntime.getSceneTarget().tex;
      let lastOut = null;

      for (const effect of group.effects) {
        const effectStack = this._effectStack.reset(group.effects, effect);
        const { program, locs } = this._getOrBuildProgram(effect, effectStack);
        const out = pipelineRuntime.getNextPostTarget();
        pipelineRuntime.bindEffectPass(program, locs, inputTex, out.fbo, prevTexture, t);
        this._transformCtx.gl = gl;
        this._transformCtx.locs = locs;
        this._transformCtx.time = t;
        this._transformCtx.effectStack = effectStack;
        effect.transform(this._transformCtx);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        inputTex = out.tex;
        lastOut = out;
      }

      const groupResultTex = lastOut ? lastOut.tex : inputTex;
      pipelineRuntime.compositeOntoAccumulator(groupResultTex, isFirst);
      isFirst = false;
    }

    const accumTex = pipelineRuntime.getAccumulator().tex;
    pipelineRuntime.blitToScreen(accumTex);
    pipelineRuntime.pushFrameHistory(accumTex);
  }
}
