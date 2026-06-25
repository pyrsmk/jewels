import { AbstractSource } from '../core/AbstractSource.js';
import { createProgram } from '../utils/webgl.js';
import { mulberry32 } from '../utils/math.js';
import { quadVS } from '../shaders/common.js';

// ===== Evoloops transition rules =====
// Complete rule table from Sayama's Evoloops (1999).
// 9 states (0-8), Von Neumann neighborhood (C, T, R, B, L).
// State 8 is the "dissolving" state critical for structural dissolution.
// Rules stored as (C,T,R,B,L) -> newState, rotations added automatically.

const EVOLOOP_RULES = [
  [0,0,0,0,1,2],[1,0,2,0,2,1],[1,1,2,7,2,7],[2,0,1,7,2,2],[2,1,3,2,2,2],
  [4,0,1,2,5,0],[0,0,0,0,4,3],[1,0,2,1,1,1],[1,1,2,7,3,5],[2,0,2,0,2,2],
  [2,1,4,2,2,2],[4,0,1,6,2,0],[0,0,0,1,2,2],[1,0,2,1,2,1],[1,1,3,2,2,1],
  [2,0,2,0,3,2],[2,1,6,2,2,2],[4,0,2,1,2,0],[0,0,0,1,5,2],[1,0,2,1,3,1],
  [1,1,3,3,2,1],[2,0,2,0,5,2],[2,1,7,2,2,2],[4,0,2,1,5,0],[0,0,0,2,1,2],
  [1,0,2,2,1,1],[1,1,5,4,2,4],[2,0,2,0,6,5],[2,2,2,2,4,2],[4,0,2,2,2,1],
  [0,0,0,2,4,2],[1,0,2,2,4,4],[1,1,5,7,2,7],[2,0,2,0,7,3],[2,2,2,2,7,2],
  [4,0,2,3,2,1],[0,0,0,4,2,2],[1,0,2,2,7,7],[1,1,6,2,4,4],[2,0,2,1,2,2],
  [2,2,2,3,4,2],[4,0,2,6,2,6],[0,0,0,4,5,2],[1,0,2,3,2,4],[1,1,6,2,7,7],
  [2,0,2,1,5,2],[2,2,2,3,7,2],[4,0,3,1,2,0],[0,0,0,7,5,2],[1,0,2,4,1,4],
  [1,2,2,2,4,4],[2,0,2,2,1,2],[2,2,2,4,3,2],[4,0,3,2,2,1],[0,0,1,0,2,2],
  [1,0,2,4,2,4],[1,2,2,2,7,7],[2,0,2,2,2,2],[2,2,2,4,4,2],[5,0,0,0,2,5],
  [0,0,2,1,4,1],[1,0,2,4,3,4],[1,2,2,4,3,4],[2,0,2,2,3,2],[2,2,2,7,3,2],
  [5,0,0,1,2,5],[0,0,2,1,7,1],[1,0,2,5,1,1],[1,2,2,7,3,7],[2,0,2,3,2,3],
  [2,2,2,7,7,2],[5,0,0,2,1,5],[0,0,2,3,2,2],[1,0,2,5,2,7],[1,2,3,2,4,4],
  [2,0,2,4,2,2],[2,2,3,2,4,3],[5,0,0,2,3,2],[0,1,1,2,2,1],[1,0,2,5,4,3],
  [1,2,3,2,7,7],[2,0,2,4,5,2],[2,2,3,2,7,3],[5,0,0,2,4,5],[0,1,2,1,2,1],
  [1,0,2,5,7,7],[1,2,4,2,6,6],[2,0,2,5,2,5],[3,0,0,0,1,3],[5,0,0,2,7,5],
  [0,1,2,3,2,1],[1,0,2,7,1,7],[1,2,4,3,3,3],[2,0,2,6,2,0],[3,0,0,0,2,2],
  [5,0,0,4,2,5],[0,1,2,4,2,1],[1,0,2,7,2,7],[1,2,6,2,7,6],[2,0,2,6,5,0],
  [3,0,0,0,3,2],[5,0,0,7,2,5],[0,1,2,4,5,1],[1,0,2,7,3,5],[2,0,0,0,1,2],
  [2,0,2,7,2,2],[3,0,0,0,4,3],[5,0,2,0,2,2],[0,1,2,5,2,6],[1,0,5,1,2,1],
  [2,0,0,0,2,2],[2,0,2,7,5,2],[3,0,0,0,7,4],[5,0,2,0,5,2],[0,1,2,6,2,6],
  [1,0,5,4,2,4],[2,0,0,0,4,2],[2,0,3,1,2,2],[3,0,0,1,2,3],[5,0,2,1,2,5],
  [0,1,2,7,2,1],[1,0,5,7,2,7],[2,0,0,0,5,2],[2,0,3,2,2,2],[3,0,0,3,2,2],
  [5,0,2,1,5,2],[0,1,2,7,5,1],[1,0,6,2,1,1],[2,0,0,0,6,0],[2,0,3,4,2,2],
  [3,0,0,4,2,1],[5,0,2,4,2,5],[0,1,3,4,2,1],[1,0,6,2,4,4],[2,0,0,0,7,1],
  [2,0,3,4,5,2],[3,0,1,0,2,1],[5,0,2,7,2,5],[0,1,3,7,2,1],[1,0,6,2,7,7],
  [2,0,0,1,2,2],[2,0,3,7,2,2],[3,0,1,2,5,0],[5,0,3,1,2,0],[0,1,4,2,2,1],
  [1,1,1,1,2,1],[2,0,0,1,5,2],[2,0,4,1,2,2],[3,0,2,1,2,3],[6,0,2,0,2,2],
  [0,1,4,2,5,1],[1,1,1,2,2,1],[2,0,0,2,1,2],[2,0,4,2,2,2],[3,0,2,4,2,3],
  [6,0,2,1,2,2],[0,1,4,3,2,1],[1,1,1,2,4,4],[2,0,0,2,2,2],[2,0,4,4,2,2],
  [3,0,2,5,2,1],[6,0,2,2,2,0],[0,1,4,3,5,1],[1,1,1,2,5,1],[2,0,0,2,3,2],
  [2,0,5,1,2,2],[3,0,2,7,2,3],[6,0,2,4,2,2],[0,1,4,4,2,1],[1,1,1,2,7,7],
  [2,0,0,2,4,2],[2,0,5,4,2,5],[3,0,3,3,2,1],[6,0,2,7,2,2],[0,1,4,6,2,1],
  [1,1,1,6,2,1],[2,0,0,2,6,0],[2,0,5,7,2,5],[3,1,2,1,2,3],[6,1,2,2,2,0],
  [0,1,7,2,2,1],[1,1,2,1,2,1],[2,0,0,2,7,2],[2,0,6,1,2,5],[3,1,2,4,2,3],
  [6,2,2,2,4,0],[0,1,7,2,5,1],[1,1,2,1,3,1],[2,0,0,3,2,4],[2,0,6,2,1,2],
  [3,1,2,5,2,1],[6,2,2,2,7,0],[0,1,7,5,6,1],[1,1,2,1,5,1],[2,0,0,4,2,3],
  [2,0,6,4,2,5],[3,1,2,7,2,3],[7,0,1,0,2,0],[0,1,7,6,2,1],[1,1,2,2,2,1],
  [2,0,0,4,5,2],[2,0,6,7,2,5],[3,2,4,2,4,3],[7,0,1,1,2,0],[0,1,7,7,2,1],
  [1,1,2,2,4,4],[2,0,0,5,4,5],[2,0,7,1,2,2],[3,2,4,2,5,1],[7,0,1,2,2,0],
  [1,0,0,0,1,1],[1,1,2,2,7,7],[2,0,0,5,7,5],[2,0,7,2,2,2],[3,2,4,2,7,3],
  [7,0,1,2,5,0],[1,0,0,1,2,1],[1,1,2,3,2,1],[2,0,0,6,2,0],[2,0,7,7,2,2],
  [3,2,5,2,7,1],[7,0,1,6,2,0],[1,0,0,2,1,1],[1,1,2,4,2,4],[2,0,0,7,2,2],
  [2,1,1,2,2,2],[3,2,7,2,7,3],[7,0,2,1,2,0],[1,0,0,2,4,4],[1,1,2,4,3,4],
  [2,0,0,7,5,2],[2,1,2,2,2,2],[4,0,0,0,0,1],[7,0,2,1,5,0],[1,0,0,2,7,7],
  [1,1,2,5,2,7],[2,0,1,0,2,2],[2,1,2,2,3,2],[4,0,0,0,2,1],[7,0,2,2,2,1],
  [1,0,1,2,1,1],[1,1,2,5,4,3],[2,0,1,1,2,2],[2,1,2,2,4,2],[4,0,1,0,2,0],
  [7,0,2,3,2,0],[1,0,1,2,4,4],[1,1,2,5,7,7],[2,0,1,2,2,2],[2,1,2,2,7,2],
  [4,0,1,1,2,0],[7,0,2,6,2,6],[1,0,1,2,7,7],[1,1,2,6,2,6],[2,0,1,4,2,2],
  [2,1,2,3,2,3],[4,0,1,2,2,0],[7,0,3,1,2,0],
];

