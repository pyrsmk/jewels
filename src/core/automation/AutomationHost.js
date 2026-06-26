import { AutomationBinding } from './AutomationBinding.js';
import { LFOAutomationSource } from './LFOAutomationSource.js';
import { NoiseAutomationSource } from './NoiseAutomationSource.js';
import { MouseAutomationSource } from './MouseAutomationSource.js';
import { AudioAutomationSource } from './AudioAutomationSource.js';
import { AudioFileManager } from './AudioFileManager.js';

const SOURCE_CONSTRUCTORS = {
  lfo: LFOAutomationSource,
  noise: NoiseAutomationSource,
  mouse: MouseAutomationSource,
  audio: AudioAutomationSource,
};

export class AutomationHost {
  constructor(moduleHost) {
    this.moduleHost = moduleHost;
    this.bindings = [];
  }

  addBinding(binding) {
    this.bindings.push(binding);
    binding.source.setup();
  }

  removeBinding(binding) {
    const idx = this.bindings.indexOf(binding);
    if (idx === -1) return;
    const target = this._resolveTarget(binding);
    binding.restoreInitialValue(target);
    binding.source.dispose();
    this.bindings.splice(idx, 1);
  }

  removeBindingsForModule(className, instanceIndex) {
    const toRemove = this.bindings.filter(
      (b) => b.targetClassName === className && b.targetInstanceIndex === instanceIndex,
    );
    for (const b of toRemove) this.removeBinding(b);
  }

  cleanupOrphanedBindings() {
    const toRemove = [];
    for (const binding of this.bindings) {
      const target = this._resolveTarget(binding);
      if (!target) toRemove.push(binding);
    }
    for (const b of toRemove) this.removeBinding(b);
  }

  evaluate(time, dt) {
    const manager = AudioFileManager.getInstance();
    manager.advanceFrame();

    for (const binding of this.bindings) {
      const target = this._resolveTarget(binding);
      binding.apply(time, dt, target);
    }
  }

  _resolveTarget(binding) {
    let count = 0;
    for (const item of this.moduleHost.items) {
      if (item.className === binding.targetClassName) {
        if (count === binding.targetInstanceIndex) return item.instance;
        count++;
      }
    }
    return null;
  }

  captureSettings() {
    return this.bindings.map((b) => b.serialize());
  }

  applySettings(automationsData) {
    if (!Array.isArray(automationsData)) return;

    for (const b of [...this.bindings]) this.removeBinding(b);

    for (const data of automationsData) {
      const Ctor = SOURCE_CONSTRUCTORS[data.source?.type];
      if (!Ctor) continue;

      const source = new Ctor(data.source.params);
      const binding = new AutomationBinding({
        source,
        targetClassName: data.target.className,
        targetInstanceIndex: data.target.instanceIndex,
        targetOptionKey: data.target.optionKey,
        paramType: data.paramType,
        mappingConfig: data.mappingConfig,
        enabled: data.enabled ?? true,
      });
      this.addBinding(binding);
      const target = this._resolveTarget(binding);
      binding.captureInitialValue(target);
    }
  }

  dispose() {
    for (const b of [...this.bindings]) this.removeBinding(b);
  }
}
