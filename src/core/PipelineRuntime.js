import { createProgram, createTexFbo, clearFbo } from '../utils/webgl.js';
import { sharedShaderLibrary } from './SharedShaderLibrary.js';

const quadVS = `#version 300 es
  precision highp float;
  in vec2 a_pos;
  out vec2 v_uv;
  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const blitFS = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  uniform sampler2D u_tex;
  out vec4 fragColor;
  void main() {
    fragColor = texture(u_tex, v_uv);
  }
`;


export class PipelineRuntime {
  constructor(canvas, gl, state, config, moduleHost) {
    this.canvas = canvas;
    this.gl = gl;
    this.state = state;
    this.config = config;
    this.moduleHost = moduleHost;
    this.postPingIndex = 0;

    const quadData = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

    this._passContext = { gl: null, state: null };
    this._frameHistoryRing = new Array(config.frameHistoryLimit);
    this._frameHistoryHead = 0;
    this._frameHistoryCount = 0;
    this.blitProgram = createProgram(gl, quadVS, blitFS);
    this.blitLocs = {
      a_pos: gl.getAttribLocation(this.blitProgram, 'a_pos'),
      u_tex: gl.getUniformLocation(this.blitProgram, 'u_tex'),
    };

  }

  buildPassContext(extra = {}) {
    this._passContext.gl = this.gl;
    this._passContext.state = this.state;
    for (const key in this._passContext) {
      if (key !== 'gl' && key !== 'state') delete this._passContext[key];
    }
    for (const key in extra) {
      this._passContext[key] = extra[key];
    }
    return this._passContext;
  }

  clearFrameHistory() {
    this._frameHistoryCount = 0;
  }

  resetPostChain() {
    this.postPingIndex = 0;
    if (this.state.sceneA?.fbo) clearFbo(this.gl, this.state.sceneA.fbo);
    if (this.state.sceneB?.fbo) clearFbo(this.gl, this.state.sceneB.fbo);
  }

