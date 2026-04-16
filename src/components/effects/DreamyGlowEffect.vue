<template>
  <ControlGroup title="Dreamy Glow">
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.dreamyGlow ?? 4)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="5" step="0.01"
      :value="instance.options.dreamyGlow ?? 4"
      @input="instance.options.dreamyGlow = +$event.target.value"
    />
    <label>
      Réponse au grain
      <span class="value">{{ (+(instance.options.dreamyGrainResponse ?? 1)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.dreamyGrainResponse ?? 1"
      @input="instance.options.dreamyGrainResponse = +$event.target.value"
    />
    <label>
      Edge boost
      <span class="value">{{ (+(instance.options.dreamyEdgeBoost ?? 3)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="5" step="0.01"
      :value="instance.options.dreamyEdgeBoost ?? 3"
      @input="instance.options.dreamyEdgeBoost = +$event.target.value"
    />
  </ControlGroup>
</template>

<script setup>
import ControlGroup from '../ControlGroup.vue';

defineProps({ instance: { type: Object, required: true } });
</script>