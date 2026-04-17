<template>
  <div>
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.hGlitch ?? 1.00)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.hGlitch ?? 1.00"
      @input="instance.options.hGlitch = +$event.target.value"
    />
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.hGlitchSpeed ?? 1.20)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="6" step="0.01"
      :value="instance.options.hGlitchSpeed ?? 1.20"
      @input="instance.options.hGlitchSpeed = +$event.target.value"
    />
    <label>
      Densité
      <span class="value">{{ (+(instance.options.hGlitchScale ?? 0.00)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="8" step="0.01"
      :value="instance.options.hGlitchScale ?? 0.00"
      @input="instance.options.hGlitchScale = +$event.target.value"
    />

  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
