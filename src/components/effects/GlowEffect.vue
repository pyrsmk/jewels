<template>
  <div>
    <label>Intensité <span class="value">{{ (+(instance.options.intensity ?? 1.0)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="2.5" step="0.01"
      :value="instance.options.intensity ?? 1.0"
      @input="instance.options.intensity = +$event.target.value"
    />
    <label>
      Réponse au grain
      <span class="value">{{ (+(instance.options.grainResponse ?? 1)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.grainResponse ?? 1"
      @input="instance.options.grainResponse = +$event.target.value"
    />
  </div>
</template>

<script setup>
defineProps({ instance: { type: Object, required: true } });
</script>
