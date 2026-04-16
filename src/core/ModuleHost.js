export class ModuleHost {
  constructor({ sources = [], effects = [] } = {}) {
    this.sources = sources;
    this.effects = effects;
  }

  getAllModules() {
    return [...this.sources, ...this.effects];
  }

  getEffects() {
    return [...this.effects];
  }

  getSources() {
    return [...this.sources];
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
      ...this.sources.map((s) => [s,s.constructor.name]),
      ...this.effects.map((e) => [e,e.constructor.name]),
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

  updateSources(contextFactory) {
    for (const source of this.sources) {
      source.update?.(contextFactory({}));
    }
  }

  renderSources(contextFactory) {
    for (const source of this.sources) {
      source.renderScenePass(contextFactory({}));
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

  addSource(instance) {
    this.sources.push(instance);
  }

  removeSource(instance) {
    this.sources = this.sources.filter((s) => s !== instance);
  }

  addEffect(instance) {
    this.effects.push(instance);
  }

  removeEffect(instance) {
    this.effects = this.effects.filter((e) => e !== instance);
  }

  reorderEffects(newOrder) {
    this.effects = newOrder;
  }
}