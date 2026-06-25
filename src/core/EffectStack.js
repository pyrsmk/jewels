export class EffectStack {
  constructor(effects, currentEffect) {
    this.effects = Array.isArray(effects) ? effects : [];
    this.currentEffect = currentEffect || null;
    this.currentIndex = this.effects.indexOf(this.currentEffect);
  }

  reset(effects, currentEffect) {
    this.effects = effects;
    this.currentEffect = currentEffect;
    this.currentIndex = effects.indexOf(currentEffect);
    return this;
  }

  getAfter() {
    if (this.currentIndex < 0) return [];
    return this.effects.slice(this.currentIndex + 1);
  }

  hasEffectAfter(className) {
    const effects = this.effects;
    for (let i = this.currentIndex + 1; i < effects.length; i++) {
      if (effects[i]?.constructor?.name === className) return true;
    }
    return false;
  }
}