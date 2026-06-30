import { AbstractAutomationSource } from './AbstractAutomationSource.js';
import { AudioStreamManager } from './AudioStreamManager.js';

export const AUDIO_MODES = [
  { value: 'beat',     label: 'Beat' },
  { value: 'bass',     label: 'Basses' },
  { value: 'mids',     label: 'Médiums' },
  { value: 'treble',   label: 'Aigus' },
  { value: 'volume',   label: 'Volume' },
  { value: 'centroid', label: 'Centroïde' },
];

// Beat mode: random trigger rate modes
const BEAT_MODES = [
  { multiplier: 1,    weight: 45, durations: [8, 16] },
  { multiplier: 0.5,  weight: 20, durations: [4, 8] },
  { multiplier: 0.25, weight: 20, durations: [2, 4] },
  { multiplier: 2,    weight: 15, durations: [4, 8] },
];

const COOLDOWN_MODES = [
  { multiplier: 0.5,  durations: [4, 8] },
  { multiplier: 0.25, durations: [2, 4] },
];

// Beat envelope (hardcoded)
const BEAT_ATTACK = 0.001;
const BEAT_RELEASE = 0.01;

function pickWeighted(modes) {
  const totalWeight = modes.reduce((s, m) => s + m.weight, 0);
  let r = Math.random() * totalWeight;
  for (const mode of modes) {
    r -= mode.weight;
    if (r <= 0) return mode;
  }
  return modes[modes.length - 1];
}

function pickDuration(mode) {
  return mode.durations[Math.floor(Math.random() * mode.durations.length)];
}

export class AudioAutomationSource extends AbstractAutomationSource {
  constructor(options = {}) {
    super('audio', {
      streamId: null,
      streamName: '',
      mode: 'beat',
      threshold: 0.15,
      attack: 0.02,
      release: 0.15,
      ...options,
    });
    this._smoothed = 0;
    this._initBeatState();
  }

  _initBeatState() {
    this._currentMultiplier = 1;
    this._modeDuration = 0;
    this._modeBeatsElapsed = 0;
    this._prevTriggerIndex = -1;
    this._prevBeatCount = 0;
    this._wasCooldown = false;
    this._inCooldownMode = false;
  }

  _pickNormalMode() {
    const mode = pickWeighted(BEAT_MODES);
    this._currentMultiplier = mode.multiplier;
    this._modeDuration = pickDuration(mode);
    this._modeBeatsElapsed = 0;
    this._inCooldownMode = false;
  }

  _pickCooldownMode() {
    const mode = COOLDOWN_MODES[Math.floor(Math.random() * COOLDOWN_MODES.length)];
    this._currentMultiplier = mode.multiplier;
    this._modeDuration = Infinity;
    this._modeBeatsElapsed = 0;
    this._inCooldownMode = true;
  }

  evaluate(_time, dt) {
    const streamId = this.options.streamId;
    if (!streamId) return 0;

    const manager = AudioStreamManager.getInstance();
    const stream = manager.getStream(streamId);
    if (!stream || !stream.playing) return 0;

    const analysis = manager.getAnalysis(streamId);
    if (!analysis) return 0;

    if (this.options.mode === 'beat') {
      return this._evaluateBeat(analysis, dt);
    }

    const raw = analysis[this.options.mode] ?? 0;
    const rising = raw > this._smoothed;
    const tau = rising ? this.options.attack : this.options.release;
    const coeff = tau > 0 ? 1 - Math.exp(-dt / tau) : 1;
    this._smoothed += (raw - this._smoothed) * coeff;
    return Math.max(0, Math.min(1, this._smoothed));
  }

  _evaluateBeat(analysis, dt) {
    if (!analysis.isLocked) {
      this._smoothed = 0;
      return 0;
    }

    const beatCount = analysis.beatCount;
    const isCooldown = analysis.isCooldown;

    // Handle cooldown transitions
    if (isCooldown && !this._wasCooldown) {
      this._pickCooldownMode();
    } else if (!isCooldown && this._wasCooldown) {
      this._pickNormalMode();
    }
    this._wasCooldown = isCooldown;

    // Count elapsed beats and check for mode expiry
    const beatsElapsed = beatCount - this._prevBeatCount;
    this._prevBeatCount = beatCount;
    if (beatsElapsed > 0) {
      this._modeBeatsElapsed += beatsElapsed;
    }

    if (!this._inCooldownMode && this._modeBeatsElapsed >= this._modeDuration) {
      this._pickNormalMode();
    }

    // Trigger detection
    const triggerIndex = Math.floor(beatCount * this._currentMultiplier);
    let raw = 0;
    if (triggerIndex !== this._prevTriggerIndex) {
      this._prevTriggerIndex = triggerIndex;
      raw = 1;
    }

    // Hardcoded envelope
    const rising = raw > this._smoothed;
    const tau = rising ? BEAT_ATTACK : BEAT_RELEASE;
    const coeff = tau > 0 ? 1 - Math.exp(-dt / tau) : 1;
    this._smoothed += (raw - this._smoothed) * coeff;

    return Math.max(0, Math.min(1, this._smoothed));
  }

  setup() {
    const manager = AudioStreamManager.getInstance();
    const stream = manager.getStream(this.options.streamId);
    if (stream && !stream.playing) {
      stream.play();
    }
  }

  dispose() {
    // Don't stop the file — other automations may still use it
  }

  serialize() {
    const params = this.getParameters();
    delete params.streamId;
    return { type: this.type, params };
  }

  setParameters(params) {
    super.setParameters(params);
    this._smoothed = 0;
    this._initBeatState();
  }
}
