import { AbstractSource } from '../core/AbstractSource.js';
import { createProgram } from '../utils/webgl.js';
import { mulberry32 } from '../utils/math.js';
import { PALETTES } from '../core/palettes.js';
import { quadVS, paletteRenderFS } from '../shaders/common.js';

// ===== Presets =====

const PRESETS = {
  smoothgol: { ra: 10, ri: 3,  birthLo: 0.278, birthHi: 0.365, deathLo: 0.267, deathHi: 0.445, alphaM: 0.147, alphaN: 0.028, dt: 0.1 },
  gliders:   { ra: 12, ri: 4,  birthLo: 0.278, birthHi: 0.365, deathLo: 0.267, deathHi: 0.445, alphaM: 0.147, alphaN: 0.028, dt: 0.05 },
  blobs:     { ra: 8,  ri: 2,  birthLo: 0.21,  birthHi: 0.33,  deathLo: 0.21,  deathHi: 0.50,  alphaM: 0.12,  alphaN: 0.02,  dt: 0.08 },
};

// ===== Shader =====

const simSmoothLifeFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform sampler2D u_kernel;
uniform ivec2 u_gridSize;
uniform int u_kernelRadius;
uniform float u_birthLo;
uniform float u_birthHi;
uniform float u_deathLo;
uniform float u_deathHi;
uniform float u_alphaM;
uniform float u_alphaN;
uniform float u_dt;
uniform float u_decay;
out vec4 fragColor;

float sigmoid(float x, float a, float alpha) {
  return 1.0 / (1.0 + exp(-(x - a) * 4.0 / alpha));
}

float sigmoidAB(float x, float a, float b, float alpha) {
  return sigmoid(x, a, alpha) * (1.0 - sigmoid(x, b, alpha));
}

float transition(float inner, float outer) {
  float alive = sigmoidAB(outer, u_birthLo, u_birthHi, u_alphaN);
  float dead = sigmoidAB(outer, u_deathLo, u_deathHi, u_alphaN);
  return sigmoid(inner, 0.5, u_alphaM) * (alive - dead) + dead;
}

