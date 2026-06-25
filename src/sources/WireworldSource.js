import { AbstractSource } from '../core/AbstractSource.js';
import { createProgram } from '../utils/webgl.js';
import { mulberry32 } from '../utils/math.js';
import { PALETTES } from '../core/palettes.js';
import { quadVS, HASH_GLSL, paletteRenderFS } from '../shaders/common.js';

// ===== Shader =====
// States: empty=0.0, conductor=0.33, tail=0.66, head=1.0

const simWireworldFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform ivec2 u_gridSize;
uniform float u_spawnRate;
uniform float u_seed;
out vec4 fragColor;
${HASH_GLSL}
void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  float state = texelFetch(u_state, coord, 0).r;
  float newState;
  if (state > 0.83) {
    // head -> tail
    newState = 0.66;
  } else if (state > 0.5) {
    // tail -> conductor
    newState = 0.33;
  } else if (state > 0.16) {
    // conductor -> head if 1 or 2 head neighbors
    int heads = 0;
    for (int dy = -1; dy <= 1; dy++) {
      for (int dx = -1; dx <= 1; dx++) {
        if (dx == 0 && dy == 0) continue;
        ivec2 nc = (coord + ivec2(dx, dy) + u_gridSize) % u_gridSize;
        if (texelFetch(u_state, nc, 0).r > 0.83) heads++;
      }
    }
    newState = (heads == 1 || heads == 2) ? 1.0 : 0.33;
    // Spawn: conductor -> head randomly
    if (newState < 0.5 && u_spawnRate > 0.0) {
      float r = hash(vec2(coord) + vec2(u_seed, u_seed * 1.37));
      if (r < u_spawnRate) newState = 1.0;
    }
  } else {
    // empty: chance to become conductor
    newState = 0.0;
    if (u_spawnRate > 0.0) {
      float r = hash(vec2(coord) + vec2(u_seed, u_seed * 1.37));
      if (r < u_spawnRate * 0.1) newState = 0.33;
    }
  }
  fragColor = vec4(newState);
}`;

const renderFS = paletteRenderFS;

// ===== Source class =====

export class WireworldSource extends AbstractSource {

  constructor(options = {}) {
    const defaults = {
      initMode: 'multi',
      gridResolution: 128,
      speed: 0.3,
      spawnRate: 10,
      conductorDensity: 0.3,
      palette: 'cyberpunk',
      seed: null,
    };
    super(
      { ...defaults, ...options },
      ['initMode', 'gridResolution', 'speed', 'spawnRate', 'conductorDensity', 'palette'],
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

    this._simProg = this._buildProgram(simWireworldFS);
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

    const pal = PALETTES[this.options.palette] ?? PALETTES.cyberpunk;
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
    const res = Math.max(32, Math.min(512, Math.round(+(this.options.gridResolution ?? 128))));
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
    const data = new Float32Array(w * h);
    const density = +(this.options.conductorDensity ?? 0.3);

    if (this.options.initMode === 'single') {
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      const radius = 5;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < w && y >= 0 && y < h && rng() < density) {
            data[y * w + x] = 0.33; // conductor
          }
        }
      }
      // Add a few electron heads in the cluster
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < w && y >= 0 && y < h && data[y * w + x] > 0.16 && rng() < 0.1) {
            data[y * w + x] = 1.0; // head
          }
        }
      }
    } else {
      for (let i = 0; i < w * h; i++) {
        data[i] = rng() < density ? 0.33 : 0.0;
      }
      for (let i = 0; i < w * h; i++) {
        if (data[i] > 0.16 && rng() < 0.02) {
          data[i] = 1.0; // head
        }
      }
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
      params.initMode !== undefined && params.initMode !== this.options.initMode ||
      params.conductorDensity !== undefined && params.conductorDensity !== this.options.conductorDensity ||
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
