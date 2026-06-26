<template>
  <div>
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.intensity ?? 4.00)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="4" step="0.01"
      :value="instance.options.intensity ?? 4.00"
      @input="instance.options.intensity = +$event.target.value"
    />
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.speed ?? 2.10)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="8" step="0.01"
      :value="instance.options.speed ?? 2.10"
      @input="instance.options.speed = +$event.target.value"
    />
    <label>
      Échelle
      <span class="value">{{ (+(instance.options.scale ?? 2.80)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.4" max="8" step="0.01"
      :value="instance.options.scale ?? 2.80"
      @input="instance.options.scale = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
