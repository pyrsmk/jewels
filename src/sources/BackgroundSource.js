import { AbstractSource } from '../core/AbstractSource.js';
import { createProgram } from '../utils/webgl.js';

export class BackgroundSource extends AbstractSource {

  constructor(options = {}) {
    const defaults = {
      bgColor: '#000000',
    };
    super({ ...defaults, ...options }, ['bgColor'], []);
    this.gl = null;
    this.program = null;
    this.buffer = null;
    this.locs = null;
  }

  setBgColor(val) {
    this.options.bgColor = val;
  }

  setupGPU(runtime) {
    const gl = runtime.gl;
    this.gl = gl;

    const vs = `#version 300 es
      precision highp float;
      in vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;
    const fs = `#version 300 es
      precision highp float;
      uniform vec3 u_bgColor;
      out vec4 fragColor;
      void main() { fragColor = vec4(u_bgColor, 1.0); }
    `;
    this.program = createProgram(gl, vs, fs);
    this.locs = this._resolveAllLocs(gl, this.program);

    const quadData = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);
  }

  resizeGPU() {}
  update() {}
  renderSource() {}

  renderScenePass(context = {}) {
    const { gl, state } = context;
    if (!gl || !state || !this.program) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, state.sceneTex.fbo);
    gl.viewport(0, 0, state.width, state.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const hex = this.options.bgColor ?? '#000000';
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.locs.a_pos);
    gl.vertexAttribPointer(this.locs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3f(this.locs.u_bgColor, r, g, b);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
