<template>
  <div>
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.rgbSplit ?? 1.80)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1.8" step="0.01"
      :value="instance.options.rgbSplit ?? 1.80"
      @input="instance.options.rgbSplit = +$event.target.value"
    />
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.rgbSplitSpeed ?? 2.20)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="8" step="0.01"
      :value="instance.options.rgbSplitSpeed ?? 2.20"
      @input="instance.options.rgbSplitSpeed = +$event.target.value"
    />
    <label>
      Échelle
      <span class="value">{{ (+(instance.options.rgbSplitScale ?? 2.00)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="8" step="0.01"
      :value="instance.options.rgbSplitScale ?? 2.00"
      @input="instance.options.rgbSplitScale = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
