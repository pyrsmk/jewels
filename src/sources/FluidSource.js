import { AbstractSource } from '../core/AbstractSource.js';
import { createProgram } from '../utils/webgl.js';

const vs = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const fs = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform vec2  u_resolution;
uniform float u_accTime;
uniform float u_fluidCount;
uniform vec3  u_fluidColors[8];
uniform float u_fluidSeeds[8];

out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),             hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.8, 1.2, -1.2, 1.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p  = m * p + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = vec2(v_uv.x * aspect, v_uv.y);
  float at = mod(u_accTime, 10000.0);
  int count = int(u_fluidCount + 0.5);

  float maxScore = -1e6, secScore = -1e6;
  vec3 nearColor = u_fluidColors[0];

  for (int i = 0; i < 8; i++) {
    if (i >= count) continue;

    float seed = u_fluidSeeds[i];

    // Unique noise region per fluid
    vec2 p = uv + vec2(seed * 3.7, seed * 2.3);

    // Two-pass warp — creates the swirling organic shapes.
    // Uses u_accTime (accumulated speed-weighted time) so speed slider
    // only changes animation rate, never teleports the visual.
    vec2 q = vec2(
      fbm(p * 0.45 + at * 0.018),
      fbm(p * 0.45 + vec2(5.2, 1.3) + at * 0.018)
    ) * 2.8;
    vec2 p1 = p + q;

    vec2 r = vec2(
      fbm(p1 * 0.90 + vec2(1.7, 9.2) + at * 0.025),
      fbm(p1 * 0.90 + vec2(8.3, 2.8) + at * 0.025)
    ) * 1.2;
    vec2 wuv = p1 + r;

    float sc = fbm(wuv * 0.50);


    if (sc > maxScore) {
      secScore  = maxScore;
      maxScore  = sc;
      nearColor = u_fluidColors[i];
    } else if (sc > secScore) {
      secScore = sc;
    }
  }

  float bd = clamp((maxScore - secScore) / 0.10, 0.0, 1.0);
  float bright = pow(bd, 0.6);

  vec3 color = nearColor * bright;
  color = mix(color, vec3(1.0), pow(bd, 5.0) * 0.35);

  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

export class FluidSource extends AbstractSource {

  constructor(options = {}) {
    const colors = options.colors ?? ['#06091a', '#0d3b6e', '#a8d8ea'];
    const n = colors.length;
    const directions = options.directions ?? Array.from({ length: n }, (_, i) => Math.round((i * 360) / n));
    const seeds = options.seeds ?? colors.map(() => Math.random() * 100);
    super({ speed: 0.4, ...options, colors, directions, seeds }, [], []);
    this._accTime  = 0;
    this._lastTime = null;
    this.gl      = null;
    this.program = null;
    this.buffer  = null;
    this.locs    = null;
  }

  _evenDirections(n) {
    return Array.from({ length: n }, (_, i) => Math.round((i * 360) / n));
  }

  setFluids(colors) {
    const n = colors.length;
    this.options.colors = [...colors];
    if (this.options.directions.length !== n) {
      this.options.directions = this._evenDirections(n);
    }
    while (this.options.seeds.length < n) this.options.seeds.push(Math.random() * 100);
    this.options.seeds.length = n;
  }

  setParameters(params) {
    super.setParameters(params);
    while (this.options.seeds.length < this.options.colors.length) {
      this.options.seeds.push(Math.random() * 100);
    }
  }

  setupGPU(runtime) {
    const gl = runtime.gl;
    this.gl = gl;
    this.program = createProgram(gl, vs, fs);
    this.locs    = this._resolveAllLocs(gl, this.program);
    const quadData = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);
  }

  resizeGPU() {}
  update() {}
  renderSource() {}

  renderScenePass(context = {}) {
    const { gl, state, time } = context;
    if (!gl || !state || !this.program) return;

    // Accumulate speed-weighted time so that changing speed only changes the
    // animation rate — it never jumps the visual to a different frame.
    const rawTime = time ?? 0;
    const dt = this._lastTime !== null ? rawTime - this._lastTime : 0;
    this._lastTime = rawTime;
    if (dt > 0 && dt < 0.5) {
      this._accTime += dt * +(this.options.speed ?? 0.25);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, state.sceneTex.fbo);
    gl.viewport(0, 0, state.width, state.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.locs.a_pos);
    gl.vertexAttribPointer(this.locs.a_pos, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(this.locs.u_resolution, state.width, state.height);
    gl.uniform1f(this.locs.u_accTime,    this._accTime);

    const count      = Math.min(this.options.colors.length, 8);
    const colorsFlat = new Float32Array(24);
    const seedsArr   = new Float32Array(8);

    for (let i = 0; i < count; i++) {
      const hex = this.options.colors[i] ?? '#ffffff';
      colorsFlat[i * 3 + 0] = parseInt(hex.slice(1, 3), 16) / 255;
      colorsFlat[i * 3 + 1] = parseInt(hex.slice(3, 5), 16) / 255;
      colorsFlat[i * 3 + 2] = parseInt(hex.slice(5, 7), 16) / 255;
      seedsArr[i] = this.options.seeds[i] ?? i * 13.7;
    }

    gl.uniform1f(this.locs.u_fluidCount,   count);
    gl.uniform3fv(this.locs.u_fluidColors, colorsFlat);
    gl.uniform1fv(this.locs.u_fluidSeeds,  seedsArr);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
