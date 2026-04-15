export class PostProcessor {
  constructor({ moduleHost, pipelineRuntime }) {
    this.moduleHost = moduleHost;
    this.pipelineRuntime = pipelineRuntime;
    this.lastPostChainRebuildKey = '';
  }

  resetPostChain() {
    this.pipelineRuntime.resetPostChain();
  }

  render(t, deps = {}) {
    const { pipelineRuntime, moduleHost } = this;
    const postChainRebuildKey = pipelineRuntime.buildPostChainRebuildKey(moduleHost.getEffects());
    if (postChainRebuildKey !== this.lastPostChainRebuildKey) {
      this.lastPostChainRebuildKey = postChainRebuildKey;
      this.resetPostChain();
      pipelineRuntime.rebuildPostProgram();
    }

    const out = pipelineRuntime.getNextPostTarget();
    const fallbackTex = pipelineRuntime.getAltPostTarget().tex;
    const prevTexture = pipelineRuntime.getPreviousFrameTexture(fallbackTex);
    const sceneTexture = pipelineRuntime.getSceneTarget().tex;

    pipelineRuntime.bindPostBuffer(out, t);
    pipelineRuntime.bindPostInputs(sceneTexture, prevTexture);

    moduleHost.transformEffects((extra = {}) => pipelineRuntime.buildPassContext({
      time: t,
      locs: pipelineRuntime.postLocs,
      ...deps,
      ...extra,
    }));

    pipelineRuntime.gl.drawArrays(pipelineRuntime.gl.TRIANGLE_STRIP, 0, 4);

    pipelineRuntime.blitToScreen(out.tex);
    pipelineRuntime.pushFrameHistory(out.tex);
  }
}