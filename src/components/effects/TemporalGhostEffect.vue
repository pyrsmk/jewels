<template>
  <div>
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.temporalGhostOpacity ?? 0.70)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="0.9" step="0.01"
      :value="instance.options.temporalGhostOpacity ?? 0.70"
      @input="instance.options.temporalGhostOpacity = +$event.target.value"
    />

    <label>
      Décalage RGB
      <span class="value">{{ (+(instance.options.temporalGhostRgbShift ?? 0.80)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="6" step="0.01"
      :value="instance.options.temporalGhostRgbShift ?? 0.80"
      @input="instance.options.temporalGhostRgbShift = +$event.target.value"
    />
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.temporalGhostSpeed ?? 1.20)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="6" step="0.01"
      :value="instance.options.temporalGhostSpeed ?? 1.20"
      @input="instance.options.temporalGhostSpeed = +$event.target.value"
    />
    <label>
      Décalage
      <span class="value">{{ (+(instance.options.temporalGhostScale ?? 1.50)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="6" step="0.01"
      :value="instance.options.temporalGhostScale ?? 1.50"
      @input="instance.options.temporalGhostScale = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
