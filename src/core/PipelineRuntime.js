import { createProgram, createTexFbo, clearFbo } from '../utils/webgl.js';
import { sharedShaderLibrary } from './SharedShaderLibrary.js';
import { EffectStack } from './EffectStack.js';

const quadVS = `
  precision highp float;
  attribute vec2 a_pos;
  varying vec2 v_uv;
  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const blitFS = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_tex;
  void main() {
    gl_FragColor = texture2D(u_tex, v_uv);
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

    this.blitProgram = createProgram(gl, quadVS, blitFS);
    this.blitLocs = {
      a_pos: gl.getAttribLocation(this.blitProgram, 'a_pos'),
      u_tex: gl.getUniformLocation(this.blitProgram, 'u_tex'),
    };

    this.postProgram = createProgram(gl, quadVS, this._buildPostFS());
    this.postLocs = this._buildPostLocs(this.postProgram);
  }

  buildPassContext(extra = {}) {
    return { gl: this.gl, state: this.state, ...extra };
  }

  clearFrameHistory() {
    this.state.frameHistory.length = 0;
  }

  resetPostChain() {
    this.postPingIndex = 0;
    if (this.state.sceneA?.fbo) clearFbo(this.gl, this.state.sceneA.fbo);
    if (this.state.sceneB?.fbo) clearFbo(this.gl, this.state.sceneB.fbo);
  }

  pushFrameHistory(texture) {
    this.state.frameHistory.unshift({
      texture,
      width: Math.max(1, Math.floor(this.state.width * this.config.frameHistoryScale)),
      height: Math.max(1, Math.floor(this.state.height * this.config.frameHistoryScale)),
    });
    if (this.state.frameHistory.length > this.config.frameHistoryLimit) {
      this.state.frameHistory.length = this.config.frameHistoryLimit;
    }
  }

  getSceneTarget() {
    return this.state.sceneTex;
  }

  getPreviousFrameTexture(fallbackTexture = null) {
    return this.state.frameHistory[0]?.texture || fallbackTexture;
  }

  getNextPostTarget() {
    const out = this.postPingIndex === 0 ? this.state.sceneA : this.state.sceneB;
    this.postPingIndex = this.postPingIndex === 0 ? 1 : 0;
    return out;
  }

  getAltPostTarget() {
    return this.postPingIndex === 0 ? this.state.sceneA : this.state.sceneB;
  }

  bindPostBuffer(out, time) {
    const { gl, postLocs, quadBuffer, state } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, out.fbo);
    gl.viewport(0, 0, state.width, state.height);
    gl.useProgram(this.postProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(postLocs.a_pos);
    gl.vertexAttribPointer(postLocs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(postLocs.u_resolution, state.width, state.height);
    gl.uniform1f(postLocs.u_time, time);
  }

  bindPostInputs(sceneTexture, previousTexture) {
    const { gl, postLocs } = this;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
    gl.uniform1i(postLocs.u_scene, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, previousTexture);
    gl.uniform1i(postLocs.u_prev, 1);
  }

  blitToScreen(texture) {
    const { gl, blitLocs, quadBuffer, state } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, state.width, state.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.blitProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(blitLocs.a_pos);
    gl.vertexAttribPointer(blitLocs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(blitLocs.u_tex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
    clearFbo(gl, state.sceneA.fbo);
    clearFbo(gl, state.sceneB.fbo);
    clearFbo(gl, state.sceneTex.fbo);
    this.clearFrameHistory();
    this.postPingIndex = 0;
  }

  rebuildPostProgram() {
    this.postProgram = createProgram(this.gl, quadVS, this._buildPostFS());
    Object.assign(this.postLocs, this._buildPostLocs(this.postProgram));
  }

  buildPostChainRebuildKey(effects) {
    return effects.map((effect) => {
      const effectStack = new EffectStack(effects, effect);
      const rebuildKey = typeof effect.getRebuildKey === 'function'
        ? effect.getRebuildKey({ effectStack })
        : '';
      return `${effect.constructor.name}:${rebuildKey}`;
    }).join('|');
  }

  _collectPostShaderChunks() {
    const effects = this.moduleHost.getEffects();
    let uniforms = '', helpers = '', guards = '', pre = '', post = '';
    const guardSymbols = [];
    for (const effect of effects) {
      const effectStack = new EffectStack(effects, effect);
      const context = { effectStack };
      uniforms += effect.getPostShaderUniforms(context) || '';
      helpers += effect.getPostShaderHelpers(context) || '';
      guards += effect.getPostShaderGuards(context) || '';
      pre += effect.getPostShaderPreCode(context) || '';
      post += effect.getPostShaderPostCode(context) || '';
      const sym = effect.getPostShaderGuardSymbol(context);
      if (sym) guardSymbols.push(sym);
    }
    return { uniforms, helpers, guards, pre, post, guardSymbols };
  }

  _buildPostFS() {
    const chunks = this._collectPostShaderChunks();
    const sharedHelpers = sharedShaderLibrary.getAllHelpers();
    const earlyExit = chunks.guardSymbols.length > 0
      ? `\n    if (${chunks.guardSymbols.map((s) => `!${s}`).join(' && ')}) {\n`
        + `      gl_FragColor = vec4(combined, 1.0);\n      return;\n    }\n`
      : '';
    const sharedUniforms = sharedShaderLibrary.getSharedUniforms();
    return `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_scene;
  uniform sampler2D u_prev;
  uniform vec2 u_resolution;
  uniform float u_time;
