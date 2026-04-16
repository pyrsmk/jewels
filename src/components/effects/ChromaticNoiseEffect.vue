<template>
  <ControlGroup :title="instance.constructor.uiTitle ?? 'Bruit chromatique'">
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.chromaticNoise ?? 0.18)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="4" step="0.01"
      :value="instance.options.chromaticNoise ?? 0.18"
      @input="instance.options.chromaticNoise = +$event.target.value"
    />
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.chromaticNoiseSpeed ?? 2.10)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="8" step="0.01"
      :value="instance.options.chromaticNoiseSpeed ?? 2.10"
      @input="instance.options.chromaticNoiseSpeed = +$event.target.value"
    />
    <label>
      Échelle
      <span class="value">{{ (+(instance.options.chromaticNoiseScale ?? 2.80)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.4" max="8" step="0.01"
      :value="instance.options.chromaticNoiseScale ?? 2.80"
      @input="instance.options.chromaticNoiseScale = +$event.target.value"
    />
  </ControlGroup>
</template>

<script setup>
import ControlGroup from '../ControlGroup.vue';

defineProps({ instance: { type: Object, required: true } });
</script>