import { AbstractSource } from '../core/AbstractSource.js';
import { createProgram } from '../utils/webgl.js';

const vs = `
precision highp float;
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const fs = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_video;
uniform float u_videoAspect;
uniform float u_canvasAspect;
void main() {
  vec2 uv = v_uv;
  if (u_canvasAspect > u_videoAspect) {
    uv.y = 0.5 + (uv.y - 0.5) * (u_videoAspect / u_canvasAspect);
  } else {
    uv.x = 0.5 + (uv.x - 0.5) * (u_canvasAspect / u_videoAspect);
  }
  gl_FragColor = vec4(texture2D(u_video, uv).rgb, 1.0);
}
`;

export class VideoSource extends AbstractSource {

  constructor(options = {}) {
    super({ _warn: true }, [], []);
    this.videoEl = null;
    this.blobUrl = null;
    this.texture = null;
    this.gl = null;
    this.program = null;
    this.buffer = null;
    this.locs = null;
  }

  getParameters() {
    return {};
  }

  loadFile(file) {
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.blobUrl = URL.createObjectURL(file);
    this.videoEl.src = this.blobUrl;
    this.videoEl.load();
    this.videoEl.play().catch(() => {});
    this.options._warn = false;
  }

  setupGPU(runtime) {
    const gl = runtime.gl;
    this.gl = gl;

    this.videoEl = document.createElement('video');
    this.videoEl.muted = true;
    this.videoEl.loop = true;
    this.videoEl.playsInline = true;

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]));

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

    if (this.videoEl && this.videoEl.readyState >= 2) {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.videoEl);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.locs.a_pos);
    gl.vertexAttribPointer(this.locs.a_pos, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.locs.u_video, 0);

    const videoAspect = (this.videoEl?.videoWidth && this.videoEl?.videoHeight)
      ? this.videoEl.videoWidth / this.videoEl.videoHeight
      : 1.0;
    gl.uniform1f(this.locs.u_videoAspect, videoAspect);
    gl.uniform1f(this.locs.u_canvasAspect, state.width / state.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    super.dispose();
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }
}