// ===== Build full transition table =====
// Pre-compute all 9^5 = 59049 combinations, applying procedural fallback for undefined cases.

function buildTransitionTable() {
  const N = 9;
  const total = N * N * N * N * N; // 59049
  const table = new Uint8Array(total);

  // Initialize with 255 = "undefined"
  table.fill(255);

  // Apply explicit rules with all 4 rotations
  for (const [c, t, r, b, l, result] of EVOLOOP_RULES) {
    const rotations = [[t,r,b,l],[l,t,r,b],[b,l,t,r],[r,b,l,t]];
    for (const [rt, rr, rb, rl] of rotations) {
      const idx = c + rt * N + rr * N*N + rb * N*N*N + rl * N*N*N*N;
      table[idx] = result;
    }
  }

  // Apply procedural fallback for undefined cases
  for (let c = 0; c < N; c++) {
    for (let t = 0; t < N; t++) {
      for (let r = 0; r < N; r++) {
        for (let b = 0; b < N; b++) {
          for (let l = 0; l < N; l++) {
            const idx = c + t * N + r * N*N + b * N*N*N + l * N*N*N*N;
            if (table[idx] !== 255) continue;

            const trbl = [t, r, b, l];
            const has8 = trbl.includes(8);
            let result = null;

            // State 8 -> 0 unconditionally
            if (c === 8) { result = 0; }

            // If any neighbor is in state 8
            if (result === null && has8) {
              if (c === 0 || c === 1) {
                const hasHighState = trbl.some(s => s >= 2 && s <= 7);
                result = hasHighState ? 8 : c;
              }
              if (c === 2 || c === 3 || c === 5) { result = 0; }
              if (c === 4 || c === 6 || c === 7) { result = 1; }
            }

            // Final fallback: 0 stays 0, everything else dissolves to 8
            if (result === null) {
              result = (c === 0) ? 0 : 8;
            }

            table[idx] = result;
          }
        }
      }
    }
  }

  return table;
}

