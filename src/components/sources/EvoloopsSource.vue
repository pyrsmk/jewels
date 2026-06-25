<template>
  <div>
    <SliderControl
      label="Résolution"
      :model-value="instance.options.gridResolution ?? 128"
      :min="64" :max="512" :step="1"
      :display-fn="v => Math.round(v) + ' px'"
      @update:model-value="instance.setParameters({ gridResolution: $event })"
    />

    <SliderControl
      label="Vitesse"
      :model-value="instance.options.speed ?? 0.35"
      :min="0" :max="1" :step="0.005"
      :display-fn="formatSpeed"
      @update:model-value="instance.options.speed = $event"
    />

    <button class="reseed-btn" @click="instance.reseed()">
      Reseed
    </button>
  </div>
</template>

<script setup>
import SliderControl from '../SliderControl.vue';

defineProps({ instance: { type: Object, required: true } });

function formatSpeed(t) {
  let sps;
  if (t <= 0.6) {
    sps = 0.5 * Math.pow(120, t / 0.6);
  } else {
    sps = 60 * Math.pow(20, (t - 0.6) / 0.4);
  }
  if (sps < 1) return (1 / sps).toFixed(1) + ' s/step';
  if (sps < 60) return sps.toFixed(1) + ' step/s';
  return Math.round(sps / 60) + ' step/frame';
}
</script>

<style scoped>
.reseed-btn {
  margin-top: 6px;
  width: 100%;
  padding: 5px 0;
  cursor: pointer;
}
</style>
