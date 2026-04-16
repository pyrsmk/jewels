<template>
  <ControlGroup title="CRT">
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.crt ?? 0.60)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.crt ?? 0.60"
      @input="instance.options.crt = +$event.target.value"
    />
    <label>
      Scanlines
      <span class="value">{{ (+(instance.options.crtScanlines ?? 0.40)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.crtScanlines ?? 0.40"
      @input="instance.options.crtScanlines = +$event.target.value"
    />
    <label>
      Espacement scanlines
      <span class="value">{{ (+(instance.options.crtScanlinesSize ?? 2.0)).toFixed(1) }}</span>
    </label>
    <input
      type="range" min="1" max="6" step="0.1"
      :value="instance.options.crtScanlinesSize ?? 2.0"
      @input="instance.options.crtScanlinesSize = +$event.target.value"
    />
    <label>
      Flickering
      <span class="value">{{ (+(instance.options.crtFlicker ?? 0.25)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.crtFlicker ?? 0.25"
      @input="instance.options.crtFlicker = +$event.target.value"
    />
    <label>
      Vignette
      <span class="value">{{ (+(instance.options.crtVignette ?? 0.02)).toFixed(4) }}</span>
    </label>
    <input
      type="range" min="0" max="0.05" step="0.0001"
      :value="instance.options.crtVignette ?? 0.02"
      @input="instance.options.crtVignette = +$event.target.value"
    />
    <label>
      Phosphore
      <span class="value">{{ (+(instance.options.crtPhosphore ?? 0.20)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.crtPhosphore ?? 0.20"
      @input="instance.options.crtPhosphore = +$event.target.value"
    />
  </ControlGroup>
</template>

<script setup>
import ControlGroup from '../ControlGroup.vue';

defineProps({ instance: { type: Object, required: true } });
</script>