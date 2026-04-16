<template>
  <ControlGroup title="Block Glitch">
    <label>Intensité <span class="value">{{ (+(instance.options.blockGlitch ?? 0.20)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="4" step="0.01"
      :value="instance.options.blockGlitch ?? 0.20"
      @input="instance.options.blockGlitch = +$event.target.value"
    />
    <label>Vitesse <span class="value">{{ (+(instance.options.blockGlitchSpeed ?? 2.00)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="10" step="0.01"
      :value="instance.options.blockGlitchSpeed ?? 2.00"
      @input="instance.options.blockGlitchSpeed = +$event.target.value"
    />
    <label>Taille <span class="value">{{ scaleDisplay }}</span></label>
    <input
      type="range" min="0.047" max="8" step="0.001"
      :value="instance.options.blockGlitchScale ?? 1.50"
      @input="instance.options.blockGlitchScale = +$event.target.value"
    />
  </ControlGroup>
</template>

<script setup>
import { computed } from 'vue';
import ControlGroup from '../ControlGroup.vue';

const props = defineProps({ instance: { type: Object, required: true } });

const scaleDisplay = computed(() => {
  const val = props.instance.options.blockGlitchScale ?? 1.50;
  return Math.round(val / 18 * 1920) + ' px';
});
</script>