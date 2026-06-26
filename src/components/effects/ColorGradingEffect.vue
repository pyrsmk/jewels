<template>
  <div>
    <label>
      Luminosité
      <span class="value">{{ (+(instance.options.brightness ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.brightness ?? 0"
      @input="instance.options.brightness = +$event.target.value"
    />
    <label>
      Contraste
      <span class="value">{{ (+(instance.options.contrast ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.contrast ?? 0"
      @input="instance.options.contrast = +$event.target.value"
    />
    <label>
      Saturation
      <span class="value">{{ (+(instance.options.saturation ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.saturation ?? 0"
      @input="instance.options.saturation = +$event.target.value"
    />
    <label>
      Chaleur
      <span class="value">{{ (+(instance.options.warmth ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.warmth ?? 0"
      @input="instance.options.warmth = +$event.target.value"
    />
    <label>
      Teinte
      <span class="value">{{ (+(instance.options.hue ?? 0)).toFixed(0) }}°</span>
    </label>
    <input
      type="range" min="-180" max="180" step="1"
      :value="instance.options.hue ?? 0"
      @input="instance.options.hue = +$event.target.value"
    />
    <label>
      Zones d'ombres
      <span class="value">{{ (+(instance.options.shadows ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.shadows ?? 0"
      @input="instance.options.shadows = +$event.target.value"
    />
    <label>
      Tons clairs
      <span class="value">{{ (+(instance.options.highlights ?? 0)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="-1" max="1" step="0.01"
      :value="instance.options.highlights ?? 0"
      @input="instance.options.highlights = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>

