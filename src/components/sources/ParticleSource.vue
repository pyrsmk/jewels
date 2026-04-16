<template>
  <ControlGroup title="Particules">
    <label>Forme</label>
    <select
      :value="instance.options.particleShape"
      @change="instance.options.particleShape = $event.target.value"
    >
      <option value="pearls">Perles</option>
      <option value="pixel">Pixels</option>
      <option value="flowline">Flows</option>
      <option value="softsquare">Carré soft</option>
      <option value="core">Core</option>
      <option value="glitter">Glitter</option>
    </select>
    <label>Mouvement</label>
    <select
      :value="instance.options.flowDirection"
      @change="instance.options.flowDirection = $event.target.value"
    >
      <option value="free">Vortex</option>
      <option value="horizontal">De gauche à droite</option>
      <option value="horizontal-rev">De droite à gauche</option>
      <option value="vertical-rev">De haut en bas</option>
      <option value="vertical">De bas en haut</option>
    </select>
    <label v-if="instance.options.flowDirection !== 'free'">
      Imperfections de surface
      <input
        type="checkbox"
        :checked="instance.options.surfaceImperfections"
        @change="instance.options.surfaceImperfections = $event.target.checked"
      />
    </label>
    <label>
      Fondu sur les bords
      <input
        type="checkbox"
        :checked="instance.options.edgeFade ?? true"
        @change="instance.options.edgeFade = $event.target.checked"
      />
    </label>
    <SliderControl
      label="Nombre"
      :model-value="instance.options.particleCount ?? 0.316"
      :min="0" :max="1" :step="0.001"
      :display-fn="formatParticleCount"
      @update:model-value="instance.options.particleCount = $event"
    />
    <SliderControl
      label="Vitesse"
      :model-value="instance.options.speed ?? 0.047"
      :min="0" :max="1" :step="0.001"
      :display-fn="formatSpeed"
      @update:model-value="instance.options.speed = $event"
    />
    <SliderControl
      label="Taille"
      :model-value="instance.options.size ?? 9"
      :min="1" :max="24" :step="0.1"
      :display-fn="v => Number(v).toFixed(1) + ' px'"
      @update:model-value="instance.options.size = $event"
    />
    <SliderControl
      label="Chaos"
      :model-value="instance.options.particleJitter ?? 0.3"
      :min="0" :max="1" :step="0.01"
      :display-fn="v => Math.round(v * 100) + ' %'"
      @update:model-value="instance.options.particleJitter = $event"
    />
  </ControlGroup>
</template>

<script setup>
import { watch } from 'vue';
import ControlGroup from '../ControlGroup.vue';
import SliderControl from '../SliderControl.vue';

const props = defineProps({ instance: { type: Object, required: true } });

watch(() => props.instance.options.particleCount, () => {
  props.instance.reseedParticles();
});

const smooth_ = (x) => x * x * (3 - 2 * x);

function formatParticleCount(t) {
  let count;
  if (t < 0.20) count = Math.round(100 + (1000 - 100) * smooth_(t / 0.20));
  else if (t < 0.85) count = Math.round(1000 + (50000 - 1000) * smooth_((t - 0.20) / 0.65));
  else count = Math.round(50000 + (100000 - 50000) * smooth_((t - 0.85) / 0.15));
  return count.toLocaleString('fr-FR');
}

function formatSpeed(t) {
  const speed = t < 0.5 ? 0.4 * (t / 0.5) : 0.4 + (3.0 - 0.4) * ((t - 0.5) / 0.5);
  const px = Math.round(speed * 0.0065 * 60.0 * 540.0);
  return px.toLocaleString('fr-FR') + ' px/s';
}
</script>