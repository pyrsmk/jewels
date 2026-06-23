import { AbstractSource } from '../core/AbstractSource.js';
import { createProgram } from '../utils/webgl.js';

// ===== Algorithm presets =====

const PRESETS = {
  // Life-like: { type, birth bitmask, survive bitmask }
  conway:        { type: 'lifelike', birth: 0b000001000, survive: 0b000001100 },   // B3/S23
  highlife:      { type: 'lifelike', birth: 0b001001000, survive: 0b000001100 },   // B36/S23
  seeds:         { type: 'lifelike', birth: 0b000000100, survive: 0b000000000 },   // B2/S
  daynight:      { type: 'lifelike', birth: 0b111001000, survive: 0b111011000 },   // B3678/S34678
  diamoeba:      { type: 'lifelike', birth: 0b111101000, survive: 0b111100000 },   // B35678/S5678
  replicator:    { type: 'lifelike', birth: 0b010101010, survive: 0b010101010 },   // B1357/S1357
  lifenodeath:   { type: 'lifelike', birth: 0b000001000, survive: 0b111111111 },   // B3/S012345678

  // Brian's Brain
  brain: { type: 'brain' },

  // MNCA
  'mnca-worms': {
    type: 'mnca',
    rings: [
      { inner: 0, outer: 3, center: 0.48, width: 0.15 },
      { inner: 7, outer: 14, center: 0.15, width: 0.14 },
    ],
    dt: 0.15,
  },
  'mnca-mitosis': {
    type: 'mnca',
    rings: [
      { inner: 0, outer: 3, center: 0.50, width: 0.18 },
      { inner: 5, outer: 9, center: 0.30, width: 0.14 },
      { inner: 10, outer: 15, center: 0.18, width: 0.12 },
    ],
    dt: 0.12,
  },
  'mnca-gems': {
    type: 'mnca',
    rings: [
      { inner: 0, outer: 3, center: 0.45, width: 0.14 },
      { inner: 5, outer: 10, center: 0.22, width: 0.12 },
    ],
    dt: 0.12,
  },
};

// ===== Palettes: [dark, mid, bright] triplets =====

const PALETTES = {
  warm:      [[0.02, 0.01, 0.0],  [0.7, 0.15, 0.02], [1.0, 0.8, 0.2]],
  cool:      [[0.0, 0.01, 0.05],  [0.05, 0.2, 0.6],  [0.3, 0.7, 1.0]],
  fluo:      [[0.01, 0.02, 0.01], [0.8, 0.0, 0.6],   [0.0, 1.0, 0.3]],
  cyberpunk: [[0.02, 0.0, 0.04],  [0.5, 0.0, 0.8],   [0.9, 0.1, 1.0]],
  aurora:    [[0.0, 0.02, 0.01],  [0.0, 0.7, 0.4],   [0.4, 0.1, 0.8]],
  fire:      [[0.05, 0.0, 0.0],   [0.8, 0.2, 0.0],   [1.0, 0.9, 0.3]],
  sunset:    [[0.04, 0.0, 0.04],  [0.8, 0.25, 0.1],  [0.4, 0.05, 0.6]],
  toxic:     [[0.01, 0.04, 0.0],  [0.1, 0.8, 0.0],   [0.5, 1.0, 0.2]],
  ice:       [[0.0, 0.02, 0.05],  [0.15, 0.4, 0.7],  [0.6, 0.9, 1.0]],
  midnight:  [[0.0, 0.0, 0.02],   [0.02, 0.05, 0.5],  [0.15, 0.1, 0.7]],
};

// ===== Shaders =====

const quadVS = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const HASH_GLSL = `
float hash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}`;

const simLifeLikeFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform ivec2 u_gridSize;
uniform int u_birthMask;
uniform int u_surviveMask;
uniform bool u_wrap;
uniform float u_spawnRate;
uniform float u_seed;
out vec4 fragColor;
${HASH_GLSL}
void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  float state = texelFetch(u_state, coord, 0).r;
  bool alive = state > 0.5;
  int neighbors = 0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) continue;
      ivec2 nc = coord + ivec2(dx, dy);
      if (u_wrap) {
        nc = ivec2(mod(vec2(nc), vec2(u_gridSize)));
      } else if (nc.x < 0 || nc.x >= u_gridSize.x || nc.y < 0 || nc.y >= u_gridSize.y) {
        continue;
      }
      if (texelFetch(u_state, nc, 0).r > 0.5) neighbors++;
    }
  }
  float newState;
  if (alive) {
    newState = ((u_surviveMask >> neighbors) & 1) == 1 ? 1.0 : 0.0;
  } else {
    newState = ((u_birthMask >> neighbors) & 1) == 1 ? 1.0 : 0.0;
  }
  if (!u_wrap && newState < 0.5) {
    float r = hash(vec2(coord) + vec2(u_seed, u_seed * 1.37));
    if (r < u_spawnRate) newState = 1.0;
  }
  fragColor = vec4(newState, 0.0, 0.0, 1.0);
}`;

const simBrainFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform ivec2 u_gridSize;
uniform bool u_wrap;
uniform float u_spawnRate;
uniform float u_seed;
out vec4 fragColor;
${HASH_GLSL}
void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  float state = texelFetch(u_state, coord, 0).r;
  bool alive = state > 0.75;
  bool dying = state > 0.25 && state <= 0.75;
  float newState = 0.0;
  if (alive) {
    newState = 0.5;
  } else if (dying) {
    newState = 0.0;
  } else {
    int neighbors = 0;
    for (int dy = -1; dy <= 1; dy++) {
      for (int dx = -1; dx <= 1; dx++) {
        if (dx == 0 && dy == 0) continue;
        ivec2 nc = coord + ivec2(dx, dy);
        if (u_wrap) {
          nc = ivec2(mod(vec2(nc), vec2(u_gridSize)));
        } else if (nc.x < 0 || nc.x >= u_gridSize.x || nc.y < 0 || nc.y >= u_gridSize.y) {
          continue;
        }
        if (texelFetch(u_state, nc, 0).r > 0.75) neighbors++;
      }
    }
    if (neighbors == 2) newState = 1.0;
  }
  if (!u_wrap && newState < 0.01) {
    float r = hash(vec2(coord) + vec2(u_seed, u_seed * 1.37));
    if (r < u_spawnRate) newState = 1.0;
  }
  fragColor = vec4(newState, 0.0, 0.0, 1.0);
}`;

const simMncaFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform ivec2 u_gridSize;
uniform bool u_wrap;
uniform float u_spawnRate;
uniform float u_seed;
#define MAX_RINGS 4
#define MAX_RADIUS 15
uniform int u_ringCount;
uniform int u_ringInner[MAX_RINGS];
uniform int u_ringOuter[MAX_RINGS];
uniform float u_ringCenter[MAX_RINGS];
uniform float u_ringWidth[MAX_RINGS];
uniform float u_dt;
out vec4 fragColor;
${HASH_GLSL}

float sampleState(ivec2 coord) {
  if (u_wrap) {
    coord = ivec2(mod(vec2(coord), vec2(u_gridSize)));
  } else {
    coord = clamp(coord, ivec2(0), u_gridSize - 1);
  }
  return texelFetch(u_state, coord, 0).r;
}

