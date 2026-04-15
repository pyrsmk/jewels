<template>
  <ControlGroup title="Glow">
    <label>
      Activer
      <input
        type="checkbox"
        :checked="instance.options.glowEnabled ?? true"
        @change="instance.options.glowEnabled = $event.target.checked"
      />
    </label>
    <label>Intensité <span class="value">{{ glowDisplay }}</span></label>
    <input
      type="range" min="0" max="2.5" step="0.01"
      :value="instance.options.glow ?? 1.3"
      @input="instance.options.glow = +$event.target.value"
    />
    <label>
      Réponse au grain
      <span class="value">{{ (+(instance.options.glowGrainResponse ?? 1)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.glowGrainResponse ?? 1"
      @input="instance.options.glowGrainResponse = +$event.target.value"
    />
    <label>Mode</label>
    <select
      :value="instance.options.glowMode ?? 'post'"
      @change="instance.options.glowMode = $event.target.value"
    >
      <option value="simple">Simple</option>
      <option value="post">Post-process</option>
      <option value="post2">Post-process v2</option>
    </select>
  </ControlGroup>
</template>

<script setup>
import { computed } from 'vue';
import ControlGroup from '../ControlGroup.vue';

const props = defineProps({ instance: { type: Object, required: true } });

const glowDisplay = computed(() => {
  const enabled = props.instance.options.glowEnabled ?? true;
  const val = enabled ? +(props.instance.options.glow ?? 1.3) : 0;
  return val.toFixed(2);
});
</script>