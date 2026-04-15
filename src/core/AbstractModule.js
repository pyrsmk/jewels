export class AbstractModule {
  constructor(options = {}, controlIds = [], valueIds = []) {
    this.options = { ...options };
    this.controlIds = [...controlIds];
    this.valueIds = [...valueIds];
    this.root = null;
    this.controls = new Map();
    this.valueNodes = new Map();
    this.cleanupFns = [];
    this.gpu = {
      programs: new Map(),
      buffers: new Map(),
      textures: new Map(),
      framebuffers: new Map(),
    };
  }

  static deserialize(options = {}) {
    return new this(options);
  }

  serialize() {
    return {
      className: this.constructor.name,
      options: this.getParameters(),
    };
  }

  getParameters() {
    return { ...this.options };
  }

  setParameters(saved) {
    for (const id of this.controlIds) {
      const el = this.getControl(id);
      if (el) this._applyControlValue(el, saved[id]);
    }
    this.syncOptionsFromUI();
    this.syncValueDisplays();
  }

  _applyControlValue(el, value) {
    if (!el || value === undefined || value === null) return;
    if (el.type === 'checkbox') {
      if (typeof value === 'boolean') el.checked = value;
      else if (value === 'true' || value === 'false') el.checked = value === 'true';
      return;
    }
    if (el.tagName === 'SELECT') {
      const exists = [...el.options].some((opt) => opt.value === String(value));
      if (exists) el.value = String(value);
      return;
    }
    if (el.type === 'range') {
      const num = Number(value);
      const min = Number(el.min);
      const max = Number(el.max);
      if (!Number.isFinite(num)) return;
      if (Number.isFinite(min) && num < min) return;
      if (Number.isFinite(max) && num > max) return;
      el.value = String(num);
      return;
    }
    el.value = String(value);
  }

  setupGPU(runtime) {}

  resizeGPU(runtime) {}

  buildUI(node) {
    if (!node) {
      throw new Error(`${this.constructor.name}.buildUI(node): node is required`);
    }
    this.root = node;
    for (const id of this.controlIds) {
      const el = document.getElementById(id);
      if (el) this.controls.set(id, el);
    }
    for (const id of this.valueIds) {
      const el = document.getElementById(id);
      if (el) this.valueNodes.set(id, el);
    }
    this.onBuildUI(node);
    this.bindControlListeners();
    this.syncOptionsFromUI();
    this.syncValueDisplays();
  }

  onBuildUI(node) {}

  bindControlListeners() {
    for (const [id, el] of this.controls) {
      const handler = () => {
        this.options[id] = this.readControlValue(el);
        this.syncValueDisplays();
      };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
      this.cleanupFns.push(() => {
        el.removeEventListener('input', handler);
        el.removeEventListener('change', handler);
      });
    }
  }

  readControlValue(el) {
    if (!el) return undefined;
    if (el.type === 'checkbox') return !!el.checked;
    if (el.type === 'range') return Number(el.value);
    return el.value;
  }

  getControl(id) {
    return this.controls.get(id) || null;
  }

  getValueNode(id) {
    return this.valueNodes.get(id) || null;
  }

  _setValueText(id, val) {
    const node = this.getValueNode(id);
    if (node) node.textContent = val;
  }

  syncOptionsFromUI() {
    for (const [id, el] of this.controls) {
      this.options[id] = this.readControlValue(el);
    }
  }

  syncValueDisplays() {}

  setup(runtime) {
    this.setupGPU(runtime);
  }

  resize(runtime) {
    this.resizeGPU(runtime);
  }

  dispose() {
    for (const fn of this.cleanupFns) fn();
    this.cleanupFns.length = 0;
    this.gpu.programs.clear();
    this.gpu.buffers.clear();
    this.gpu.textures.clear();
    this.gpu.framebuffers.clear();
  }
}