void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  float state = texelFetch(u_state, coord, 0).r;
  float growth = 0.0;
  for (int r = 0; r < MAX_RINGS; r++) {
    if (r >= u_ringCount) break;
    int iR = u_ringInner[r];
    int oR = u_ringOuter[r];
    int iR2 = iR * iR;
    int oR2 = oR * oR;
    float sum = 0.0;
    int count = 0;
    for (int dy = -MAX_RADIUS; dy <= MAX_RADIUS; dy++) {
      for (int dx = -MAX_RADIUS; dx <= MAX_RADIUS; dx++) {
        int d2 = dx * dx + dy * dy;
        if (d2 < iR2 || d2 > oR2) continue;
        sum += sampleState(coord + ivec2(dx, dy));
        count++;
      }
    }
    float avg = count > 0 ? sum / float(count) : 0.0;
    float c = u_ringCenter[r];
    float w = u_ringWidth[r];
    float g = 2.0 * exp(-(avg - c) * (avg - c) / (2.0 * w * w)) - 1.0;
    growth += g;
  }
  float newState = clamp(state + growth * u_dt, 0.0, 1.0);
  if (!u_wrap && newState < 0.01) {
    float r = hash(vec2(coord) + vec2(u_seed, u_seed * 1.37));
    if (r < u_spawnRate) newState = clamp(newState + 0.5, 0.0, 1.0);
  }
  fragColor = vec4(newState, 0.0, 0.0, 1.0);
}`;

const blurFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform ivec2 u_gridSize;
uniform vec2 u_dir;
out vec4 fragColor;
void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  float sum = 0.0;
  for (int i = -2; i <= 2; i++) {
    ivec2 nc = coord + ivec2(u_dir * float(i));
    nc = clamp(nc, ivec2(0), u_gridSize - 1);
    sum += texelFetch(u_state, nc, 0).r;
  }
  fragColor = vec4(sum / 5.0, 0.0, 0.0, 1.0);
}`;