${sharedUniforms}
${chunks.uniforms}

${sharedHelpers}

${chunks.helpers}

  void main() {
    vec2 uv = v_uv;
    vec2 px = 1.0 / u_resolution;
${chunks.guards}
    vec3 combined = sampleScene(uv);
${earlyExit}
    float grainResponseMask = 1.0;
${chunks.pre}

    combined = smoothstep(vec3(0.0), vec3(1.4), combined);

${chunks.post}
    gl_FragColor = vec4(combined, 1.0);
  }
  `;
  }

  _buildPostLocs(prog) {
    const gl = this.gl;
    return {
      a_pos: gl.getAttribLocation(prog, 'a_pos'),
      u_scene: gl.getUniformLocation(prog, 'u_scene'),
      u_prev: gl.getUniformLocation(prog, 'u_prev'),
      u_resolution: gl.getUniformLocation(prog, 'u_resolution'),
      u_time: gl.getUniformLocation(prog, 'u_time'),
      u_glow: gl.getUniformLocation(prog, 'u_glow'),
      u_glowMode: gl.getUniformLocation(prog, 'u_glowMode'),
      u_dreamyGlow: gl.getUniformLocation(prog, 'u_dreamyGlow'),
      u_dreamyEdgeBoost: gl.getUniformLocation(prog, 'u_dreamyEdgeBoost'),
      u_filmGrain: gl.getUniformLocation(prog, 'u_filmGrain'),
      u_grainMode: gl.getUniformLocation(prog, 'u_grainMode'),
      u_grainAmount: gl.getUniformLocation(prog, 'u_grainAmount'),
      u_glowGrainResponse: gl.getUniformLocation(prog, 'u_glowGrainResponse'),
      u_dreamyGrainResponse: gl.getUniformLocation(prog, 'u_dreamyGrainResponse'),
      u_lensFlareGrainResponse: gl.getUniformLocation(prog, 'u_lensFlareGrainResponse'),
      u_chromatic: gl.getUniformLocation(prog, 'u_chromatic'),
      u_chromaticMode: gl.getUniformLocation(prog, 'u_chromaticMode'),
      u_chromaticWidth: gl.getUniformLocation(prog, 'u_chromaticWidth'),
      u_chromaticOffset: gl.getUniformLocation(prog, 'u_chromaticOffset'),
      u_lensMode: gl.getUniformLocation(prog, 'u_lensMode'),
      u_lensAnamorphic: gl.getUniformLocation(prog, 'u_lensAnamorphic'),
      u_lensThickness: gl.getUniformLocation(prog, 'u_lensThickness'),
      u_lensLength: gl.getUniformLocation(prog, 'u_lensLength'),
      u_lensDiffusion: gl.getUniformLocation(prog, 'u_lensDiffusion'),
      u_ghostEnabled: gl.getUniformLocation(prog, 'u_ghostEnabled'),
      u_ghostIntensity: gl.getUniformLocation(prog, 'u_ghostIntensity'),
      u_ghostCount: gl.getUniformLocation(prog, 'u_ghostCount'),
      u_ghostSpacing: gl.getUniformLocation(prog, 'u_ghostSpacing'),
      u_ghostSize: gl.getUniformLocation(prog, 'u_ghostSize'),
      u_ghostDiffusion: gl.getUniformLocation(prog, 'u_ghostDiffusion'),
      u_ghostDecay: gl.getUniformLocation(prog, 'u_ghostDecay'),
      u_flarePos: gl.getUniformLocation(prog, 'u_flarePos'),
      u_flareStrength: gl.getUniformLocation(prog, 'u_flareStrength'),
      u_accents: gl.getUniformLocation(prog, 'u_accents'),
      u_accentCount: gl.getUniformLocation(prog, 'u_accentCount'),
      u_colorEnabled: gl.getUniformLocation(prog, 'u_colorEnabled'),
      u_chromaticNoise: gl.getUniformLocation(prog, 'u_chromaticNoise'),
      u_chromaticNoiseSpeed: gl.getUniformLocation(prog, 'u_chromaticNoiseSpeed'),
      u_chromaticNoiseScale: gl.getUniformLocation(prog, 'u_chromaticNoiseScale'),
      u_colorShimmer: gl.getUniformLocation(prog, 'u_colorShimmer'),
      u_colorShimmerPalette: gl.getUniformLocation(prog, 'u_colorShimmerPalette'),
      u_colorShimmerSpeed: gl.getUniformLocation(prog, 'u_colorShimmerSpeed'),
      u_colorShimmerScale: gl.getUniformLocation(prog, 'u_colorShimmerScale'),
      u_rgbSplit: gl.getUniformLocation(prog, 'u_rgbSplit'),
      u_rgbSplitSpeed: gl.getUniformLocation(prog, 'u_rgbSplitSpeed'),
      u_rgbSplitScale: gl.getUniformLocation(prog, 'u_rgbSplitScale'),
      u_pixelSort: gl.getUniformLocation(prog, 'u_pixelSort'),
      u_pixelSortSpeed: gl.getUniformLocation(prog, 'u_pixelSortSpeed'),
      u_pixelSortScale: gl.getUniformLocation(prog, 'u_pixelSortScale'),
      u_pixelSortThreshold: gl.getUniformLocation(prog, 'u_pixelSortThreshold'),
      u_temporalGhost: gl.getUniformLocation(prog, 'u_temporalGhost'),
      u_temporalGhostOpacity: gl.getUniformLocation(prog, 'u_temporalGhostOpacity'),
      u_temporalGhostRgbShift: gl.getUniformLocation(prog, 'u_temporalGhostRgbShift'),
      u_temporalGhostSpeed: gl.getUniformLocation(prog, 'u_temporalGhostSpeed'),
      u_temporalGhostScale: gl.getUniformLocation(prog, 'u_temporalGhostScale'),
      u_tg2: gl.getUniformLocation(prog, 'u_tg2'),
      u_tg2Opacity: gl.getUniformLocation(prog, 'u_tg2Opacity'),
      u_tg2RgbShift: gl.getUniformLocation(prog, 'u_tg2RgbShift'),
      u_tg2Speed: gl.getUniformLocation(prog, 'u_tg2Speed'),
      u_tg2Scale: gl.getUniformLocation(prog, 'u_tg2Scale'),
      u_blockGlitch: gl.getUniformLocation(prog, 'u_blockGlitch'),
      u_blockGlitchSpeed: gl.getUniformLocation(prog, 'u_blockGlitchSpeed'),
      u_blockGlitchScale: gl.getUniformLocation(prog, 'u_blockGlitchScale'),
      u_bg2: gl.getUniformLocation(prog, 'u_bg2'),
      u_bg2Speed: gl.getUniformLocation(prog, 'u_bg2Speed'),
      u_bg2Scale: gl.getUniformLocation(prog, 'u_bg2Scale'),
      u_bg3: gl.getUniformLocation(prog, 'u_bg3'),
      u_bg3Speed: gl.getUniformLocation(prog, 'u_bg3Speed'),
      u_bg3Scale: gl.getUniformLocation(prog, 'u_bg3Scale'),
      u_crt: gl.getUniformLocation(prog, 'u_crt'),
      u_crtScanlines: gl.getUniformLocation(prog, 'u_crtScanlines'),
      u_crtScanlinesSize: gl.getUniformLocation(prog, 'u_crtScanlinesSize'),
      u_crtFlicker: gl.getUniformLocation(prog, 'u_crtFlicker'),
      u_crtVignette: gl.getUniformLocation(prog, 'u_crtVignette'),
      u_crtPhosphore: gl.getUniformLocation(prog, 'u_crtPhosphore'),
    };
  }
}