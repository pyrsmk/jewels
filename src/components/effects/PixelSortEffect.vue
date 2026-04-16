<template>
  <ControlGroup :title="instance.constructor.uiTitle ?? 'Glitchs horizontaux'">
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.hGlitch ?? 0.20)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="4" step="0.01"
      :value="instance.options.hGlitch ?? 0.20"
      @input="instance.options.hGlitch = +$event.target.value"
    />
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.hGlitchSpeed ?? 1.40)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="6" step="0.01"
      :value="instance.options.hGlitchSpeed ?? 1.40"
      @input="instance.options.hGlitchSpeed = +$event.target.value"
    />
    <label>
      Longueur
      <span class="value">{{ (+(instance.options.hGlitchScale ?? 2.50)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="8" step="0.01"
      :value="instance.options.hGlitchScale ?? 2.50"
      @input="instance.options.hGlitchScale = +$event.target.value"
    />
    <label>
      Seuil
      <span class="value">{{ (+(instance.options.hGlitchThreshold ?? 0.05)).toFixed(3) }}</span>
    </label>
    <input
      type="range" min="0" max="0.3" step="0.001"
      :value="instance.options.hGlitchThreshold ?? 0.05"
      @input="instance.options.hGlitchThreshold = +$event.target.value"
    />
  </ControlGroup>
</template>

<script setup>
import ControlGroup from '../ControlGroup.vue';

defineProps({ instance: { type: Object, required: true } });
</script>