const renderFS = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_state;
uniform vec3 u_palDark;
uniform vec3 u_palMid;
uniform vec3 u_palBright;
out vec4 fragColor;
void main() {
  float state = texture(u_state, v_uv).r;
  vec3 color;
  if (state < 0.5) {
    color = mix(u_palDark, u_palMid, state * 2.0);
  } else {
    color = mix(u_palMid, u_palBright, (state - 0.5) * 2.0);
  }
  fragColor = vec4(color, 1.0);
}`;


// ===== Source class =====

export class GameOfLifeSource extends AbstractSource {

  constructor(options = {}) {
    const defaults = {
      algorithm: 'conway',
      boundaryMode: 'continuous',
      gridResolution: 256,
      speed: 0.35,
      spawnRate: 0.002,
      initialDensity: 0.3,
      palette: 'fire',
    };
    super(
      { ...defaults, ...options },
      ['algorithm', 'boundaryMode', 'gridResolution', 'speed', 'spawnRate', 'initialDensity', 'palette'],
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
    this._currentAlgoType = null;

    this._simLifeLike = null;
    this._simBrain = null;
    this._simMnca = null;
    this._blurProg = null;
    this._renderProg = null;
    this._quadBuffer = null;
    this._simLocs = {};
    this._renderLocs = {};
  }

  // ----- GPU lifecycle -----

  setupGPU(runtime) {
    const gl = runtime.gl;
    this.gl = gl;

    // Fullscreen quad
    const quadData = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this._quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

    // Compile all simulation programs upfront
    this._simLifeLike = this._buildProgram(simLifeLikeFS);
    this._simBrain = this._buildProgram(simBrainFS);
    this._simMnca = this._buildProgram(simMncaFS);
    this._blurProg = this._buildProgram(blurFS);
    this._renderProg = this._buildProgram(renderFS);

    // Store screen size for aspect-aware grid
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
    if (this._texA) { gl.deleteTexture(this._texA.tex); gl.deleteFramebuffer(this._texA.fbo); }
    if (this._texB) { gl.deleteTexture(this._texB.tex); gl.deleteFramebuffer(this._texB.fbo); }
    if (this._simLifeLike) gl.deleteProgram(this._simLifeLike.program);
    if (this._simBrain) gl.deleteProgram(this._simBrain.program);
    if (this._simMnca) gl.deleteProgram(this._simMnca.program);
    if (this._blurProg) gl.deleteProgram(this._blurProg.program);
    if (this._renderProg) gl.deleteProgram(this._renderProg.program);
    if (this._quadBuffer) gl.deleteBuffer(this._quadBuffer);
  }

  // ----- Simulation -----

  // Maps slider (0..1) to steps per second.
  // 0.0 → 0.5 steps/sec (1 step every 2s)
  // 0.35 → ~5 steps/sec (default)
  // 0.6 → ~60 steps/sec (1 step/frame)
  // 1.0 → 20 steps/frame × 60 fps = 1200 steps/sec
  _getStepsPerSecond() {
    const t = +(this.options.speed ?? 0.35);
    if (t <= 0.6) {
      // 0..0.6 → 0.5..60 steps/sec (exponential)
      return 0.5 * Math.pow(120, t / 0.6);
    }
    // 0.6..1.0 → 60..1200 steps/sec (multi-step per frame)
    return 60 * Math.pow(20, (t - 0.6) / 0.4);
  }

  update({ deltaTime } = {}) {
    const gl = this.gl;
    if (!gl || !this._texA) return;

    const dt = deltaTime ?? 0;
    const stepsPerSec = this._getStepsPerSecond();
    const stepInterval = 1.0 / stepsPerSec;

    this._stepAccumulator += dt;

    // Cap to avoid spiral of death
    const maxSteps = 20;
    let steps = 0;
    while (this._stepAccumulator >= stepInterval && steps < maxSteps) {
      this._simStep();
      this._stepAccumulator -= stepInterval;
      steps++;
    }
    if (steps >= maxSteps) {
      this._stepAccumulator = 0;
    }
  }

  _simStep() {
    const gl = this.gl;
    const preset = PRESETS[this.options.algorithm] ?? PRESETS.conway;
    const type = preset.type;
    const isWrap = this.options.boundaryMode === 'toroidal';
    const spawnRate = isWrap ? 0.0 : +(this.options.spawnRate ?? 0.002);

    this._stepSeed += 1.0;

    const read = this._pingPong === 0 ? this._texA : this._texB;
    const write = this._pingPong === 0 ? this._texB : this._texA;
    this._pingPong = 1 - this._pingPong;

    let prog;
    if (type === 'brain') prog = this._simBrain;
    else if (type === 'mnca') prog = this._simMnca;
    else prog = this._simLifeLike;

    gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
    gl.viewport(0, 0, this._gridW, this._gridH);
    gl.useProgram(prog.program);

    // Bind quad
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.enableVertexAttribArray(prog.locs.a_pos);
    gl.vertexAttribPointer(prog.locs.a_pos, 2, gl.FLOAT, false, 0, 0);

    // Common uniforms
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.tex);
    gl.uniform1i(prog.locs.u_state, 0);
    gl.uniform2i(prog.locs.u_gridSize, this._gridW, this._gridH);
    gl.uniform1i(prog.locs.u_wrap, isWrap ? 1 : 0);
    gl.uniform1f(prog.locs.u_spawnRate, spawnRate);
    gl.uniform1f(prog.locs.u_seed, this._stepSeed);

    // Algorithm-specific uniforms
    if (type === 'lifelike') {
      gl.uniform1i(prog.locs.u_birthMask, preset.birth);
      gl.uniform1i(prog.locs.u_surviveMask, preset.survive);
    } else if (type === 'mnca') {
      const rings = preset.rings;
      const count = Math.min(rings.length, 4);
      gl.uniform1i(prog.locs.u_ringCount, count);
      const inner = new Int32Array(4);
      const outer = new Int32Array(4);
      const center = new Float32Array(4);
      const width = new Float32Array(4);
      for (let i = 0; i < count; i++) {
        inner[i] = rings[i].inner;
        outer[i] = rings[i].outer;
        center[i] = rings[i].center;
        width[i] = rings[i].width;
      }
      gl.uniform1iv(prog.locs.u_ringInner, inner);
      gl.uniform1iv(prog.locs.u_ringOuter, outer);
      gl.uniform1fv(prog.locs.u_ringCenter, center);
      gl.uniform1fv(prog.locs.u_ringWidth, width);
      gl.uniform1f(prog.locs.u_dt, preset.dt ?? 0.05);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // ----- Rendering -----

  renderSource() {}

  renderScenePass(context = {}) {
    const { gl, state } = context;
    if (!gl || !state || !this._renderProg) return;
    const time = context.time ?? 0;

    const stateTex = this._pingPong === 0 ? this._texA : this._texB;

    gl.bindFramebuffer(gl.FRAMEBUFFER, state.sceneTex.fbo);
    gl.viewport(0, 0, state.width, state.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const prog = this._renderProg;
    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.enableVertexAttribArray(prog.locs.a_pos);
    gl.vertexAttribPointer(prog.locs.a_pos, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, stateTex.tex);
    gl.uniform1i(prog.locs.u_state, 0);

    // Palette
    const pal = PALETTES[this.options.palette] ?? PALETTES.fire;
    gl.uniform3fv(prog.locs.u_palDark, pal[0]);
    gl.uniform3fv(prog.locs.u_palMid, pal[1]);
    gl.uniform3fv(prog.locs.u_palBright, pal[2]);

    const renderContext = { ...context, time, gl, dpr: state.dpr };
    for (const effect of context.effects ?? []) {
      effect.applyScenePass(renderContext);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // ----- Grid management -----

  _rebuildGrid() {
    const res = Math.max(32, Math.min(1024, Math.round(+(this.options.gridResolution ?? 256))));
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
    const w = this._gridW;
    const h = this._gridH;
    const preset = PRESETS[this.options.algorithm] ?? PRESETS.conway;
    const density = +(this.options.initialDensity ?? 0.3);
    const data = new Float32Array(w * h * 4);

    if (preset.type === 'mnca') {
      for (let i = 0; i < w * h; i++) {
        data[i * 4] = Math.random();
      }
    } else {
      for (let i = 0; i < w * h; i++) {
        data[i * 4] = Math.random() < density ? 1.0 : 0.0;
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, this._texA.tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, gl.FLOAT, data);
    this._pingPong = 0;
    this._stepSeed = Math.random() * 1000;

    if (preset.type === 'mnca') {
      this._blurGrid(preset);
    }
  }

  _blurGrid(preset) {
    const gl = this.gl;
    const prog = this._blurProg;
    if (!gl || !prog) return;

    // Number of blur passes scales with the outer radius of the first ring
    // to create structures at the right spatial scale
    const outerR = preset.rings[0]?.outer ?? 3;
    const passes = Math.max(2, outerR);

    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuffer);
    gl.enableVertexAttribArray(prog.locs.a_pos);
    gl.vertexAttribPointer(prog.locs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2i(prog.locs.u_gridSize, this._gridW, this._gridH);
    gl.uniform1i(prog.locs.u_state, 0);
    gl.activeTexture(gl.TEXTURE0);

    for (let i = 0; i < passes; i++) {
      // Horizontal pass: A → B
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._texB.fbo);
      gl.viewport(0, 0, this._gridW, this._gridH);
      gl.bindTexture(gl.TEXTURE_2D, this._texA.tex);
      gl.uniform2f(prog.locs.u_dir, 1.0, 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Vertical pass: B → A
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._texA.fbo);
      gl.viewport(0, 0, this._gridW, this._gridH);
      gl.bindTexture(gl.TEXTURE_2D, this._texB.tex);
      gl.uniform2f(prog.locs.u_dir, 0.0, 1.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  reseed() {
    this._initGrid();
  }

  onAlgorithmChange() {
    this._rebuildGrid();
  }

  onGridResolutionChange() {
    this._rebuildGrid();
  }

  // ----- Helpers -----

  _buildProgram(fragmentSource) {
    const gl = this.gl;
    const program = createProgram(gl, quadVS, fragmentSource);
    const locs = this._resolveAllLocs(gl, program);
    return { program, locs };
  }

  _createSimTexture(w, h) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
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
