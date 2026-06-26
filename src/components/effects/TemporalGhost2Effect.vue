<template>
  <div>
    <label>Intensité <span class="value">{{ (+(instance.options.intensity ?? 1.00)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.intensity ?? 1.00"
      @input="instance.options.intensity = +$event.target.value"
    />
    <label>Amplitude <span class="value">{{ (+(instance.options.amplitude ?? 1.25)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="1.8" step="0.01"
      :value="instance.options.amplitude ?? 1.25"
      @input="instance.options.amplitude = +$event.target.value"
    />
    <label>Décalage RGB <span class="value">{{ (+(instance.options.rgbShift ?? 0.80)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="6" step="0.01"
      :value="instance.options.rgbShift ?? 0.80"
      @input="instance.options.rgbShift = +$event.target.value"
    />
    <label>Vitesse <span class="value">{{ (+(instance.options.speed ?? 1.20)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="6" step="0.01"
      :value="instance.options.speed ?? 1.20"
      @input="instance.options.speed = +$event.target.value"
    />
    <label>Décalage <span class="value">{{ (+(instance.options.offset ?? 1.50)).toFixed(2) }}</span></label>
    <input
      type="range" min="0.2" max="6" step="0.01"
      :value="instance.options.offset ?? 1.50"
      @input="instance.options.offset = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
