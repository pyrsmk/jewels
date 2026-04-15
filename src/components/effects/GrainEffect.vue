<template>
  <ControlGroup title="Grain">
    <label>
      Activer
      <input
        type="checkbox"
        :checked="instance.options.filmGrain ?? true"
        @change="instance.options.filmGrain = $event.target.checked"
      />
    </label>
    <label>Quantité <span class="value">{{ (+(instance.options.grainAmount ?? 3)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="10" step="0.01"
      :value="instance.options.grainAmount ?? 3"
      @input="instance.options.grainAmount = +$event.target.value"
    />
    <label>Mode</label>
    <select
      :value="instance.options.grainMode ?? 'celluloid'"
      @change="instance.options.grainMode = $event.target.value"
    >
      <option value="static">Statique</option>
      <option value="scan">Scan</option>
      <option value="celluloid">Celluloïd</option>
    </select>
  </ControlGroup>
</template>

<script setup>
import ControlGroup from '../ControlGroup.vue';

defineProps({ instance: { type: Object, required: true } });
</script>