let instance = null;

const FFT_SIZE = 2048;

const BAND_RANGES = {
  bass:   [20, 250],
  mids:   [250, 2000],
  treble: [2000, 16000],
};

const KICK_RANGE = [30, 150];

// Tempo detection (calibration phase)
const FLUX_BUFFER_SIZE = 12;
const ONSET_MULTIPLIER = 1.4;
const ONSET_FLOOR = 0.005;
const REFRACTORY_FRAMES = 8;
const MIN_ONSETS_FOR_LOCK = 6;
const INTERVAL_TOLERANCE = 0.10;

// Only accept onsets with energy >= peak * this ratio
const ONSET_ENERGY_RATIO = 0.5;
// If a new kick exceeds peak by this factor, reset calibration (stronger section arrived)
const PEAK_RESET_FACTOR = 2.0;

// Cooldown detection
const COOLDOWN_ENTER_BEATS = 4;
const COOLDOWN_EXIT_RATIO = 0.5;

function computeBandEnergyFromFloat(data, lowBin, highBin) {
  if (lowBin >= highBin) return 0;
  let sum = 0;
  for (let i = lowBin; i < highBin; i++) {
    // data[i] is in dB (typically -100 to 0), convert to linear energy
    const linear = Math.pow(10, data[i] / 20);
    sum += linear * linear;
  }
  return Math.sqrt(sum / (highBin - lowBin));
}

function binIndexForFrequency(freq, sampleRate, fftSize) {
  return Math.round(freq * fftSize / sampleRate);
}

function computeBandEnergy(data, lowBin, highBin) {
  if (lowBin >= highBin) return 0;
  let sum = 0;
  for (let i = lowBin; i < highBin; i++) {
    const v = data[i] / 255;
    sum += v * v;
  }
  return Math.sqrt(sum / (highBin - lowBin));
}

function computeRMS(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 255;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

function computeCentroid(data, sampleRate, fftSize) {
  let weightedSum = 0;
  let totalEnergy = 0;
  const binWidth = sampleRate / fftSize;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 255;
    const energy = v * v;
    weightedSum += energy * (i * binWidth);
    totalEnergy += energy;
  }
  if (totalEnergy === 0) return 0;
  const centroid = weightedSum / totalEnergy;
  const loFreq = 200;
  const hiFreq = 6000;
  const normalized = (centroid - loFreq) / (hiFreq - loFreq);
  return Math.max(0, Math.min(1, normalized));
}

class AudioFile {
  constructor(id, name, audioBuffer, audioContext) {
    this.id = id;
    this.name = name;
    this.audioBuffer = audioBuffer;
    this.audioContext = audioContext;

    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.3;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 1;
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(audioContext.destination);

    this._frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this._floatFrequencyData = new Float32Array(this.analyser.frequencyBinCount);
    this._sourceNode = null;
    this._startOffset = 0;
    this._startTime = 0;
    this.playing = false;
    this.loop = true;

    this.analysis = { bass: 0, mids: 0, treble: 0, volume: 0, centroid: 0, beat: 0, beatCount: 0, beatInterval: 0, isLocked: false, isCooldown: false };

    // Onset detection (used during calibration)
    this._prevKick = 0;
    this._fluxBuffer = new Float32Array(FLUX_BUFFER_SIZE);
    this._fluxBufferIndex = 0;
    this._fluxBufferFilled = 0;
    this._prevFlux = 0;
    this._refractoryCounter = 0;

    // Tempo state machine
    this._tempoState = 'calibrating';
    this._onsetTimes = [];
    this._beatInterval = 0;
    this._phaseOffset = 0;
    this._peakKickEnergy = 0;

    // Cooldown detection
    this._kickEnergyBaseline = 0;
    this._lowEnergyBeats = 0;
    this._prevBeatIndex = -1;

    this._lastAnalysisFrame = -1;
  }

  play() {
    if (this.playing) return;
    this._sourceNode = this.audioContext.createBufferSource();
    this._sourceNode.buffer = this.audioBuffer;
    this._sourceNode.loop = this.loop;
    this._sourceNode.connect(this.analyser);
    this._sourceNode.start(0, this._startOffset);
    this._startTime = this.audioContext.currentTime;
    this.playing = true;

    this._sourceNode.onended = () => {
      if (this.playing) {
        this._startOffset = 0;
        this.playing = false;
      }
    };
  }

  pause() {
    if (!this.playing) return;
    this._startOffset += this.audioContext.currentTime - this._startTime;
    this._sourceNode.onended = null;
    this._sourceNode.stop();
    this._sourceNode.disconnect();
    this._sourceNode = null;
    this.playing = false;
  }

  stop() {
    if (this.playing) {
      this._sourceNode.onended = null;
      this._sourceNode.stop();
      this._sourceNode.disconnect();
      this._sourceNode = null;
      this.playing = false;
    }
    this._startOffset = 0;
  }

  setVolume(v) {
    this.gainNode.gain.value = v;
  }

