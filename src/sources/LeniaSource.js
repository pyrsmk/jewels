import { AbstractSource } from '../core/AbstractSource.js';
import { createProgram } from '../utils/webgl.js';
import { mulberry32 } from '../utils/math.js';

// ===== Lenia presets =====
// Each preset defines kernel and growth parameters that produce distinct behaviors.
// R = kernel radius, mu/sigma = growth function center/width, dt = time step

const PRESETS = {
  orbium:   { kernelRadius: 13, mu: 0.15,  sigma: 0.015, dt: 0.1,  initMode: 'creatures' },
  geminium: { kernelRadius: 10, mu: 0.14,  sigma: 0.014, dt: 0.1,  initMode: 'creatures' },
  smooth:   { kernelRadius: 7,  mu: 0.3,   sigma: 0.05,  dt: 0.05, initMode: 'blobs' },
  pulse:    { kernelRadius: 10, mu: 0.22,  sigma: 0.035, dt: 0.08, initMode: 'blobs' },
  worms:    { kernelRadius: 12, mu: 0.19,  sigma: 0.025, dt: 0.12, initMode: 'blobs' },
};

// Orbium unicaudatus — known stable glider from Bert Chan's Lenia (R=13, mu=0.15, sigma=0.015)
// Decoded from the original animals.json RLE data
const ORBIUM_PATTERN = [
  [0,0,0,0,0,0,0,.051,.016,0,0,0,0,0,0,.235,0,0,0,0],
  [0,0,0,0,0,0,.137,.208,.212,.082,.071,.098,.102,.071,.004,.255,0,0,0,0],
  [0,0,0,0,0,.086,.267,.357,.384,.341,.188,.184,.173,.184,.176,.106,.349,0,0,0],
  [0,0,0,0,.012,.067,.349,.455,.467,.38,.129,.078,.055,.063,.122,.216,.706,0,0,0],
  [0,0,0,.035,.129,.184,.341,.404,.384,.282,.133,0,0,0,0,.047,.4,.329,0,0],
  [.004,0,.016,.137,.169,.133,.11,.247,.271,.263,.208,0,0,0,0,0,.02,.863,0,0],
  [.235,0,.102,.173,.078,0,0,.2,.31,.369,.373,.239,0,0,0,0,0,.455,.157,0],
  [0,.122,.184,.11,0,0,0,.271,.427,.506,.537,.51,0,0,0,0,0,0,.518,0],
  [0,.588,.216,.031,0,0,0,.188,.529,.635,.682,.682,.42,0,0,0,0,0,.427,0],
  [0,.553,.235,0,0,0,0,.027,.62,.757,.839,.855,.808,.106,0,0,0,0,.282,.098],
  [0,0,.596,0,0,0,0,0,.667,.875,.961,.992,.973,.561,0,0,0,0,.224,.141],
  [0,0,.839,0,0,0,0,0,.506,.969,1,1,1,.914,.278,0,0,.024,.22,.133],
  [0,0,.553,.075,0,0,0,0,.333,1,1,.98,1,.973,.557,.157,.051,.118,.243,.086],
  [0,0,.031,.447,0,0,0,0,.176,.851,1,.894,.863,.867,.651,.333,.196,.216,.231,.039],
  [0,0,0,.424,.114,0,0,0,.114,.62,.878,.824,.78,.741,.612,.408,.294,.267,.165,0],
  [0,0,0,.078,.333,.075,0,0,.118,.424,.675,.722,.678,.627,.525,.404,.31,.224,.063,0],
  [0,0,0,0,.165,.259,.149,.118,.173,.337,.498,.557,.545,.498,.427,.337,.243,.118,0,0],
  [0,0,0,0,0,.145,.231,.235,.259,.318,.388,.424,.412,.361,.306,.227,.125,.02,0,0],
  [0,0,0,0,0,0,.071,.169,.227,.251,.275,.278,.259,.231,.165,.094,.02,0,0,0],
  [0,0,0,0,0,0,0,0,.059,.102,.129,.133,.118,.078,.043,0,0,0,0,0],
];

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

