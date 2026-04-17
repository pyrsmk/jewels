<template>
  <div>
    <label>
      Luminosité
      <span class="value">{{ (+(instance.options.cgBrightness ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.cgBrightness ?? 0"
      @input="instance.options.cgBrightness = +$event.target.value"
    />
    <label>
      Contraste
      <span class="value">{{ (+(instance.options.cgContrast ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.cgContrast ?? 0"
      @input="instance.options.cgContrast = +$event.target.value"
    />
    <label>
      Saturation
      <span class="value">{{ (+(instance.options.cgSaturation ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.cgSaturation ?? 0"
      @input="instance.options.cgSaturation = +$event.target.value"
    />
    <label>
      Chaleur
      <span class="value">{{ (+(instance.options.cgWarmth ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.cgWarmth ?? 0"
      @input="instance.options.cgWarmth = +$event.target.value"
    />
    <label>
      Teinte
      <span class="value">{{ (+(instance.options.cgHue ?? 0)).toFixed(0) }}°</span>
    </label>
    <input
      type="range" min="-180" max="180" step="1"
      :value="instance.options.cgHue ?? 0"
      @input="instance.options.cgHue = +$event.target.value"
    />
    <label>
      Zones d'ombres
      <span class="value">{{ (+(instance.options.cgShadows ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.cgShadows ?? 0"
      @input="instance.options.cgShadows = +$event.target.value"
    />
    <label>
      Tons clairs
      <span class="value">{{ (+(instance.options.cgHighlights ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.cgHighlights ?? 0"
      @input="instance.options.cgHighlights = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>

