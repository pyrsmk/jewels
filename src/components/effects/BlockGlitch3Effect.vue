<template>
  <ControlGroup :title="instance.constructor.uiTitle ?? 'Block Glitch 3'">
    <label>
      Activer
      <input
        type="checkbox"
        :checked="instance.options.bg3Enabled"
        @change="instance.options.bg3Enabled = $event.target.checked"
      />
    </label>
    <label>Intensité <span class="value">{{ (+(instance.options.bg3 ?? 0.22)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="4" step="0.01"
      :value="instance.options.bg3 ?? 0.22"
      @input="instance.options.bg3 = +$event.target.value"
    />
    <label>Vitesse <span class="value">{{ (+(instance.options.bg3Speed ?? 1.50)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="8" step="0.01"
      :value="instance.options.bg3Speed ?? 1.50"
      @input="instance.options.bg3Speed = +$event.target.value"
    />
    <label>Échelle <span class="value">{{ scaleDisplay }}</span></label>
    <input
      type="range" min="0.2" max="8" step="0.01"
      :value="instance.options.bg3Scale ?? 2.20"
      @input="instance.options.bg3Scale = +$event.target.value"
    />
  </ControlGroup>
</template>

<script setup>
import { computed } from 'vue';
import ControlGroup from '../ControlGroup.vue';

const props = defineProps({ instance: { type: Object, required: true } });

const scaleDisplay = computed(() => {
  const val = props.instance.options.bg3Scale ?? 2.20;
  return Math.round(val / 32 * 1920) + ' px';
});
</script>