<template>
  <div>
    <label>Mode</label>
    <select
      :value="instance.options.chromaticMode ?? 'edges'"
      @change="instance.options.chromaticMode = $event.target.value"
    >
      <option value="edges">Bords</option>
      <option value="source">Source</option>
    </select>
    <label :class="{ disabled: instance.options.chromaticMode === 'source' }">
      Largeur
      <span class="value">{{ (+(instance.options.chromaticWidth ?? 0.55)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.05" max="1.0" step="0.01"
      :value="instance.options.chromaticWidth ?? 0.55"
      :disabled="instance.options.chromaticMode === 'source'"
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
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
