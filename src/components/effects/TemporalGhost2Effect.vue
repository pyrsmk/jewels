<template>
  <ControlGroup :title="instance.constructor.uiTitle ?? 'Fantôme temporel 2'">
    <label>
      Activer
      <input
        type="checkbox"
        :checked="instance.options.tg2Enabled"
        @change="instance.options.tg2Enabled = $event.target.checked"
      />
    </label>
    <label>Intensité <span class="value">{{ (+(instance.options.tg2Opacity ?? 0.50)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.tg2Opacity ?? 0.50"
      @input="instance.options.tg2Opacity = +$event.target.value"
    />
    <label>Force <span class="value">{{ (+(instance.options.tg2 ?? 0.20)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="1.8" step="0.01"
      :value="instance.options.tg2 ?? 0.20"
      @input="instance.options.tg2 = +$event.target.value"
    />
    <label>Décalage RGB <span class="value">{{ (+(instance.options.tg2RgbShift ?? 0.80)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="6" step="0.01"
      :value="instance.options.tg2RgbShift ?? 0.80"
      @input="instance.options.tg2RgbShift = +$event.target.value"
    />
    <label>Vitesse <span class="value">{{ (+(instance.options.tg2Speed ?? 1.20)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="6" step="0.01"
      :value="instance.options.tg2Speed ?? 1.20"
      @input="instance.options.tg2Speed = +$event.target.value"
    />
    <label>Décalage <span class="value">{{ (+(instance.options.tg2Scale ?? 1.50)).toFixed(2) }}</span></label>
    <input
      type="range" min="0.2" max="6" step="0.01"
      :value="instance.options.tg2Scale ?? 1.50"
      @input="instance.options.tg2Scale = +$event.target.value"
    />
  </ControlGroup>
</template>

<script setup>
import ControlGroup from '../ControlGroup.vue';

defineProps({ instance: { type: Object, required: true } });
</script>