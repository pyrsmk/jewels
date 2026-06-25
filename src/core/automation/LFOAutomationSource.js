import { AbstractAutomationSource } from './AbstractAutomationSource.js';

const TWO_PI = Math.PI * 2;

function sine(phase) {
  return (Math.sin(phase * TWO_PI) + 1) / 2;
}

function triangle(phase) {
  const t = phase % 1;
  return t < 0.5 ? t * 2 : 2 - t * 2;
}

function square(phase) {
  return (phase % 1) < 0.5 ? 1 : 0;
}

function sawtooth(phase) {
  return phase % 1;
}

const WAVEFORMS = { sine, triangle, square, sawtooth };

export class LFOAutomationSource extends AbstractAutomationSource {
  constructor(options = {}) {
    super('lfo', {
      waveform: 'sine',
      frequency: 1.0,
      ...options,
    });
  }

  evaluate(time, _dt) {
    const fn = WAVEFORMS[this.options.waveform] ?? sine;
    return fn(time * this.options.frequency);
  }
}
