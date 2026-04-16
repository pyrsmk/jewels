<template>
  <ControlGroup title="Color Shimmer">
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.colorTint2 ?? 0.20)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="3" step="0.01"
      :value="instance.options.colorTint2 ?? 0.20"
      @input="instance.options.colorTint2 = +$event.target.value"
    />
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.colorTint2Speed ?? 0.60)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="3" step="0.01"
      :value="instance.options.colorTint2Speed ?? 0.60"
      @input="instance.options.colorTint2Speed = +$event.target.value"
    />
    <label>
      Échelle
      <span class="value">{{ (+(instance.options.colorTint2Scale ?? 1.10)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="4" step="0.01"
      :value="instance.options.colorTint2Scale ?? 1.10"
      @input="instance.options.colorTint2Scale = +$event.target.value"
    />
    <label>Palette</label>
    <select
      :value="instance.options.colorTint2Palette ?? 'all'"
      @change="instance.options.colorTint2Palette = $event.target.value"
    >
      <option value="all">Toutes</option>
      <option value="warm">Chaleureuses</option>
      <option value="cool">Froides</option>
      <option value="fluo">Fluo</option>
      <option value="cyberpunk">Cyberpunk</option>
      <option value="aurora">Aurora</option>
      <option value="fire">Feu</option>
      <option value="sunset">Coucher de soleil</option>
      <option value="toxic">Toxique</option>
      <option value="ice">Glace</option>
      <option value="midnight">Minuit</option>
    </select>
  </ControlGroup>
</template>

<script setup>
import ControlGroup from '../ControlGroup.vue';

defineProps({ instance: { type: Object, required: true } });
</script>