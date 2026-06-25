<template>
  <div>
    <label>Preset</label>
    <select
      :value="instance.options.preset"
      @change="onPresetChange($event.target.value)"
    >
      <option value="orbium">Orbium</option>
      <option value="geminium">Geminium</option>
      <option value="smooth">Smooth</option>
      <option value="pulse">Pulse</option>
      <option value="worms">Worms</option>
    </select>

    <label>Pattern</label>
    <select
      :value="instance.options.initMode"
      @change="onInitModeChange($event.target.value)"
    >
      <option value="creatures">Créatures</option>
      <option value="blobs">Blobs gaussiens</option>
      <option value="perlin">Bruit Perlin</option>
      <option value="rings">Anneaux concentriques</option>
      <option value="uniform">Bruit uniforme</option>
    </select>

    <label>Palette</label>
    <select
      :value="instance.options.palette"
      @change="instance.options.palette = $event.target.value"
    >
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

    <SliderControl
      label="Résolution"
      :model-value="instance.options.gridResolution ?? 256"
      :min="32" :max="512" :step="1"
      :display-fn="v => Math.round(v) + ' px'"
      @update:model-value="onGridResolutionChange($event)"
    />

    <SliderControl
      label="Vitesse"
      :model-value="instance.options.speed ?? 0.485"
      :min="0" :max="1" :step="0.005"
      :display-fn="formatSpeed"
      @update:model-value="instance.options.speed = $event"
    />

    <SliderControl
      label="Rayon du kernel"
      :model-value="instance.options.kernelRadius ?? 13"
      :min="3" :max="20" :step="1"
      :display-fn="v => Math.round(v) + ' px'"
      @update:model-value="instance.options.kernelRadius = Math.round($event)"
    />

    <SliderControl
      label="Mu (centre croissance)"
      :model-value="instance.options.mu ?? 0.15"
      :min="0.01" :max="0.5" :step="0.001"
      :display-fn="v => v.toFixed(3)"
      @update:model-value="instance.options.mu = $event"
    />

    <SliderControl
      label="Sigma (largeur croissance)"
      :model-value="instance.options.sigma ?? 0.015"
      :min="0.001" :max="0.1" :step="0.001"
      :display-fn="v => v.toFixed(3)"
      @update:model-value="instance.options.sigma = $event"
    />

    <SliderControl
      label="Delta temps"
      :model-value="instance.options.dt ?? 0.1"
      :min="0.01" :max="0.5" :step="0.005"
      :display-fn="v => v.toFixed(3)"
      @update:model-value="instance.options.dt = $event"
    />

    <button class="reseed-btn" @click="instance.reseed()">
      Reseed
    </button>
  </div>
</template>

<script setup>
import SliderControl from '../SliderControl.vue';
import { leniaStepsPerSecond } from '../../sources/LeniaSource.js';

const props = defineProps({ instance: { type: Object, required: true } });

function onPresetChange(value) {
  props.instance.applyPreset(value);
}

function onInitModeChange(value) {
  props.instance.setParameters({ initMode: value });
  props.instance.reseed();
}

function onGridResolutionChange(value) {
  props.instance.setParameters({ gridResolution: value });
}

function formatSpeed(t) {
  const sps = leniaStepsPerSecond(t);
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
