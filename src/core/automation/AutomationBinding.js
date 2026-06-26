import { mapValue } from './ValueMapper.js';

export class AutomationBinding {
  constructor({ source, targetClassName, targetInstanceIndex, targetOptionKey, paramType, mappingConfig, enabled = true }) {
    this.source = source;
    this.targetClassName = targetClassName;
    this.targetInstanceIndex = targetInstanceIndex;
    this.targetOptionKey = targetOptionKey;
    this.paramType = paramType;
    this.mappingConfig = mappingConfig;
    this.enabled = enabled;
    this._initialValue = undefined;
    this._captured = false;
  }

  captureInitialValue(moduleInstance) {
    if (!moduleInstance) return;
    this._initialValue = moduleInstance.options[this.targetOptionKey];
    this._captured = true;
  }

  restoreInitialValue(moduleInstance) {
    if (!this._captured || !moduleInstance) return;
    moduleInstance.options[this.targetOptionKey] = this._initialValue;
    this._captured = false;
  }

  apply(time, dt, moduleInstance) {
    if (!this.enabled || !moduleInstance) return;
    const normalized = this.source.evaluate(time, dt);
    moduleInstance.options[this.targetOptionKey] = mapValue(normalized, this.paramType, this.mappingConfig, this._initialValue);
  }

  changeSource(newSource) {
    this.source.dispose();
    this.source = newSource;
    this.source.setup();
  }

  serialize() {
    return {
      source: this.source.serialize(),
      target: {
        className: this.targetClassName,
        instanceIndex: this.targetInstanceIndex,
        optionKey: this.targetOptionKey,
      },
      paramType: this.paramType,
      mappingConfig: { ...this.mappingConfig },
      enabled: this.enabled,
    };
  }
}
