import { AbstractAutomationSource } from './AbstractAutomationSource.js';

export class NoiseAutomationSource extends AbstractAutomationSource {
  constructor(options = {}) {
    super('noise', {
      speed: 0.5,
      smoothness: 0.5,
      ...options,
    });
    this._value = Math.random();
    this._target = Math.random();
    this._timer = 0;
  }

  evaluate(_time, dt) {
    this._timer += dt * this.options.speed * 3;

    if (this._timer >= 1) {
      this._timer -= 1;
      this._target = Math.random();
    }

    const smoothing = Math.pow(this.options.smoothness, 0.3);
    const factor = 1 - Math.pow(smoothing, dt * 60);
    this._value += (this._target - this._value) * factor;

    return Math.max(0, Math.min(1, this._value));
  }
}
