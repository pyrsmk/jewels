import { reactive } from 'vue';

export class AbstractAutomationSource {
  constructor(type, options = {}) {
    this.type = type;
    this.options = reactive({ ...options });
  }

  evaluate(_time, _dt) {
    return 0;
  }

  setup() {}

  dispose() {}

  getParameters() {
    return { ...this.options };
  }

  setParameters(params) {
    if (!params || typeof params !== 'object') return;
    for (const key of Object.keys(params)) {
      if (key in this.options) {
        this.options[key] = params[key];
      }
    }
  }

  serialize() {
    return { type: this.type, params: this.getParameters() };
  }
}
