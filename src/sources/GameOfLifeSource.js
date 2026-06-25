import { AbstractSource } from '../core/AbstractSource.js';
import { createProgram } from '../utils/webgl.js';
import { mulberry32 } from '../utils/math.js';
import { PALETTES } from '../core/palettes.js';
import { quadVS, HASH_GLSL, paletteRenderFS } from '../shaders/common.js';

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

  // Star Wars (4-state)
  starwars: { type: 'starwars' },

  // Larger-than-Life: { type, radius, birthMin, birthMax, surviveMin, surviveMax, initDensity }
  ltl_bugs:     { type: 'ltl', radius: 5,  middle: 1, birthMin: 34, birthMax: 45,  surviveMin: 34, surviveMax: 58,  initDensity: 0.5 },
  ltl_majority: { type: 'ltl', radius: 4,  middle: 1, birthMin: 41, birthMax: 81,  surviveMin: 41, surviveMax: 81,  initDensity: 0.5 },
  ltl_globe:    { type: 'ltl', radius: 8,  middle: 0, birthMin: 74, birthMax: 252, surviveMin: 163, surviveMax: 223, initDensity: 0.5 },
  ltl_waffle:   { type: 'ltl', radius: 7,  middle: 1, birthMin: 75, birthMax: 170, surviveMin: 100, surviveMax: 200, initDensity: 0.5 },
  ltl_bugsmovie:{ type: 'ltl', radius: 10, middle: 1, birthMin: 123,birthMax: 170, surviveMin: 123, surviveMax: 212, initDensity: 0.29 },
};

// ===== Shaders =====

const simLifeLikeFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform ivec2 u_gridSize;
uniform int u_birthMask;
uniform int u_surviveMask;
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
      ivec2 nc = (coord + ivec2(dx, dy) + u_gridSize) % u_gridSize;
      if (texelFetch(u_state, nc, 0).r > 0.5) neighbors++;
    }
  }
  float newState;
  if (alive) {
    newState = ((u_surviveMask >> neighbors) & 1) == 1 ? 1.0 : 0.0;
  } else {
    newState = ((u_birthMask >> neighbors) & 1) == 1 ? 1.0 : 0.0;
  }
  if (newState < 0.5) {
    float r = hash(vec2(coord) + vec2(u_seed, u_seed * 1.37));
    if (r < u_spawnRate) newState = 1.0;
  }
  fragColor = vec4(newState);
}`;

const simBrainFS = `#version 300 es
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
        ivec2 nc = (coord + ivec2(dx, dy) + u_gridSize) % u_gridSize;
        if (texelFetch(u_state, nc, 0).r > 0.75) neighbors++;
      }
    }
    if (neighbors == 2) newState = 1.0;
  }
  if (newState < 0.01) {
    float r = hash(vec2(coord) + vec2(u_seed, u_seed * 1.37));
    if (r < u_spawnRate) newState = 1.0;
  }
  fragColor = vec4(newState);
}`;

const simStarWarsFS = `#version 300 es
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
  // 4 states: dead=0.0, dying2=0.25, dying1=0.5, alive=1.0
  float newState = 0.0;
  if (state > 0.75) {
    // alive -> dying1
    newState = 0.5;
  } else if (state > 0.375) {
    // dying1 -> dying2
    newState = 0.25;
  } else if (state > 0.125) {
    // dying2 -> dead
    newState = 0.0;
  } else {
    // dead: birth if exactly 2 alive neighbors
    int neighbors = 0;
    for (int dy = -1; dy <= 1; dy++) {
      for (int dx = -1; dx <= 1; dx++) {
        if (dx == 0 && dy == 0) continue;
        ivec2 nc = (coord + ivec2(dx, dy) + u_gridSize) % u_gridSize;
        if (texelFetch(u_state, nc, 0).r > 0.75) neighbors++;
      }
    }
    if (neighbors == 2) newState = 1.0;
  }
  if (newState < 0.01) {
    float r = hash(vec2(coord) + vec2(u_seed, u_seed * 1.37));
    if (r < u_spawnRate) newState = 1.0;
  }
  fragColor = vec4(newState);
}`;

const simLtlFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform ivec2 u_gridSize;
uniform int u_radius;
uniform int u_birthMin;
uniform int u_birthMax;
uniform int u_surviveMin;
uniform int u_surviveMax;
uniform int u_middle;
uniform float u_spawnRate;
uniform float u_seed;
out vec4 fragColor;
${HASH_GLSL}
void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  float state = texelFetch(u_state, coord, 0).r;
  bool alive = state > 0.5;
  int neighbors = 0;
  int R = u_radius;
  for (int dy = -R; dy <= R; dy++) {
    for (int dx = -R; dx <= R; dx++) {
      if (dx == 0 && dy == 0 && u_middle == 0) continue;
      ivec2 nc = (coord + ivec2(dx, dy) + u_gridSize) % u_gridSize;
      if (texelFetch(u_state, nc, 0).r > 0.5) neighbors++;
    }
  }
  float newState;
  if (alive) {
    newState = (neighbors >= u_surviveMin && neighbors <= u_surviveMax) ? 1.0 : 0.0;
  } else {
    newState = (neighbors >= u_birthMin && neighbors <= u_birthMax) ? 1.0 : 0.0;
  }
  if (newState < 0.5) {
    float r = hash(vec2(coord) + vec2(u_seed, u_seed * 1.37));
    if (r < u_spawnRate) newState = 1.0;
  }
  fragColor = vec4(newState);
}`;

const renderFS = paletteRenderFS;


// ===== Source class =====

export class GameOfLifeSource extends AbstractSource {

