import { AbstractAutomationSource } from './AbstractAutomationSource.js';

export class MouseAutomationSource extends AbstractAutomationSource {
  constructor(options = {}) {
    super('mouse', {
      axis: 'x',
      ...options,
    });
    this._x = 0.5;
    this._y = 0.5;
    this._onMouseMove = this._onMouseMove.bind(this);
  }

  _onMouseMove(e) {
    this._x = e.clientX / window.innerWidth;
    this._y = e.clientY / window.innerHeight;
  }

  setup() {
    window.addEventListener('mousemove', this._onMouseMove);
  }

  dispose() {
    window.removeEventListener('mousemove', this._onMouseMove);
  }

  evaluate(_time, _dt) {
    return this.options.axis === 'y' ? this._y : this._x;
  }
}
