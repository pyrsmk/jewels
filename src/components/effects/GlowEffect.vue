<template>
  <div>
    <label>Intensité <span class="value">{{ (+(instance.options.glow ?? 1.0)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="2.5" step="0.01"
      :value="instance.options.glow ?? 1.0"
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
  </div>
</template>

<script setup>
defineProps({ instance: { type: Object, required: true } });
</script>
