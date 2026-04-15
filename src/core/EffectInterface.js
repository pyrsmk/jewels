import { AbstractModule } from './AbstractModule.js';

export class EffectInterface extends AbstractModule {
  update(context) {}

  applyScenePass(context) {}

  onSettingsChanged(t) {}

  transform(context) {
    throw new Error(`${this.constructor.name}.transform(context) must be implemented`);
  }

  uniformEnabled({ gl, locs }, uniformKey, enabledControlId, valueControlId) {
    const val = this.getControl(enabledControlId).checked
      ? +this.getControl(valueControlId).value
      : 0.0;
    gl.uniform1f(locs[uniformKey], val);
  }

  getPostShaderUniforms() {
    return '';
  }

  getPostShaderGuards() {
    return '';
  }

  getPostShaderGuardSymbol() {
    return '';
  }

  getPostShaderHelpers() {
    return '';
  }

  getPostShaderPreCode() {
    return '';
  }

  getPostShaderPostCode() {
    return '';
  }
}