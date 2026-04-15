<template>
  <ControlGroup title="Aberration chromatique">
    <label>
      Activer
      <input
        type="checkbox"
        :checked="instance.options.chromatic ?? true"
        @change="instance.options.chromatic = $event.target.checked"
      />
    </label>
    <label>
      Largeur
      <span class="value">{{ (+(instance.options.chromaticWidth ?? 0.55)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.05" max="1.0" step="0.01"
      :value="instance.options.chromaticWidth ?? 0.55"
      @input="instance.options.chromaticWidth = +$event.target.value"
    />
    <label>
      Décalage
      <span class="value">{{ (+(instance.options.chromaticOffset ?? 0.75)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.0" max="3.0" step="0.01"
      :value="instance.options.chromaticOffset ?? 0.75"
      @input="instance.options.chromaticOffset = +$event.target.value"
    />
    <label>Mode</label>
    <select
      :value="instance.options.chromaticMode ?? 'edges'"
      @change="instance.options.chromaticMode = $event.target.value"
    >
      <option value="particles">Particules</option>
      <option value="edges">Bords</option>
    </select>
  </ControlGroup>
</template>

<script setup>
import ControlGroup from '../ControlGroup.vue';

defineProps({ instance: { type: Object, required: true } });
</script>