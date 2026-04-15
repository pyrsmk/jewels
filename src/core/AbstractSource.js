import { AbstractModule } from './AbstractModule.js';

export class AbstractSource extends AbstractModule {
  update(context) {
    throw new Error(`${this.constructor.name}.update(context) must be implemented`);
  }

  renderSource(context) {
    throw new Error(`${this.constructor.name}.renderSource(context) must be implemented`);
  }

  getDrawCount() {
    return 0;
  }

  renderScenePass(context = {}) {
    const { gl, state } = context;
    const time = context.time ?? 0;

    gl.bindFramebuffer(gl.FRAMEBUFFER, state.sceneTex.fbo);
    gl.viewport(0, 0, state.width, state.height);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    this.bindVertexAttributes();

    const renderContext = {
      ...context,
      time,
      gl,
      locs: this.locs,
    };
    this.renderSource(renderContext);

    for (const effect of context.effects ?? []) {
      effect.applyScenePass(renderContext);
    }

    gl.drawArrays(gl.POINTS, 0, this.getDrawCount());
    gl.disable(gl.BLEND);
  }

  bindVertexAttributes() {}

  _resolveAllLocs(gl, prog) {
    const locs = {};
    const uCount = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uCount; i++) {
      const info = gl.getActiveUniform(prog, i);
      if (!info) continue;
      const name = info.name.endsWith('[0]') ? info.name.slice(0, -3) : info.name;
      locs[name] = gl.getUniformLocation(prog, name);
    }
    const aCount = gl.getProgramParameter(prog, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < aCount; i++) {
      const info = gl.getActiveAttrib(prog, i);
      if (!info) continue;
      locs[info.name] = gl.getAttribLocation(prog, info.name);
    }
    return locs;
  }
}