<template>
  <div>
    <label>Intensité <span class="value">{{ (+(instance.options.intensity ?? 1.39)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="1.39" step="0.01"
      :value="instance.options.intensity ?? 1.39"
      @input="instance.options.intensity = +$event.target.value"
    />
    <label>Vitesse <span class="value">{{ (+(instance.options.speed ?? 2.00)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="10" step="0.01"
      :value="instance.options.speed ?? 2.00"
      @input="instance.options.speed = +$event.target.value"
    />
    <label>Taille <span class="value">{{ scaleDisplay }}</span></label>
    <input
      type="range" min="0.047" max="8" step="0.001"
      :value="instance.options.size ?? 1.50"
      @input="instance.options.size = +$event.target.value"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';


const props = defineProps({ instance: { type: Object, required: true } });

const scaleDisplay = computed(() => {
  const val = props.instance.options.size ?? 1.50;
  return Math.round(val / 18 * 1920) + ' px';
});
</script>
