export class ModuleHost {
  constructor() {
    this.items = [];
    this._cachedSourceGroups = null;
    this._cachedEffects = null;
    this._cachedSources = null;
    this._dirty = true;
  }

  _invalidate() {
    this._dirty = true;
    this._cachedSourceGroups = null;
    this._cachedEffects = null;
    this._cachedSources = null;
  }

  get sources() {
    if (!this._cachedSources || this._dirty) {
      this._cachedSources = this.items.filter((i) => i.type === 'source').map((i) => i.instance);
    }
    return this._cachedSources;
  }

  get effects() {
    if (!this._cachedEffects || this._dirty) {
      this._cachedEffects = this.items.filter((i) => i.type === 'effect').map((i) => i.instance);
    }
    return this._cachedEffects;
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
    if (this._cachedSourceGroups && !this._dirty) return this._cachedSourceGroups;
    const groups = [];
    let current = null;
    for (const item of this.items) {
      if (item.type === 'source') {
        current = { source: item.instance, effects: [] };
        groups.push(current);
      } else if (item.type === 'effect' && current && item.enabled !== false) {
        current.effects.push(item.instance);
      }
    }
    this._cachedSourceGroups = groups;
    this._dirty = false;
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
        className: item.className,
        params: item.instance.getParameters(),
      })),
    };
  }

  applySettings(settings) {
    if (!settings || typeof settings !== 'object' || !Array.isArray(settings.items)) return;
    const counters = {};
    for (const saved of settings.items) {
      if (!saved?.className || !saved.params) continue;
      const cls = saved.className;
      const idx = counters[cls] ?? 0;
      counters[cls] = idx + 1;
      const match = this.items.filter((i) => i.className === cls)[idx];
      if (match) match.instance.setParameters(saved.params);
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

  addSource(instance, position = this.items.length, className) {
    this.items.splice(position, 0, { type: 'source', instance, className: className ?? instance.constructor.name });
    this._invalidate();
  }

  removeSource(instance) {
    const idx = this.items.findIndex((i) => i.instance === instance);
    if (idx === -1) return;
    let end = idx + 1;
    while (end < this.items.length && this.items[end].type === 'effect') end++;
    this.items.splice(idx, end - idx);
    this._invalidate();
  }

  addEffect(instance, position = this.items.length, className) {
    this.items.splice(position, 0, { type: 'effect', instance, enabled: true, className: className ?? instance.constructor.name });
    this._invalidate();
  }

  removeEffect(instance) {
    this.items = this.items.filter((i) => i.instance !== instance);
    this._invalidate();
  }

  reorderItems(newItems) {
    this.items = newItems;
    this._invalidate();
  }
}
