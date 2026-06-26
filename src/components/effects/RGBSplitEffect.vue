<template>
  <div>
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.intensity ?? 1.80)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1.8" step="0.01"
      :value="instance.options.intensity ?? 1.80"
      @input="instance.options.intensity = +$event.target.value"
    />
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.speed ?? 2.20)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="8" step="0.01"
      :value="instance.options.speed ?? 2.20"
      @input="instance.options.speed = +$event.target.value"
    />
    <label>
      Échelle
      <span class="value">{{ (+(instance.options.scale ?? 2.00)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="8" step="0.01"
      :value="instance.options.scale ?? 2.00"
      @input="instance.options.scale = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
