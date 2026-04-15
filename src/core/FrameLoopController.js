export class FrameLoopController {
  constructor({ moduleHost, pipelineRuntime, onResize, onRenderFrame, onFpsUpdate } = {}) {
    this.moduleHost = moduleHost;
    this.pipelineRuntime = pipelineRuntime;
    this.onResize = onResize;
    this.onRenderFrame = onRenderFrame;
    this.onFpsUpdate = onFpsUpdate;
    this.lastTime = performance.now() * 0.001;
    this.fpsFrames = 0;
    this.fpsLastTime = performance.now();
    this.fpsDisplayed = -1;
  }

  getDelta(t) {
    const dt = Math.min(t - this.lastTime, 1 / 20);
    this.lastTime = t;
    return dt;
  }

  start() {
    requestAnimationFrame(this.frame.bind(this));
  }

  frame(nowMs) {
    this.fpsFrames++;
    if (nowMs - this.fpsLastTime >= 1000) {
      const fpsRounded = Math.round(this.fpsFrames * 1000 / (nowMs - this.fpsLastTime));
      if (fpsRounded !== this.fpsDisplayed) {
        this.fpsDisplayed = fpsRounded;
        this.onFpsUpdate?.(fpsRounded);
      }
      this.fpsFrames = 0;
      this.fpsLastTime = nowMs;
    }

    this.onResize?.();

    const now = nowMs / 1000;
    const dt = this.getDelta(now);

    this.moduleHost.updateSources((extra = {}) => this.pipelineRuntime.buildPassContext({
      deltaTime: dt,
      time: now,
      ...extra,
    }));

    this.onRenderFrame?.(now);

    requestAnimationFrame(this.frame.bind(this));
  }
}