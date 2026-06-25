<template>
  <div>
    <SliderControl
      label="Nombre d'espèces"
      :model-value="instance.options.numSpecies ?? 3"
      :min="3" :max="7" :step="1"
      :display-fn="v => Math.round(v)"
      @update:model-value="instance.setParameters({ numSpecies: Math.round($event) })"
    />

    <SliderControl
      label="Seuil de prédation"
      :model-value="instance.options.predationThreshold ?? 3"
      :min="1" :max="5" :step="1"
      :display-fn="v => Math.round(v)"
      @update:model-value="instance.options.predationThreshold = Math.round($event)"
    />

    <label>Palette</label>
    <select
      :value="instance.options.palette"
      @change="instance.options.palette = $event.target.value"
    >
      <option value="warm">Chaudes</option>
      <option value="cool">Froides</option>
      <option value="fluo">Fluos</option>
      <option value="cyberpunk">Cyberpunk</option>
      <option value="aurora">Aurore boréale</option>
      <option value="fire">Feu</option>
      <option value="sunset">Coucher de soleil</option>
      <option value="toxic">Toxique</option>
      <option value="ice">Glace</option>
      <option value="midnight">Minuit</option>
    </select>

    <SliderControl
      label="Résolution"
      :model-value="instance.options.gridResolution ?? 256"
      :min="32" :max="512" :step="1"
      :display-fn="v => Math.round(v) + ' px'"
      @update:model-value="instance.setParameters({ gridResolution: $event })"
    />

    <SliderControl
      label="Vitesse"
      :model-value="instance.options.speed ?? 0.485"
      :min="0" :max="1" :step="0.005"
      :display-fn="formatSpeed"
      @update:model-value="instance.options.speed = $event"
    />

    <SliderControl
      label="Ensemancement"
      :model-value="instance.options.spawnRate ?? 0"
      :min="0" :max="100" :step="0.01"
      :display-fn="v => v.toFixed(2) + ' px/Mpx\u00b2/step'"
      @update:model-value="instance.options.spawnRate = $event"
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
