<template>
  <ControlGroup title="Particules">
    <label>Forme</label>
    <select
      :value="instance.options.particleShape"
      @change="instance.options.particleShape = $event.target.value"
    >
      <option value="circle">Cercle</option>
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
    <label>
      Imperfections de surface
      <input
        type="checkbox"
        :checked="instance.options.surfaceImperfections"
        @change="instance.options.surfaceImperfections = $event.target.checked"
      />
    </label>
    <label>Nombre <span class="value">{{ particleCountDisplay }}</span></label>
    <input
      type="range" min="0" max="1" step="0.001"
      :value="instance.options.particleCount ?? 0.316"
      @input="instance.options.particleCount = +$event.target.value"
    />
    <label>Vitesse <span class="value">{{ speedDisplay }}</span></label>
    <input
      type="range" min="0" max="1" step="0.001"
      :value="instance.options.speed ?? 0.047"
      @input="instance.options.speed = +$event.target.value"
    />
    <label>Taille <span class="value">{{ sizeDisplay }}</span></label>
    <input
      type="range" min="1" max="24" step="0.1"
      :value="instance.options.size ?? 9"
      @input="instance.options.size = +$event.target.value"
    />
  </ControlGroup>
</template>

<script setup>
import { computed } from 'vue';
import ControlGroup from '../ControlGroup.vue';

const props = defineProps({ instance: { type: Object, required: true } });

const smooth_ = (x) => x * x * (3 - 2 * x);

const particleCountDisplay = computed(() => {
  const t = props.instance.options.particleCount ?? 0.316;
  let count;
  if (t < 0.20) count = Math.round(100 + (1000 - 100) * smooth_(t / 0.20));
  else if (t < 0.85) count = Math.round(1000 + (50000 - 1000) * smooth_((t - 0.20) / 0.65));
  else count = Math.round(50000 + (100000 - 50000) * smooth_((t - 0.85) / 0.15));
  return count.toLocaleString('fr-FR');
});

const speedDisplay = computed(() => {
  const t = props.instance.options.speed ?? 0.047;
  const speed = t < 0.5 ? 0.4 * (t / 0.5) : 0.4 + (3.0 - 0.4) * ((t - 0.5) / 0.5);
  const px = Math.round(speed * 0.0065 * 60.0 * 540.0);
  return px.toLocaleString('fr-FR') + ' px/s';
});

const sizeDisplay = computed(() => {
  const v = props.instance.options.size ?? 9;
  return Number(v).toFixed(1) + ' px';
});
</script>