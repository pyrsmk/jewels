export class ModuleHost {
  constructor() {
    this.items = [];
  }

  get sources() {
    return this.items.filter((i) => i.type === 'objet').map((i) => i.instance);
  }

  get effects() {
    return this.items.filter((i) => i.type === 'effect').map((i) => i.instance);
  }

  getAllModules() {
    return this.items.map((i) => i.instance);
  }

  getEffects() {
    return this.effects;
  }

  getSources() {
    return this.sources;
  }

  getSourceGroups() {
    const groups = [];
    let current = null;
    for (const item of this.items) {
      if (item.type === 'objet') {
        current = { source: item.instance, effects: [] };
        groups.push(current);
      } else if (item.type === 'effect' && current) {
        current.effects.push(item.instance);
      }
    }
    return groups;
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

  captureSettings() {
    return {
      v: 2,
      items: this.items.map((item) => ({
        type: item.type,
        className: item.instance.constructor.name,
        params: item.instance.getParameters(),
      })),
    };
  }

  applySettings(settings) {
    if (!settings || typeof settings !== 'object') return;
    if (settings.v === 2 && Array.isArray(settings.items)) {
      const counters = {};
      for (const saved of settings.items) {
        if (!saved?.className || !saved.params) continue;
        const cls = saved.className;
        const idx = counters[cls] ?? 0;
        counters[cls] = idx + 1;
        const match = this.items.filter((i) => i.instance.constructor.name === cls)[idx];
        if (match) match.instance.setParameters(saved.params);
      }
      return;
    }
    for (const module of this.getAllModules()) {
      const saved = settings[module.constructor.name];
      if (!saved || typeof saved !== 'object') continue;
      module.setParameters(saved);
    }
  }

  syncAllModuleValueDisplays() {
    for (const module of this.getAllModules()) {
      module.syncOptionsFromUI?.();
      module.syncValueDisplays?.();
    }
  }

  updateSources(contextFactory) {
    for (const source of this.sources) {
      source.update(contextFactory({}));
    }
  }

  resizeAllModules(contextFactory) {
    for (const module of this.getAllModules()) {
      module.resize(contextFactory({}));
    }
  }

  addObjet(instance, position = this.items.length) {
    this.items.splice(position, 0, { type: 'objet', instance });
  }

  removeObjet(instance) {
    const idx = this.items.findIndex((i) => i.instance === instance);
    if (idx === -1) return;
    let end = idx + 1;
    while (end < this.items.length && this.items[end].type === 'effect') end++;
    this.items.splice(idx, end - idx);
  }

  addEffect(instance, position = this.items.length) {
    this.items.splice(position, 0, { type: 'effect', instance });
  }

  removeEffect(instance) {
    this.items = this.items.filter((i) => i.instance !== instance);
  }

  reorderItems(newItems) {
    this.items = newItems;
  }
}
