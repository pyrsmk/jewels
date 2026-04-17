<template>
  <div>
    <label>Intensité <span class="value">{{ (+(instance.options.bg3 ?? 1.50)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="1.50" step="0.01"
      :value="instance.options.bg3 ?? 1.50"
      @input="instance.options.bg3 = +$event.target.value"
    />
    <label>Vitesse <span class="value">{{ (+(instance.options.bg3Speed ?? 1.50)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="8" step="0.01"
      :value="instance.options.bg3Speed ?? 1.50"
      @input="instance.options.bg3Speed = +$event.target.value"
    />
    <label>Densité <span class="value">{{ (+(instance.options.bg3Scale ?? 1.50)).toFixed(2) }}</span></label>
    <input
      type="range" min="0.2" max="8" step="0.01"
      :value="instance.options.bg3Scale ?? 1.50"
      @input="instance.options.bg3Scale = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