const simFS = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform sampler2D u_kernel;
uniform ivec2 u_gridSize;
uniform int u_kernelRadius;
uniform float u_mu;
uniform float u_sigma;
uniform float u_dt;
out vec4 fragColor;

float growth(float u) {
  float d = (u - u_mu) / u_sigma;
  return 2.0 * exp(-0.5 * d * d) - 1.0;
}

void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  float state = texelFetch(u_state, coord, 0).r;

  float U = 0.0;
  int R = u_kernelRadius;

  for (int dy = -R; dy <= R; dy++) {
    for (int dx = -R; dx <= R; dx++) {
      float w = texelFetch(u_kernel, ivec2(dx + R, dy + R), 0).r;
      if (w <= 0.0) continue;
      ivec2 nc = (coord + ivec2(dx, dy) + u_gridSize) % u_gridSize;
      U += w * texelFetch(u_state, nc, 0).r;
    }
  }

  float newState = clamp(state + u_dt * growth(U), 0.0, 1.0);

  fragColor = vec4(newState);
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


// ===== Helpers =====

export function leniaStepsPerSecond(t) {
  if (t <= 0.6) return 0.5 * Math.pow(120, t / 0.6);
  return 60 * Math.pow(20, (t - 0.6) / 0.4);
}

// ===== Source class =====

export class LeniaSource extends AbstractSource {