  analyse(frameId) {
    if (this._lastAnalysisFrame === frameId) return this.analysis;
    this._lastAnalysisFrame = frameId;

    if (!this.playing) return this.analysis;

    this.analyser.getByteFrequencyData(this._frequencyData);

    const sr = this.audioContext.sampleRate;
    const fft = this.analyser.fftSize;
    const data = this._frequencyData;

    for (const [band, [lo, hi]] of Object.entries(BAND_RANGES)) {
      const loBin = binIndexForFrequency(lo, sr, fft);
      const hiBin = binIndexForFrequency(hi, sr, fft);
      this.analysis[band] = computeBandEnergy(data, loBin, hiBin);
    }

    this.analysis.volume = computeRMS(data);
    this.analysis.centroid = computeCentroid(data, sr, fft);

    this.analyser.getFloatFrequencyData(this._floatFrequencyData);

    const kickLoBin = binIndexForFrequency(KICK_RANGE[0], sr, fft);
    const kickHiBin = binIndexForFrequency(KICK_RANGE[1], sr, fft);
    const kickEnergy = computeBandEnergyFromFloat(this._floatFrequencyData, kickLoBin, kickHiBin);

    const now = this.audioContext.currentTime;

    if (this._tempoState === 'calibrating') {
      this._analyseCalibrating(kickEnergy, now);
    } else {
      this._analyseLocked(kickEnergy, now);
    }

    return this.analysis;
  }

  _analyseCalibrating(kickEnergy, now) {
    const flux = Math.max(0, kickEnergy - this._prevKick);
    this._prevKick = kickEnergy;

    this._fluxBuffer[this._fluxBufferIndex] = flux;
    this._fluxBufferIndex = (this._fluxBufferIndex + 1) % FLUX_BUFFER_SIZE;
    if (this._fluxBufferFilled < FLUX_BUFFER_SIZE) this._fluxBufferFilled++;

    let fluxSum = 0;
    for (let i = 0; i < this._fluxBufferFilled; i++) fluxSum += this._fluxBuffer[i];
    const fluxMean = fluxSum / this._fluxBufferFilled;

    const isPeak = flux >= this._prevFlux;
    this._prevFlux = flux;

    if (this._refractoryCounter > 0) { this._refractoryCounter--; return; }

    const threshold = fluxMean * ONSET_MULTIPLIER + ONSET_FLOOR;

    // Debug: log every 60 frames to see energy levels
    if (this._lastAnalysisFrame % 60 === 0) {
      console.log('[calibrating]', {
        kickEnergy: kickEnergy.toFixed(4),
        flux: flux.toFixed(4),
        fluxMean: fluxMean.toFixed(4),
        threshold: threshold.toFixed(4),
        isPeak,
        onsets: this._onsetTimes.length,
      });
    }

    if (flux > threshold && isPeak) {
      this._refractoryCounter = REFRACTORY_FRAMES;

      // Reset calibration if a much stronger kick arrives (new section)
      if (this._peakKickEnergy > 0 && kickEnergy > this._peakKickEnergy * PEAK_RESET_FACTOR) {
        this._onsetTimes = [];
        console.log(`[calibrating] Reset — stronger kicks detected (${kickEnergy.toFixed(4)} vs peak ${this._peakKickEnergy.toFixed(4)})`);
      }

      if (kickEnergy > this._peakKickEnergy) {
        this._peakKickEnergy = kickEnergy;
      }

      // Only accept onsets with energy close to peak level
      if (kickEnergy < this._peakKickEnergy * ONSET_ENERGY_RATIO) return;

      this._onsetTimes.push(now);
      console.log(`[calibrating] Onset #${this._onsetTimes.length} at ${now.toFixed(3)}s (energy: ${kickEnergy.toFixed(4)}, peak: ${this._peakKickEnergy.toFixed(4)})`);

      if (this._onsetTimes.length >= MIN_ONSETS_FOR_LOCK) {
        this._tryLockTempo();
      }
    }

    this.analysis.beat = 0;
    this.analysis.beatCount = 0;
    this.analysis.beatInterval = 0;
    this.analysis.isLocked = false;
    this.analysis.isCooldown = false;
  }