  constructor(options = {}) {
    const defaults = {
      algorithm: 'conway',
      gridResolution: 512,
      speed: 0.485,
      spawnRate: 10,
      initialDensity: 0.3,
      initMode: 'multi',
      palette: 'fire',
      seed: null,
    };
    super(
      { ...defaults, ...options },
      ['algorithm', 'gridResolution', 'speed', 'spawnRate', 'initialDensity', 'initMode', 'palette'],
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

    this._simLifeLike = null;
    this._simBrain = null;
    this._simStarWars = null;
    this._simLtl = null;
    this._renderProg = null;
    this._quadBuffer = null;
    this._renderContext = { time: 0, gl: null, dpr: 1, locs: null };
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

    // Compile simulation programs
    this._simLifeLike = this._buildProgram(simLifeLikeFS);
    this._simBrain = this._buildProgram(simBrainFS);
    this._simStarWars = this._buildProgram(simStarWarsFS);
    this._simLtl = this._buildProgram(simLtlFS);
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
    if (this._simLifeLike) { gl.deleteVertexArray(this._simLifeLike.vao); gl.deleteProgram(this._simLifeLike.program); }
    if (this._simBrain) { gl.deleteVertexArray(this._simBrain.vao); gl.deleteProgram(this._simBrain.program); }
    if (this._simStarWars) { gl.deleteVertexArray(this._simStarWars.vao); gl.deleteProgram(this._simStarWars.program); }
    if (this._simLtl) { gl.deleteVertexArray(this._simLtl.vao); gl.deleteProgram(this._simLtl.program); }
    if (this._renderProg) { gl.deleteVertexArray(this._renderProg.vao); gl.deleteProgram(this._renderProg.program); }
    if (this._quadBuffer) gl.deleteBuffer(this._quadBuffer);
  }

  // ----- Simulation -----

  _getStepsPerSecond() {
    const t = +(this.options.speed ?? 0.35);
    if (t <= 0.6) {
      return 0.5 * Math.pow(120, t / 0.6);
    }
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
    if (steps >= maxSteps) {
      this._stepAccumulator = 0;
    }
  }

  _simStep() {
    const gl = this.gl;
    const preset = PRESETS[this.options.algorithm] ?? PRESETS.conway;
    const type = preset.type;
    const spawnRate = +(this.options.spawnRate ?? 10) / 1000000;

    this._stepSeed += 1.0;

    const read = this._pingPong === 0 ? this._texA : this._texB;
    const write = this._pingPong === 0 ? this._texB : this._texA;
    this._pingPong = 1 - this._pingPong;

    const prog = type === 'ltl' ? this._simLtl
      : type === 'starwars' ? this._simStarWars
      : type === 'brain' ? this._simBrain
      : this._simLifeLike;

    gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
    gl.viewport(0, 0, this._gridW, this._gridH);
    gl.useProgram(prog.program);
    gl.bindVertexArray(prog.vao);

    // Uniforms
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.tex);
    gl.uniform1i(prog.locs.u_state, 0);
    gl.uniform2i(prog.locs.u_gridSize, this._gridW, this._gridH);
    gl.uniform1f(prog.locs.u_spawnRate, spawnRate);
    gl.uniform1f(prog.locs.u_seed, this._stepSeed);

    if (type === 'lifelike') {
      gl.uniform1i(prog.locs.u_birthMask, preset.birth);
      gl.uniform1i(prog.locs.u_surviveMask, preset.survive);
    } else if (type === 'ltl') {
      gl.uniform1i(prog.locs.u_radius, preset.radius);
      gl.uniform1i(prog.locs.u_middle, preset.middle);
      gl.uniform1i(prog.locs.u_birthMin, preset.birthMin);
      gl.uniform1i(prog.locs.u_birthMax, preset.birthMax);
      gl.uniform1i(prog.locs.u_surviveMin, preset.surviveMin);
      gl.uniform1i(prog.locs.u_surviveMax, preset.surviveMax);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
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
    gl.bindVertexArray(prog.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, stateTex.tex);
    gl.uniform1i(prog.locs.u_state, 0);

    // Palette
    const pal = PALETTES[this.options.palette] ?? PALETTES.fire;
    gl.uniform3fv(prog.locs.u_palDark, pal[0]);
    gl.uniform3fv(prog.locs.u_palMid, pal[1]);
    gl.uniform3fv(prog.locs.u_palBright, pal[2]);

    const rc = this._renderContext;
    rc.time = time;
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

    if (this.options.seed === null) {
      this.options.seed = Math.floor(Math.random() * 2147483647);
    }
    const rng = mulberry32(this.options.seed);

    const w = this._gridW;
    const h = this._gridH;
    const data = new Float32Array(w * h);

    if (this.options.initMode === 'single') {
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);
      const radius = 3;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < w && y >= 0 && y < h && rng() < 0.5) {
            data[y * w + x] = 1.0;
          }
        }
      }
    } else {
      const preset = PRESETS[this.options.algorithm];
      const density = +(preset?.initDensity ?? this.options.initialDensity ?? 0.3);
      for (let i = 0; i < w * h; i++) {
        data[i] = rng() < density ? 1.0 : 0.0;
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, this._texA.tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RED, gl.FLOAT, data);
    this._pingPong = 0;
    this._stepSeed = rng() * 1000;
  }

  reseed() {
    this.options.seed = null;
    this._initGrid();
  }

  setParameters(params) {
    const needsRebuild =
      params.gridResolution !== undefined && params.gridResolution !== this.options.gridResolution ||
      params.initialDensity !== undefined && params.initialDensity !== this.options.initialDensity ||
      params.initMode !== undefined && params.initMode !== this.options.initMode ||
      params.algorithm !== undefined && params.algorithm !== this.options.algorithm ||
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
