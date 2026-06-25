<template>
  <div>
    <label>Preset</label>
    <select
      :value="instance.options.preset"
      @change="instance.applyPreset($event.target.value)"
    >
      <option value="smoothgol">Smooth GoL</option>
      <option value="gliders">Gliders</option>
      <option value="blobs">Blobs</option>
    </select>

    <label>Initialisation</label>
    <select
      :value="instance.options.initMode ?? 'blobs'"
      @change="instance.setParameters({ initMode: $event.target.value }); instance.reseed()"
    >
      <option value="blobs">Blobs</option>
      <option value="perlin">Perlin</option>
      <option value="uniform">Uniforme</option>
    </select>

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
      label="Rayon externe"
      :model-value="instance.options.ra ?? 10"
      :min="4" :max="20" :step="1"
      :display-fn="v => Math.round(v) + ' px'"
      @update:model-value="instance.options.ra = Math.round($event)"
    />

    <SliderControl
      label="Rayon interne"
      :model-value="instance.options.ri ?? 3"
      :min="1" :max="10" :step="1"
      :display-fn="v => Math.round(v) + ' px'"
      @update:model-value="instance.options.ri = Math.round($event)"
    />

    <SliderControl
      label="dt"
      :model-value="instance.options.dt ?? 0.1"
      :min="0.01" :max="0.3" :step="0.005"
      :display-fn="v => v.toFixed(3)"
      @update:model-value="instance.options.dt = $event"
    />

    <label class="toggle-label">
      <input
        type="checkbox"
        :checked="instance.options.seedLoop"
        @change="instance.options.seedLoop = $event.target.checked"
      />
      Mode Croissance / Décroissance
    </label>

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
.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  cursor: pointer;
}
</style>
