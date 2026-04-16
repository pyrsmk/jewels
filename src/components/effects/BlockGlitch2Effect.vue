<template>
  <ControlGroup>
    <label>Intensité <span class="value">{{ (+(instance.options.bg2 ?? 0.20)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="4" step="0.01"
      :value="instance.options.bg2 ?? 0.20"
      @input="instance.options.bg2 = +$event.target.value"
    />
    <label>Vitesse <span class="value">{{ (+(instance.options.bg2Speed ?? 2.00)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="10" step="0.01"
      :value="instance.options.bg2Speed ?? 2.00"
      @input="instance.options.bg2Speed = +$event.target.value"
    />
    <label>Échelle <span class="value">{{ scaleDisplay }}</span></label>
    <input
      type="range" min="0.2" max="8" step="0.01"
      :value="instance.options.bg2Scale ?? 1.50"
      @input="instance.options.bg2Scale = +$event.target.value"
    />
  </ControlGroup>
</template>

<script setup>
import { computed } from 'vue';
import ControlGroup from '../ControlGroup.vue';

const props = defineProps({ instance: { type: Object, required: true } });

const scaleDisplay = computed(() => {
  const val = props.instance.options.bg2Scale ?? 1.50;
  return Math.round(val / 8 * 1920) + ' px';
});
</script>