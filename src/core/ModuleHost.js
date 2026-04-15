import { EffectStack } from './EffectStack.js';

export class ModuleHost {
  constructor({ subjects = [], effects = [] } = {}) {
    this.subjects = subjects;
    this.effects = effects;
  }

  getAllModules() {
    return [...this.subjects, ...this.effects];
  }

  getEffects() {
    return [...this.effects];
  }

  getSubjects() {
    return [...this.subjects];
  }

  findEffectByClassName(className) {
    return this.effects.find((effect) => effect.constructor.name === className) || null;
  }

  findControl(id) {
    for (const module of this.getAllModules()) {
      const el = module.getControl?.(id);
      if (el) return el;
    }
    return null;
  }

  findValueNode(id) {
    for (const module of this.getAllModules()) {
      const el = module.getValueNode?.(id);
      if (el) return el;
    }
    return null;
  }

  buildAllUI(groupFinder) {
    const mappings = [
      ...this.subjects.map((s) => [s, s.constructor.uiTitle || s.constructor.name]),
      ...this.effects.map((e) => [e, e.constructor.uiTitle || e.constructor.name]),
    ];

    for (const [module, title] of mappings) {
      if (!module) continue;
      const node = groupFinder(title);
      if (!node) continue;
      module.buildUI(node);
    }
  }

  syncAllModuleValueDisplays() {
    for (const module of this.getAllModules()) {
      module.syncOptionsFromUI?.();
      module.syncValueDisplays?.();
    }
  }

  captureSettings() {
    const settings = {};
    for (const module of this.getAllModules()) {
      settings[module.constructor.name] = module.getParameters();
    }
    return settings;
  }

  applySettings(settings) {
    if (!settings || typeof settings !== 'object') return;
    for (const module of this.getAllModules()) {
      const saved = settings[module.constructor.name];
      if (!saved || typeof saved !== 'object') continue;
      module.setParameters(saved);
    }
  }

  bindPersistenceListeners(handler) {
    for (const module of this.getAllModules()) {
      for (const id of module.controlIds || []) {
        const el = module.getControl(id);
        if (!el) continue;
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
      }
    }
  }

  updateSubjects(contextFactory) {
    for (const subject of this.subjects) {
      subject.update?.(contextFactory({}));
    }
  }

  renderSubjects(contextFactory) {
    for (const subject of this.subjects) {
      subject.renderScenePass(contextFactory({}));
    }
  }

  transformEffects(contextFactory) {
    const effects = this.effects;
    for (const effect of effects) {
      effect.transform(contextFactory({
        effectStack: new EffectStack(effects, effect),
      }));
    }
  }

  setupAllModules(contextFactory) {
    for (const module of this.getAllModules()) {
      module.setup(contextFactory({}));
    }
  }

  resizeAllModules(contextFactory) {
    for (const module of this.getAllModules()) {
      module.resize(contextFactory({}));
    }
  }
}