export class EffectStack {
  constructor(effects, currentEffect) {
    this.effects = Array.isArray(effects) ? effects : [];
    this.currentEffect = currentEffect || null;
    this.currentIndex = this.effects.indexOf(this.currentEffect);
  }

  getAfter() {
    if (this.currentIndex < 0) return [];
    return this.effects.slice(this.currentIndex + 1);
  }

  hasEffectAfter(className) {
    return this.getAfter().some((effect) => effect?.constructor?.name === className);
  }
}