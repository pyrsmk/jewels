<template>
  <div>
    <label>Intensité <span class="value">{{ (+(instance.options.intensity ?? 1.60)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="1.60" step="0.01"
      :value="instance.options.intensity ?? 1.60"
      @input="instance.options.intensity = +$event.target.value"
    />
    <label>Vitesse <span class="value">{{ (+(instance.options.speed ?? 2.00)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="10" step="0.01"
      :value="instance.options.speed ?? 2.00"
      @input="instance.options.speed = +$event.target.value"
    />
    <label>Densité <span class="value">{{ (+(instance.options.density ?? 0.75)).toFixed(2) }}</span></label>
    <input
      type="range" min="0.2" max="8" step="0.01"
      :value="instance.options.density ?? 0.75"
      @input="instance.options.density = +$event.target.value"
    />
  </div>
</template>

<script setup>


const props = defineProps({ instance: { type: Object, required: true } });

</script>