  constructor(options = {}) {
    const defaults = {
      preset: 'orbium',
      initMode: 'creatures',
      gridResolution: 256,
      speed: 0.485,
      kernelRadius: 13,
      mu: 0.15,
      sigma: 0.015,
      dt: 0.1,
      palette: 'cool',
      seed: null,
    };
    super(
      { ...defaults, ...options },
      ['preset', 'initMode', 'gridResolution', 'speed', 'kernelRadius', 'mu', 'sigma', 'dt', 'palette'],
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
    this._kernelTex = null;
    this._kernelRadius = -1;
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

    this._simProg = this._buildProgram(simFS);
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

  _getStepsPerSecond() {
    return leniaStepsPerSecond(+(this.options.speed ?? 0.35));
  }

  update({ deltaTime } = {}) {
    const gl = this.gl;
    if (!gl || !this._texA) return;

    const dt = deltaTime ?? 0;
    const stepsPerSec = this._getStepsPerSecond();
    const stepInterval = 1.0 / stepsPerSec;

    this._stepAccumulator += dt;

    const maxSteps = 10;
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

    const R = Math.round(+(this.options.kernelRadius ?? 13));
    if (R !== this._kernelRadius) this._buildKernelTexture(R);

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
    gl.uniform1i(prog.locs.u_kernelRadius, R);
    gl.uniform1f(prog.locs.u_mu, +(this.options.mu ?? 0.15));
    gl.uniform1f(prog.locs.u_sigma, +(this.options.sigma ?? 0.015));
    gl.uniform1f(prog.locs.u_dt, +(this.options.dt ?? 0.1));

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  _buildKernelTexture(R) {
    const gl = this.gl;
    const size = 2 * R + 1;
    const data = new Float32Array(size * size);

    let sum = 0;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        if (dx === 0 && dy === 0) continue;
        const dist = Math.sqrt(dx * dx + dy * dy) / R;
        if (dist > 1.0) continue;
        const x = 4.0 * dist * (1.0 - dist);
        const w = Math.exp(4.0 - 4.0 / x);
        data[(dy + R) * size + (dx + R)] = w;
        sum += w;
      }
    }

    if (sum > 0) {
      for (let i = 0; i < data.length; i++) data[i] /= sum;
    }

    if (this._kernelTex) gl.deleteTexture(this._kernelTex);

    this._kernelTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._kernelTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, size, size, 0, gl.RED, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this._kernelRadius = R;
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

    const pal = PALETTES[this.options.palette] ?? PALETTES.cool;
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
    const data = new Float32Array(w * h);

    switch (this.options.initMode) {
      case 'creatures': this._initCreatures(data, w, h, rng); break;
      case 'perlin':    this._initPerlinNoise(data, w, h, rng); break;
      case 'rings':     this._initRings(data, w, h, rng); break;
      case 'uniform':   this._initUniformNoise(data, w, h, rng); break;
      default:          this._initBlobs(data, w, h, rng); break;
    }

    gl.bindTexture(gl.TEXTURE_2D, this._texA.tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RED, gl.FLOAT, data);
    this._pingPong = 0;
  }

  _initPerlinNoise(data, w, h, rng) {
    // Simple value noise with bicubic interpolation (lightweight Perlin-like)
    const scale = 6 + rng() * 4; // 6-10 octaves across the grid
    const cellsX = Math.ceil(scale * (w / h)) + 2;
    const cellsY = Math.ceil(scale) + 2;

    // Random lattice values
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
        data[y * w + x] = v * v; // squaring concentrates values toward 0, creating organic islands
      }
    }
  }

  _initRings(data, w, h, rng) {
    const centerCount = 1 + Math.floor(rng() * 3);
    const maxDim = Math.max(w, h);

    for (let c = 0; c < centerCount; c++) {
      const cx = w * 0.2 + rng() * w * 0.6;
      const cy = h * 0.2 + rng() * h * 0.6;
      const ringCount = 3 + Math.floor(rng() * 4); // 3-6 rings
      const spacing = (maxDim * 0.4) / ringCount;
      const thickness = spacing * (0.25 + rng() * 0.2);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          for (let r = 1; r <= ringCount; r++) {
            const ringDist = Math.abs(dist - r * spacing);
            if (ringDist < thickness) {
              const amp = 0.5 + 0.5 * Math.cos((ringDist / thickness) * Math.PI);
              const idx = y * w + x;
              data[idx] = Math.min(1.0, data[idx] + amp * (0.6 + rng() * 0.2));
            }
          }
        }
      }
    }
  }

  _initUniformNoise(data, w, h, rng) {
    const density = 0.3 + rng() * 0.3; // 30-60% amplitude ceiling
    for (let i = 0; i < w * h; i++) {
      data[i] = rng() * density;
    }
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
          const d2 = dx * dx + dy * dy;
          const v = amp * Math.exp(-d2 / (2.0 * rSq));
          const idx = y * w + x;
          data[idx] = Math.min(1.0, data[idx] + v);
        }
      }
    }
  }

  _initCreatures(data, w, h, rng) {
    const pattern = ORBIUM_PATTERN;
    const pH = pattern.length;
    const pW = pattern[0].length;
    const count = 2 + Math.floor(rng() * 3);
    const margin = Math.max(pW, pH) + 4;

    for (let b = 0; b < count; b++) {
      const ox = margin + Math.floor(rng() * Math.max(1, w - margin * 2));
      const oy = margin + Math.floor(rng() * Math.max(1, h - margin * 2));
      // Random rotation (0, 90, 180, 270) + optional horizontal flip for variety
      const rot = Math.floor(rng() * 4);
      const flip = rng() < 0.5;

      for (let py = 0; py < pH; py++) {
        for (let px = 0; px < pW; px++) {
          const v = pattern[py][px];
          if (v === 0) continue;
          let tx = px, ty = py;
          if (flip) tx = pW - 1 - tx;
          // Rotate around pattern center
          for (let r = 0; r < rot; r++) {
            const tmp = tx;
            tx = pH - 1 - ty;
            ty = tmp;
          }
          const gx = ox + tx;
          const gy = oy + ty;
          if (gx < 0 || gx >= w || gy < 0 || gy >= h) continue;
          const idx = gy * w + gx;
          data[idx] = Math.min(1.0, data[idx] + v);
        }
      }
    }
  }

  reseed() {
    this.options.seed = null;
    this._initGrid();
  }

  applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    this.setParameters({
      preset: name,
      initMode: preset.initMode,
      kernelRadius: preset.kernelRadius,
      mu: preset.mu,
      sigma: preset.sigma,
      dt: preset.dt,
    });
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

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.warn(`[LeniaSource] FBO incomplete (status 0x${status.toString(16)}). Float rendering may not be supported.`);
    }

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