void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  float state = texelFetch(u_state, coord, 0).r;
  int R = u_kernelRadius;

  float innerSum = 0.0;
  float outerSum = 0.0;

  for (int dy = -R; dy <= R; dy++) {
    for (int dx = -R; dx <= R; dx++) {
      ivec2 nc = (coord + ivec2(dx, dy) + u_gridSize) % u_gridSize;
      float s = texelFetch(u_state, nc, 0).r;
      vec2 w = texelFetch(u_kernel, ivec2(dx + R, dy + R), 0).rg;
      innerSum += s * w.r;
      outerSum += s * w.g;
    }
  }

  float t = transition(innerSum, outerSum);
  float newState = clamp(state + u_dt * (2.0 * t - 1.0) - u_decay, 0.0, 1.0);
  fragColor = vec4(newState);
}`;

const renderFS = paletteRenderFS;

// ===== Source class =====

export class SmoothLifeSource extends AbstractSource {

  constructor(options = {}) {
    const defaults = {
      preset: 'smoothgol',
      ra: 10,
      ri: 3,
      birthLo: 0.278,
      birthHi: 0.365,
      deathLo: 0.267,
      deathHi: 0.445,
      alphaM: 0.147,
      alphaN: 0.028,
      dt: 0.1,
      gridResolution: 256,
      speed: 0.485,
      palette: 'cool',
      initMode: 'blobs',
      seed: null,
      seedLoop: false,
    };
    super(
      { ...defaults, ...options },
      ['preset', 'ra', 'ri', 'birthLo', 'birthHi', 'deathLo', 'deathHi', 'alphaM', 'alphaN', 'dt', 'gridResolution', 'speed', 'palette', 'initMode', 'seedLoop'],
      [],
    );
    this.gl = null;
    this._texA = null;
    this._texB = null;
    this._pingPong = 0;
    this._gridW = 0;
    this._gridH = 0;
    this._screenW = 0;
    this._screenH = 0;
    this._stepAccumulator = 0;

    this._simProg = null;
    this._renderProg = null;
    this._quadBuffer = null;

    // Seed loop state
    this._simStepCount = 0;
    this._prevSnapshot = null;
    this._stableCount = 0;
    this._decaying = false;
    this._currentDecay = 0;
    this._kernelTex = null;
    this._kernelRa = -1;
    this._kernelRi = -1;
    this._renderContext = { time: 0, gl: null, dpr: 1, locs: null };
  }

  // ----- GPU lifecycle -----

  setupGPU(runtime) {
    const gl = runtime.gl;
    this.gl = gl;

    const quadData = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this._quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

    this._simProg = this._buildProgram(simSmoothLifeFS);
    this._renderProg = this._buildProgram(renderFS);

    this._screenW = runtime.state?.width ?? 800;
    this._screenH = runtime.state?.height ?? 600;

    this._rebuildGrid();
  }

  resizeGPU(runtime) {
    const w = runtime.state?.width ?? this._screenW;
    const h = runtime.state?.height ?? this._screenH;
    if (w !== this._screenW || h !== this._screenH) {
      this._screenW = w;
      this._screenH = h;
      this._rebuildGrid();
    }
  }

  dispose() {
    super.dispose();
    const gl = this.gl;
    if (!gl) return;
    this._destroySimTextures();
    if (this._kernelTex) gl.deleteTexture(this._kernelTex);
    if (this._simProg) { gl.deleteVertexArray(this._simProg.vao); gl.deleteProgram(this._simProg.program); }
    if (this._renderProg) { gl.deleteVertexArray(this._renderProg.vao); gl.deleteProgram(this._renderProg.program); }
    if (this._quadBuffer) gl.deleteBuffer(this._quadBuffer);
  }

  // ----- Simulation -----

  static STABILITY_CHECK_INTERVAL = 15;
  static STABILITY_THRESHOLD = 0.02;
  static DEAD_THRESHOLD = 0.001;
  static DECAY_RATE = 0.005;
  static DECAY_MAX = 0.15;

  _getStepsPerSecond() {
    const t = +(this.options.speed ?? 0.35);
    if (t <= 0.6) return 0.5 * Math.pow(120, t / 0.6);
    return 60 * Math.pow(20, (t - 0.6) / 0.4);
  }

  update({ deltaTime } = {}) {
    const gl = this.gl;
    if (!gl || !this._texA) return;

    const dt = deltaTime ?? 0;
    const stepsPerSec = this._getStepsPerSecond();
    const stepInterval = 1.0 / stepsPerSec;

    this._stepAccumulator += dt;

    if (this._decaying) {
      this._currentDecay = Math.min(
        this._currentDecay + dt * SmoothLifeSource.DECAY_RATE,
        SmoothLifeSource.DECAY_MAX,
      );
    }

    const maxSteps = 10;
    let steps = 0;
    while (this._stepAccumulator >= stepInterval && steps < maxSteps) {
      this._simStep();
      this._stepAccumulator -= stepInterval;
      steps++;

      if (this.options.seedLoop && !this._decaying) {
        this._simStepCount++;
        if (this._simStepCount >= SmoothLifeSource.STABILITY_CHECK_INTERVAL) {
          this._simStepCount = 0;
          if (this._checkStability()) {
            this._decaying = true;
            this._currentDecay = 0;
          }
        }
      }
    }
    if (steps >= maxSteps) this._stepAccumulator = 0;

    if (this._decaying && this._checkDead()) {
      this._resetSeedLoopState();
      this.reseed();
    }
  }

  _checkStability() {
    const gl = this.gl;
    const w = this._gridW;
    const h = this._gridH;
    const pixelCount = w * h;
    const stateTex = this._pingPong === 0 ? this._texA : this._texB;
    gl.bindFramebuffer(gl.FRAMEBUFFER, stateTex.fbo);
    const current = new Float32Array(pixelCount * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, current);
    let energy = 0;
    for (let i = 0; i < pixelCount; i++) energy += current[i * 4];
    energy /= pixelCount;
    if (energy < SmoothLifeSource.DEAD_THRESHOLD) {
      this._prevSnapshot = current;
      return true;
    }
    if (this._prevSnapshot) {
      let diff = 0;
      for (let i = 0; i < pixelCount; i++) diff += Math.abs(current[i * 4] - this._prevSnapshot[i * 4]);
      diff /= pixelCount;
      if (diff < SmoothLifeSource.STABILITY_THRESHOLD) {
        this._stableCount++;
      } else {
        this._stableCount = Math.max(0, this._stableCount - 1);
      }
    }
    this._prevSnapshot = current;
    return this._stableCount >= 2;
  }

  _checkDead() {
    const gl = this.gl;
    const w = this._gridW;
    const h = this._gridH;
    const pixelCount = w * h;
    const stateTex = this._pingPong === 0 ? this._texA : this._texB;
    gl.bindFramebuffer(gl.FRAMEBUFFER, stateTex.fbo);
    const data = new Float32Array(pixelCount * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, data);
    let energy = 0;
    for (let i = 0; i < pixelCount; i++) energy += data[i * 4];
    return energy / pixelCount < SmoothLifeSource.DEAD_THRESHOLD;
  }

  _resetSeedLoopState() {
    this._simStepCount = 0;
    this._prevSnapshot = null;
    this._stableCount = 0;
    this._decaying = false;
    this._currentDecay = 0;
  }

  _simStep() {
    const gl = this.gl;

    const ra = Math.round(+(this.options.ra ?? 10));
    const ri = Math.round(+(this.options.ri ?? 3));
    if (ra !== this._kernelRa || ri !== this._kernelRi) {
      this._buildKernelTexture(ra, ri);
    }

    const read = this._pingPong === 0 ? this._texA : this._texB;
    const write = this._pingPong === 0 ? this._texB : this._texA;
    this._pingPong = 1 - this._pingPong;

    const prog = this._simProg;
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
    gl.viewport(0, 0, this._gridW, this._gridH);
    gl.useProgram(prog.program);
    gl.bindVertexArray(prog.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.tex);
    gl.uniform1i(prog.locs.u_state, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._kernelTex);
    gl.uniform1i(prog.locs.u_kernel, 1);

    gl.uniform2i(prog.locs.u_gridSize, this._gridW, this._gridH);
    gl.uniform1i(prog.locs.u_kernelRadius, ra);
    gl.uniform1f(prog.locs.u_birthLo, +(this.options.birthLo ?? 0.278));
    gl.uniform1f(prog.locs.u_birthHi, +(this.options.birthHi ?? 0.365));
    gl.uniform1f(prog.locs.u_deathLo, +(this.options.deathLo ?? 0.267));
    gl.uniform1f(prog.locs.u_deathHi, +(this.options.deathHi ?? 0.445));
    gl.uniform1f(prog.locs.u_alphaM, +(this.options.alphaM ?? 0.147));
    gl.uniform1f(prog.locs.u_alphaN, +(this.options.alphaN ?? 0.028));
    gl.uniform1f(prog.locs.u_dt, +(this.options.dt ?? 0.1));
    gl.uniform1f(prog.locs.u_decay, this._decaying ? this._currentDecay : 0.0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  _buildKernelTexture(ra, ri) {
    const gl = this.gl;
    const size = 2 * ra + 1;
    // RG channels: R=inner disk weight, G=outer annulus weight
    const data = new Float32Array(size * size * 2);

    let innerTotal = 0;
    let outerTotal = 0;

    for (let dy = -ra; dy <= ra; dy++) {
      for (let dx = -ra; dx <= ra; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = ((dy + ra) * size + (dx + ra)) * 2;
        if (dist <= ri) {
          // Inner disk
          data[idx] = 1.0;
          innerTotal += 1.0;
        } else if (dist <= ra) {
          // Outer annulus
          data[idx + 1] = 1.0;
          outerTotal += 1.0;
        }
      }
    }

    // Normalize
    if (innerTotal > 0) {
      for (let i = 0; i < size * size; i++) data[i * 2] /= innerTotal;
    }
    if (outerTotal > 0) {
      for (let i = 0; i < size * size; i++) data[i * 2 + 1] /= outerTotal;
    }

    if (this._kernelTex) gl.deleteTexture(this._kernelTex);

    this._kernelTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._kernelTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, size, size, 0, gl.RG, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this._kernelRa = ra;
    this._kernelRi = ri;
  }

  // ----- Rendering -----

  renderSource() {}

  renderScenePass(context = {}) {
    const { gl, state } = context;
    if (!gl || !state || !this._renderProg) return;

    const stateTex = this._pingPong === 0 ? this._texA : this._texB;

    gl.bindFramebuffer(gl.FRAMEBUFFER, state.sceneTex.fbo);
    gl.viewport(0, 0, state.width, state.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const prog = this._renderProg;
    gl.useProgram(prog.program);
    gl.bindVertexArray(prog.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, stateTex.tex);
    gl.uniform1i(prog.locs.u_state, 0);

    const pal = PALETTES[this.options.palette] ?? PALETTES.cool;
    gl.uniform3fv(prog.locs.u_palDark, pal[0]);
    gl.uniform3fv(prog.locs.u_palMid, pal[1]);
    gl.uniform3fv(prog.locs.u_palBright, pal[2]);

    const rc = this._renderContext;
    rc.time = context.time ?? 0;
    rc.gl = gl;
    rc.dpr = state.dpr;
    rc.locs = prog.locs;
    for (const effect of context.effects ?? []) {
      effect.applyScenePass(rc);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  // ----- Grid management -----

  _rebuildGrid() {
    const res = Math.max(32, Math.min(512, Math.round(+(this.options.gridResolution ?? 256))));
    const aspect = this._screenW / Math.max(1, this._screenH);
    const gridH = res;
    const gridW = Math.max(32, Math.round(res * aspect));

    this._resetSeedLoopState();
    this._destroySimTextures();
    this._gridW = gridW;
    this._gridH = gridH;
    this._texA = this._createSimTexture(gridW, gridH);
    this._texB = this._createSimTexture(gridW, gridH);
    this._pingPong = 0;

    this._initGrid();
  }

  _initGrid() {
    const gl = this.gl;
    if (!gl) return;

    if (this.options.seed === null) {
      this.options.seed = Math.floor(Math.random() * 2147483647);
    }
    const rng = mulberry32(this.options.seed);

    const w = this._gridW;
    const h = this._gridH;
    const data = new Float32Array(w * h);

    switch (this.options.initMode) {
      case 'perlin':  this._initPerlinNoise(data, w, h, rng); break;
      case 'uniform': this._initUniformNoise(data, w, h, rng); break;
      default:        this._initBlobs(data, w, h, rng); break;
    }

    gl.bindTexture(gl.TEXTURE_2D, this._texA.tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RED, gl.FLOAT, data);
    this._pingPong = 0;
  }

  _initBlobs(data, w, h, rng) {
    const blobCount = 3 + Math.floor(rng() * 4);
    for (let b = 0; b < blobCount; b++) {
      const cx = rng() * w;
      const cy = rng() * h;
      const r = 5 + rng() * 15;
      const amp = 0.6 + rng() * 0.4;
      const rSq = r * r;
      const minX = Math.max(0, Math.floor(cx - r * 3));
      const maxX = Math.min(w - 1, Math.ceil(cx + r * 3));
      const minY = Math.max(0, Math.floor(cy - r * 3));
      const maxY = Math.min(h - 1, Math.ceil(cy + r * 3));
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const v = amp * Math.exp(-(dx * dx + dy * dy) / (2.0 * rSq));
          const idx = y * w + x;
          data[idx] = Math.min(1.0, data[idx] + v);
        }
      }
    }
  }

  _initPerlinNoise(data, w, h, rng) {
    const scale = 6 + rng() * 4;
    const cellsX = Math.ceil(scale * (w / h)) + 2;
    const cellsY = Math.ceil(scale) + 2;
    const lattice = [];
    for (let y = 0; y < cellsY; y++) {
      const row = [];
      for (let x = 0; x < cellsX; x++) row.push(rng());
      lattice.push(row);
    }
    const smoothstep = (t) => t * t * (3 - 2 * t);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const fx = (x / w) * (cellsX - 1);
        const fy = (y / h) * (cellsY - 1);
        const ix = Math.floor(fx);
        const iy = Math.floor(fy);
        const tx = smoothstep(fx - ix);
        const ty = smoothstep(fy - iy);
        const v00 = lattice[iy][ix];
        const v10 = lattice[iy][Math.min(ix + 1, cellsX - 1)];
        const v01 = lattice[Math.min(iy + 1, cellsY - 1)][ix];
        const v11 = lattice[Math.min(iy + 1, cellsY - 1)][Math.min(ix + 1, cellsX - 1)];
        const v = v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty;
        data[y * w + x] = v * v;
      }
    }
  }

  _initUniformNoise(data, w, h, rng) {
    const density = 0.3 + rng() * 0.3;
    for (let i = 0; i < w * h; i++) {
      data[i] = rng() * density;
    }
  }

  reseed() {
    this._resetSeedLoopState();
    this.options.seed = null;
    this._initGrid();
  }

  applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    this.setParameters({ preset: name, ...preset });
    this.reseed();
  }

  setParameters(params) {
    const needsRebuild =
      params.gridResolution !== undefined && params.gridResolution !== this.options.gridResolution ||
      params.seed !== undefined && params.seed !== this.options.seed;
    super.setParameters(params);
    if (needsRebuild && this.gl) this._rebuildGrid();
  }

  // ----- Helpers -----

  _buildProgram(fragmentSource) {
    const gl = this.gl;
    const program = createProgram(gl, quadVS, fragmentSource);
    const locs = this._resolveAllLocs(gl, program);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.enableVertexAttribArray(locs.a_pos);
    gl.vertexAttribPointer(locs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return { program, locs, vao };
  }

  _createSimTexture(w, h) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, w, h, 0, gl.RED, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  }

  _destroySimTextures() {
    const gl = this.gl;
    if (!gl) return;
    if (this._texA) { gl.deleteTexture(this._texA.tex); gl.deleteFramebuffer(this._texA.fbo); }
    if (this._texB) { gl.deleteTexture(this._texB.tex); gl.deleteFramebuffer(this._texB.fbo); }
    this._texA = null;
    this._texB = null;
  }

  getDrawCount() { return 0; }
  syncValueDisplays() {}
}
