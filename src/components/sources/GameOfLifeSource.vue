<template>
  <div>
    <label>Algorithme</label>
    <select
      :value="instance.options.algorithm"
      @change="onAlgorithmChange($event.target.value)"
    >
      <optgroup label="Life-like">
        <option value="conway">Conway (B3/S23)</option>
        <option value="highlife">HighLife (B36/S23)</option>
        <option value="seeds">Seeds (B2/S)</option>
        <option value="daynight">Day & Night (B3678/S34678)</option>
        <option value="diamoeba">Diamoeba (B35678/S5678)</option>
        <option value="replicator">Replicator (B1357/S1357)</option>
        <option value="lifenodeath">Life sans mort (B3/S012345678)</option>
      </optgroup>
      <optgroup label="Spécial">
        <option value="brain">Brian's Brain</option>
      </optgroup>
    </select>

    <label>Seeding</label>
    <select
      :value="instance.options.initMode ?? 'single'"
      @change="instance.setParameters({ initMode: $event.target.value })"
    >
      <option value="single">Single</option>
      <option value="multi">Multi</option>
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
      :model-value="instance.options.gridResolution ?? 512"
      :min="32" :max="1024" :step="1"
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
      label="Densité initiale"
      :model-value="instance.options.initialDensity ?? 0.3"
      :min="0.01" :max="0.9" :step="0.01"
      :display-fn="v => Math.round(v * 100) + ' %'"
      :disabled="(instance.options.initMode ?? 'single') === 'single'"
      @update:model-value="instance.options.initialDensity = $event"
    />

    <SliderControl
      label="Ensemancement"
      :model-value="instance.options.spawnRate ?? 10"
      :min="0" :max="100" :step="0.01"
      :display-fn="v => v.toFixed(2) + ' px/Mpx²/step'"
      @update:model-value="instance.options.spawnRate = $event"
    />

    <button class="reseed-btn" @click="instance.reseed()">
      Reseed
    </button>
  </div>
</template>

<script setup>
import SliderControl from '../SliderControl.vue';

const props = defineProps({ instance: { type: Object, required: true } });

function onAlgorithmChange(value) {
  props.instance.setParameters({ algorithm: value });
}

function onGridResolutionChange(value) {
  props.instance.setParameters({ gridResolution: value });
}

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
