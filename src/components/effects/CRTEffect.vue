<template>
  <div>
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.intensity ?? 1.00)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.intensity ?? 1.00"
      @input="instance.options.intensity = +$event.target.value"
    />
    <label>
      Scanlines
      <span class="value">{{ (+(instance.options.scanlines ?? 0.60)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.scanlines ?? 0.60"
      @input="instance.options.scanlines = +$event.target.value"
    />
    <label>
      Espacement scanlines
      <span class="value">{{ (+(instance.options.scanlineSpacing ?? 2.0)).toFixed(1) }}</span>
    </label>
    <input
      type="range" min="1" max="6" step="0.1"
      :value="instance.options.scanlineSpacing ?? 2.0"
      @input="instance.options.scanlineSpacing = +$event.target.value"
    />
    <label>
      Scintillement
      <span class="value">{{ (+(instance.options.flicker ?? 0.70)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.flicker ?? 0.70"
      @input="instance.options.flicker = +$event.target.value"
    />
    <label>
      Vignette
      <span class="value">{{ (+(instance.options.vignette ?? 0.03)).toFixed(3) }}</span>
    </label>
    <input
      type="range" min="0" max="0.05" step="0.001"
      :value="instance.options.vignette ?? 0.03"
      @input="instance.options.vignette = +$event.target.value"
    />
    <label>
      Phosphore
      <span class="value">{{ (+(instance.options.phosphor ?? 0.30)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.phosphor ?? 0.30"
      @input="instance.options.phosphor = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
