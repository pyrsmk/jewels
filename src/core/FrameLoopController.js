const SLOW_FRAME_THRESHOLD_MS = 50;

export class FrameLoopController {
  constructor({ moduleHost, pipelineRuntime, automationHost, onResize, onRenderFrame, onFpsUpdate } = {}) {
    this.moduleHost = moduleHost;
    this.pipelineRuntime = pipelineRuntime;
    this.automationHost = automationHost;
    this.onResize = onResize;
    this.onRenderFrame = onRenderFrame;
    this.onFpsUpdate = onFpsUpdate;
    this.lastTime = performance.now() * 0.001;
    this.fpsFrames = 0;
    this.fpsLastTime = performance.now();
    this.fpsDisplayed = -1;
    this._boundFrame = this.frame.bind(this);
    this._lastFrameEndMs = performance.now();
    this._rafId = 0;
  }

  getDelta(t) {
    const dt = Math.min(t - this.lastTime, 1 / 20);
    this.lastTime = t;
    return dt;
  }

  start() {
    this._rafId = requestAnimationFrame(this._boundFrame);
  }

  stop() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
  }

  frame(nowMs) {
    const gapMs = nowMs - this._lastFrameEndMs;

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

    const t0 = performance.now();
    this.onResize?.();
    const t1 = performance.now();

    const now = nowMs / 1000;
    const dt = this.getDelta(now);

    this.automationHost?.evaluate(now, dt);

    this.moduleHost.updateSources((extra = {}) => this.pipelineRuntime.buildPassContext({
      deltaTime: dt,
      time: now,
      ...extra,
    }));
    const t2 = performance.now();

    this.onRenderFrame?.(now);
    const t3 = performance.now();

    const totalMs = t3 - t0;
    if (totalMs > SLOW_FRAME_THRESHOLD_MS || gapMs > SLOW_FRAME_THRESHOLD_MS) {
      console.warn(
        `[perf] SLOW FRAME: total=${totalMs.toFixed(1)}ms | gap=${gapMs.toFixed(1)}ms | resize=${(t1 - t0).toFixed(1)}ms | sources=${(t2 - t1).toFixed(1)}ms | render=${(t3 - t2).toFixed(1)}ms`
      );
    }

    this._lastFrameEndMs = performance.now();
    this._rafId = requestAnimationFrame(this._boundFrame);
  }
}