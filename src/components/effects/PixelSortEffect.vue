<template>
  <ControlGroup :title="instance.constructor.uiTitle ?? 'Pixel Sort'">
    <label>
      Activer
      <input
        type="checkbox"
        :checked="instance.options.pixelSortEnabled"
        @change="instance.options.pixelSortEnabled = $event.target.checked"
      />
    </label>
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.pixelSort ?? 0.20)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="4" step="0.01"
      :value="instance.options.pixelSort ?? 0.20"
      @input="instance.options.pixelSort = +$event.target.value"
    />
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.pixelSortSpeed ?? 1.40)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="6" step="0.01"
      :value="instance.options.pixelSortSpeed ?? 1.40"
      @input="instance.options.pixelSortSpeed = +$event.target.value"
    />
    <label>
      Longueur
      <span class="value">{{ (+(instance.options.pixelSortScale ?? 2.50)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="8" step="0.01"
      :value="instance.options.pixelSortScale ?? 2.50"
      @input="instance.options.pixelSortScale = +$event.target.value"
    />
    <label>
      Seuil
      <span class="value">{{ (+(instance.options.pixelSortThreshold ?? 0.05)).toFixed(3) }}</span>
    </label>
    <input
      type="range" min="0" max="0.3" step="0.001"
      :value="instance.options.pixelSortThreshold ?? 0.05"
      @input="instance.options.pixelSortThreshold = +$event.target.value"
    />
  </ControlGroup>
</template>

<script setup>
import ControlGroup from '../ControlGroup.vue';

defineProps({ instance: { type: Object, required: true } });
</script>