  _tryLockTempo() {
    const times = this._onsetTimes.slice(-MIN_ONSETS_FOR_LOCK);

    // Try strides 1, 2, 3 to skip sub-beat onsets (e.g. bass line between kicks)
    for (const stride of [1, 2, 3]) {
      const intervals = [];
      for (let i = stride; i < times.length; i++) {
        const iv = times[i] - times[i - stride];
        // Filter to reasonable BPM range: 60-200 BPM = 300-1000ms
        if (iv >= 0.300 && iv <= 1.000) {
          intervals.push(iv);
        }
      }

      if (intervals.length < 3) continue;

      intervals.sort((a, b) => a - b);
      const median = intervals[Math.floor(intervals.length / 2)];

      const allConsistent = intervals.every(
        iv => Math.abs(iv - median) / median <= INTERVAL_TOLERANCE
      );

      console.log(`[calibrating] stride ${stride}:`, intervals.map(iv => (iv * 1000).toFixed(0) + 'ms'), 'median:', (median * 1000).toFixed(0) + 'ms', allConsistent ? 'LOCK' : 'inconsistent');

      if (allConsistent) {
        let finalInterval = median;

        // Octave correction: try halving the interval and check if onsets
        // align better on the faster grid
        const halfInterval = median / 2;
        if (halfInterval >= 0.250) { // ≤ 240 BPM
          const ref = times[times.length - 1];
          let aligned = 0;
          for (const t of times) {
            const phase = ((ref - t) / halfInterval) % 1;
            if (phase < 0.15 || phase > 0.85) aligned++;
          }
          if (aligned >= times.length * 0.6) {
            finalInterval = halfInterval;
            console.log(`[calibrating] Octave correction: ${aligned}/${times.length} onsets align on ${(halfInterval * 1000).toFixed(0)}ms grid`);
          }
        }

        this._beatInterval = finalInterval;
        this._phaseOffset = this._onsetTimes[this._onsetTimes.length - 1];
        this._tempoState = 'locked';
        this._prevBeatIndex = 0;
        console.log(`[beat] Tempo locked: ${(60 / this._beatInterval).toFixed(1)} BPM (stride ${stride})`);
        return;
      }
    }

    // Prune old onsets and keep trying
    if (this._onsetTimes.length > MIN_ONSETS_FOR_LOCK * 2) {
      this._onsetTimes = this._onsetTimes.slice(-MIN_ONSETS_FOR_LOCK);
    }
  }

  _analyseLocked(kickEnergy, now) {
    this._prevKick = kickEnergy;

    const beatCount = (now - this._phaseOffset) / this._beatInterval;
    this.analysis.beatCount = beatCount;
    this.analysis.beatInterval = this._beatInterval;
    this.analysis.isLocked = true;

    // Check transitions on beat boundaries
    const beatIndex = Math.floor(beatCount);
    if (beatIndex !== this._prevBeatIndex) {
      this._prevBeatIndex = beatIndex;

      if (this._tempoState === 'locked') {
        // Build up baseline from kick energy while kicks are present
        if (this._kickEnergyBaseline === 0) {
          this._kickEnergyBaseline = kickEnergy;
        } else {
          this._kickEnergyBaseline = this._kickEnergyBaseline * 0.9 + kickEnergy * 0.1;
        }

        if (kickEnergy < this._kickEnergyBaseline * 0.3) {
          this._lowEnergyBeats++;
          if (this._lowEnergyBeats >= COOLDOWN_ENTER_BEATS) {
            this._tempoState = 'cooldown';
            console.log('[beat] Cooldown');
          }
        } else {
          this._lowEnergyBeats = 0;
        }
      } else {
        // Exit cooldown when kick energy returns
        if (kickEnergy > this._kickEnergyBaseline * COOLDOWN_EXIT_RATIO) {
          this._tempoState = 'locked';
          this._lowEnergyBeats = 0;
          console.log('[beat] Kicks back');
        }
      }
    }

    this.analysis.isCooldown = this._tempoState === 'cooldown';
    this.analysis.beat = 0;
  }

  dispose() {
    this.stop();
    this.analyser.disconnect();
    this.gainNode.disconnect();
  }
}

export class AudioFileManager {
  static getInstance() {
    if (!instance) {
      instance = new AudioFileManager();
    }
    return instance;
  }

  constructor() {
    this._audioContext = null;
    this._files = new Map();
    this._nextId = 1;
    this._frameId = 0;
  }

  _ensureContext() {
    if (!this._audioContext) {
      this._audioContext = new AudioContext();
    }
    if (this._audioContext.state === 'suspended') {
      this._audioContext.resume();
    }
    return this._audioContext;
  }

  async loadFile(file) {
    const ctx = this._ensureContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const id = String(this._nextId++);
    const audioFile = new AudioFile(id, file.name, audioBuffer, ctx);
    this._files.set(id, audioFile);
    return id;
  }

  removeFile(id) {
    const file = this._files.get(id);
    if (!file) return;
    file.dispose();
    this._files.delete(id);
  }

  getFile(id) {
    return this._files.get(id) ?? null;
  }

  getFileList() {
    return [...this._files.values()].map(f => ({ id: f.id, name: f.name }));
  }

  getAnalysis(fileId) {
    const file = this._files.get(fileId);
    if (!file) return null;
    return file.analyse(this._frameId);
  }

  advanceFrame() {
    this._frameId++;
  }

  hasFiles() {
    return this._files.size > 0;
  }

  dispose() {
    for (const file of this._files.values()) file.dispose();
    this._files.clear();
    if (this._audioContext) {
      this._audioContext.close();
      this._audioContext = null;
    }
    instance = null;
  }
}