  clearScene() {
    const { gl, state } = this;
    if (state.sceneTex?.fbo) clearFbo(gl, state.sceneTex.fbo);
    this.resetPostChain();
    this.clearFrameHistory();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, state.width, state.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  pushFrameHistory(texture) {
    const limit = this.config.frameHistoryLimit;
    const ring = this._frameHistoryRing;
    // Reuse or create slot
    const slot = ring[this._frameHistoryHead] || (ring[this._frameHistoryHead] = { texture: null, width: 0, height: 0 });
    slot.texture = texture;
    slot.width = Math.max(1, Math.floor(this.state.width * this.config.frameHistoryScale));
    slot.height = Math.max(1, Math.floor(this.state.height * this.config.frameHistoryScale));
    this._frameHistoryHead = (this._frameHistoryHead + 1) % limit;
    if (this._frameHistoryCount < limit) this._frameHistoryCount++;
  }

  getSceneTarget() {
    return this.state.sceneTex;
  }

  getAccumulator() {
    return this.state.accumulator;
  }

  getPreviousFrameTexture(fallbackTexture = null) {
    if (this._frameHistoryCount === 0) return fallbackTexture;
    // Most recent entry is one step behind head
    const limit = this.config.frameHistoryLimit;
    const idx = (this._frameHistoryHead - 1 + limit) % limit;
    return this._frameHistoryRing[idx]?.texture || fallbackTexture;
  }

  getNextPostTarget() {
    const out = this.postPingIndex === 0 ? this.state.sceneA : this.state.sceneB;
    this.postPingIndex = this.postPingIndex === 0 ? 1 : 0;
    return out;
  }

  getAltPostTarget() {
    return this.postPingIndex === 0 ? this.state.sceneA : this.state.sceneB;
  }

  blitTo(texture, fbo) {
    const { gl, blitLocs, quadBuffer, state } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, state.width, state.height);
    gl.useProgram(this.blitProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(blitLocs.a_pos);
    gl.vertexAttribPointer(blitLocs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(blitLocs.u_tex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  blitToScreen(texture) {
    this.blitTo(texture, null);
  }

  compositeOntoAccumulator(overlayTex, isFirst) {
    const { gl, state } = this;
    if (isFirst) {
      this.blitTo(overlayTex, state.accumulator.fbo);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, state.accumulator.fbo);
      gl.viewport(0, 0, state.width, state.height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(this.blitProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
      gl.enableVertexAttribArray(this.blitLocs.a_pos);
      gl.vertexAttribPointer(this.blitLocs.a_pos, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, overlayTex);
      gl.uniform1i(this.blitLocs.u_tex, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disable(gl.BLEND);
    }
  }

  resizeTargets(width, height, dpr) {
    const { gl, canvas, state } = this;
    state.width = width;
    state.height = height;
    state.dpr = dpr;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    state.sceneTex = createTexFbo(gl, width, height);
    state.sceneA = createTexFbo(gl, width, height);
    state.sceneB = createTexFbo(gl, width, height);
    state.accumulator = createTexFbo(gl, width, height);
    clearFbo(gl, state.sceneA.fbo);
    clearFbo(gl, state.sceneB.fbo);
    clearFbo(gl, state.sceneTex.fbo);
    clearFbo(gl, state.accumulator.fbo);
    this.clearFrameHistory();
    this.postPingIndex = 0;
  }

  buildEffectProgram(effect, effectStack) {
    const context = { effectStack };
    const sharedUniforms = sharedShaderLibrary.getSharedUniforms();
    const sharedHelpers = sharedShaderLibrary.getAllHelpers();
    const uniforms = effect.getPostShaderUniforms(context) || '';
    const helpers = effect.getPostShaderHelpers(context) || '';
    const guards = effect.getPostShaderGuards(context) || '';
    const pre = effect.getPostShaderPreCode(context) || '';
    const post = effect.getPostShaderPostCode(context) || '';
    const sym = effect.getPostShaderGuardSymbol(context);
    const earlyExit = sym
      ? `\n    if (!${sym}) { fragColor = vec4(combined, srcAlpha); return; }\n`
      : '';
    const fs = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  uniform sampler2D u_scene;
  uniform sampler2D u_prev;
  uniform vec2 u_resolution;
  uniform float u_time;
${sharedUniforms}
${uniforms}

  out vec4 fragColor;

${sharedHelpers}

${helpers}

  void main() {
    vec2 uv = v_uv;
    vec2 px = 1.0 / u_resolution;
    float srcAlpha = texture(u_scene, uv).a;
${guards}
    vec3 combined = sampleScene(uv);
${earlyExit}
    float grainResponseMask = 1.0;
${pre}
${post}
    fragColor = vec4(combined, srcAlpha);
  }
  `;
    return createProgram(this.gl, quadVS, fs);
  }

  buildEffectLocs(program) {
    const { gl } = this;
    const locs = {
      a_pos: gl.getAttribLocation(program, 'a_pos'),
      u_scene: gl.getUniformLocation(program, 'u_scene'),
      u_prev: gl.getUniformLocation(program, 'u_prev'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_time: gl.getUniformLocation(program, 'u_time'),
    };
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (!info) continue;
      const name = info.name.replace(/\[0\]$/, '');
      if (!(name in locs)) {
        locs[name] = gl.getUniformLocation(program, name);
      }
    }
    return locs;
  }

  bindEffectPass(program, locs, inputTex, outputFbo, prevTex, t) {
    const { gl, quadBuffer, state } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFbo);
    gl.viewport(0, 0, state.width, state.height);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(locs.a_pos);
    gl.vertexAttribPointer(locs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(locs.u_resolution, state.width, state.height);
    gl.uniform1f(locs.u_time, t);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTex);
    gl.uniform1i(locs.u_scene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, prevTex);
    gl.uniform1i(locs.u_prev, 1);
  }
}