// ===== Evoloops initial loop pattern (species 13) =====
// From CellPyLib's Evoloop.init_species13_loop — the correct Evoloop self-replicating loop.
// 17 rows × 31 cols. Coordinates are (x offset from col-1, y offset from row).

const EVOLOOP_PATTERN = [
  // Row 0: top sheath
  [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  // Row 1: top gene arm (signals: 0,1,7 repeated + 0,1,4 twice)
  [2,0,1,7,0,1,7,0,1,7,0,1,4,0,1,4,2],
  // Row 2: corner + top inner sheath
  [2,7,2,2,2,2,2,2,2,2,2,2,2,2,2,0,2],
  // Rows 3-13: left wall with signal sequence (1,0,7 repeating) + right wall
  [2,1,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  [2,0,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  [2,7,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  [2,1,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  [2,0,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  [2,7,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  [2,1,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  [2,0,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  [2,7,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  [2,1,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  [2,0,2,0,0,0,0,0,0,0,0,0,0,0,2,1,2],
  // Row 14: bottom corner + extension sheath
  [2,7,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
  // Row 15: bottom gene arm (signals + core extension)
  [2,1,0,7,1,0,7,1,0,7,1,0,7,1,0,7,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  // Row 16: bottom sheath
  [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

// ===== State colors (9 states) =====

const STATE_COLORS = [
  [0.0,  0.0,  0.0 ],  // 0: empty (black)
  [0.0,  0.4,  1.0 ],  // 1: core (blue)
  [1.0,  0.2,  0.0 ],  // 2: sheath (red)
  [0.0,  0.9,  0.3 ],  // 3: signal (green)
  [1.0,  1.0,  0.0 ],  // 4: signal (yellow)
  [0.9,  0.0,  0.9 ],  // 5: signal (magenta)
  [0.0,  0.9,  0.9 ],  // 6: signal (cyan)
  [1.0,  1.0,  1.0 ],  // 7: signal (white)
  [0.4,  0.2,  0.1 ],  // 8: dissolving (brown)
];

// ===== Shaders =====

const simEvoloopsFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform sampler2D u_table;
uniform ivec2 u_gridSize;
out vec4 fragColor;
void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  int c = int(texelFetch(u_state, coord, 0).r * 8.0 + 0.5);
  int t = int(texelFetch(u_state, (coord + ivec2(0,1) + u_gridSize) % u_gridSize, 0).r * 8.0 + 0.5);
  int r = int(texelFetch(u_state, (coord + ivec2(1,0) + u_gridSize) % u_gridSize, 0).r * 8.0 + 0.5);
  int b = int(texelFetch(u_state, (coord + ivec2(0,-1) + u_gridSize) % u_gridSize, 0).r * 8.0 + 0.5);
  int w = int(texelFetch(u_state, (coord + ivec2(-1,0) + u_gridSize) % u_gridSize, 0).r * 8.0 + 0.5);
  // index = c + t*9 + r*81 + b*729 + w*6561
  int idx = c + t * 9 + r * 81 + b * 729 + w * 6561;
  int tx = idx % 256;
  int ty = idx / 256;
  float newState = texelFetch(u_table, ivec2(tx, ty), 0).r;
  fragColor = vec4(newState);
}`;

const renderEvoloopsFS = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_state;
uniform vec3 u_colors[9];
out vec4 fragColor;
void main() {
  float state = texture(u_state, v_uv).r;
  int s = clamp(int(state * 8.0 + 0.5), 0, 8);
  vec3 color = u_colors[s];
  fragColor = vec4(color, 1.0);
}`;

// ===== Source class =====

export class EvoloopsSource extends AbstractSource {

  constructor(options = {}) {
    const defaults = {
      gridResolution: 256,
      speed: 0.45,
      seed: null,
    };
    super(
      { ...defaults, ...options },
      ['gridResolution', 'speed'],
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
    this._tableTex = null;
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

    this._simProg = this._buildProgram(simEvoloopsFS);
    this._renderProg = this._buildProgram(renderEvoloopsFS);

    this._buildTransitionTexture();

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
    if (this._tableTex) gl.deleteTexture(this._tableTex);
    if (this._simProg) { gl.deleteVertexArray(this._simProg.vao); gl.deleteProgram(this._simProg.program); }
    if (this._renderProg) { gl.deleteVertexArray(this._renderProg.vao); gl.deleteProgram(this._renderProg.program); }
    if (this._quadBuffer) gl.deleteBuffer(this._quadBuffer);
  }

  // ----- Transition table -----

  _buildTransitionTexture() {
    const gl = this.gl;
    const table = buildTransitionTable();
    // 59049 entries → 256x231 texture (59136 with padding)
    const texW = 256;
    const texH = Math.ceil(table.length / texW); // 231
    const data = new Float32Array(texW * texH);
    for (let i = 0; i < table.length; i++) {
      data[i] = table[i] / 8.0;
    }

    this._tableTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._tableTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, texW, texH, 0, gl.RED, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
    gl.bindTexture(gl.TEXTURE_2D, this._tableTex);
    gl.uniform1i(prog.locs.u_table, 1);

    gl.uniform2i(prog.locs.u_gridSize, this._gridW, this._gridH);

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

    const colorData = new Float32Array(27);
    for (let i = 0; i < 9; i++) {
      colorData[i * 3] = STATE_COLORS[i][0];
      colorData[i * 3 + 1] = STATE_COLORS[i][1];
      colorData[i * 3 + 2] = STATE_COLORS[i][2];
    }
    gl.uniform3fv(prog.locs.u_colors, colorData);

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
    const res = Math.max(64, Math.min(512, Math.round(+(this.options.gridResolution ?? 200))));
    const aspect = this._screenW / Math.max(1, this._screenH);
    const gridH = res;
    const gridW = Math.max(64, Math.round(res * aspect));

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

    const pattern = EVOLOOP_PATTERN;
    const pH = pattern.length;
    const pW = Math.max(...pattern.map(r => r.length));
    const offsetRange = Math.min(w, h) / 8;
    const ox = Math.floor(w / 2 - pW / 2 + (rng() - 0.5) * offsetRange);
    const oy = Math.floor(h / 2 - pH / 2 + (rng() - 0.5) * offsetRange);

    for (let py = 0; py < pH; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        const gx = ox + px;
        const gy = oy + (pH - 1 - py);
        if (gx >= 0 && gx < w && gy >= 0 && gy < h) {
          data[gy * w + gx] = pattern[py][px] / 8.0;
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
