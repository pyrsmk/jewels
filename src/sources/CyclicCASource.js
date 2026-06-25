import { AbstractSource } from '../core/AbstractSource.js';
import { createProgram } from '../utils/webgl.js';
import { mulberry32 } from '../utils/math.js';
import { PALETTES } from '../core/palettes.js';
import { quadVS, HASH_GLSL, paletteRenderFS } from '../shaders/common.js';

// ===== Shader =====

const simCyclicFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform ivec2 u_gridSize;
uniform int u_numStates;
uniform int u_threshold;
uniform float u_spawnRate;
uniform float u_seed;
out vec4 fragColor;
${HASH_GLSL}
void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  float raw = texelFetch(u_state, coord, 0).r;
  int state = int(raw * float(u_numStates - 1) + 0.5);
  int next = (state + 1) % u_numStates;
  float nextNorm = float(next) / float(u_numStates - 1);
  int count = 0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) continue;
      ivec2 nc = (coord + ivec2(dx, dy) + u_gridSize) % u_gridSize;
      float ns = texelFetch(u_state, nc, 0).r;
      int nsi = int(ns * float(u_numStates - 1) + 0.5);
      if (nsi == next) count++;
    }
  }
  float newState = (count >= u_threshold) ? nextNorm : raw;
  if (newState == raw && u_spawnRate > 0.0) {
    float r = hash(vec2(coord) + vec2(u_seed, u_seed * 1.37));
    if (r < u_spawnRate) {
      float r2 = hash(vec2(coord) + vec2(u_seed * 2.71, u_seed * 0.83));
      int randState = int(r2 * float(u_numStates));
      newState = float(randState) / float(u_numStates - 1);
    }
  }
  fragColor = vec4(newState);
}`;

const renderFS = paletteRenderFS;

// ===== Source class =====

export class CyclicCASource extends AbstractSource {

  constructor(options = {}) {
    const defaults = {
      numStates: 14,
      threshold: 1,
      gridResolution: 256,
      speed: 0.485,
      spawnRate: 0,
      palette: 'aurora',
      seed: null,
    };
    super(
      { ...defaults, ...options },
      ['numStates', 'threshold', 'gridResolution', 'speed', 'spawnRate', 'palette'],
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
    this._stepSeed = 0;
    this._stepAccumulator = 0;

    this._simProg = null;
    this._renderProg = null;
    this._quadBuffer = null;
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

    this._simProg = this._buildProgram(simCyclicFS);
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
    if (this._simProg) { gl.deleteVertexArray(this._simProg.vao); gl.deleteProgram(this._simProg.program); }
    if (this._renderProg) { gl.deleteVertexArray(this._renderProg.vao); gl.deleteProgram(this._renderProg.program); }
    if (this._quadBuffer) gl.deleteBuffer(this._quadBuffer);
  }

  // ----- Simulation -----

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

    const maxSteps = 20;
    let steps = 0;
    while (this._stepAccumulator >= stepInterval && steps < maxSteps) {
      this._simStep();
      this._stepAccumulator -= stepInterval;
      steps++;
    }
    if (steps >= maxSteps) this._stepAccumulator = 0;
  }

  _simStep() {
    const gl = this.gl;
    const spawnRate = +(this.options.spawnRate ?? 0) / 1000000;
    this._stepSeed += 1.0;

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
    gl.uniform2i(prog.locs.u_gridSize, this._gridW, this._gridH);
    gl.uniform1i(prog.locs.u_numStates, Math.round(+(this.options.numStates ?? 14)));
    gl.uniform1i(prog.locs.u_threshold, Math.round(+(this.options.threshold ?? 1)));
    gl.uniform1f(prog.locs.u_spawnRate, spawnRate);
    gl.uniform1f(prog.locs.u_seed, this._stepSeed);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
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

    const pal = PALETTES[this.options.palette] ?? PALETTES.aurora;
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
    const N = Math.round(+(this.options.numStates ?? 14));
    const data = new Float32Array(w * h);

    for (let i = 0; i < w * h; i++) {
      const s = Math.floor(rng() * N);
      data[i] = s / (N - 1);
    }

    gl.bindTexture(gl.TEXTURE_2D, this._texA.tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RED, gl.FLOAT, data);
    this._pingPong = 0;
  }

  reseed() {
    this.options.seed = null;
    this._initGrid();
  }

  setParameters(params) {
    const needsRebuild =
      params.gridResolution !== undefined && params.gridResolution !== this.options.gridResolution ||
      params.numStates !== undefined && params.numStates !== this.options.numStates ||
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, w, h, 0, gl.RED, gl.HALF_FLOAT, null);
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
