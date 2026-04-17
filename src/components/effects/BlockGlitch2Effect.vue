<template>
  <div>
    <label>Intensité <span class="value">{{ (+(instance.options.bg2 ?? 1.60)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="1.60" step="0.01"
      :value="instance.options.bg2 ?? 1.60"
      @input="instance.options.bg2 = +$event.target.value"
    />
    <label>Vitesse <span class="value">{{ (+(instance.options.bg2Speed ?? 2.00)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="10" step="0.01"
      :value="instance.options.bg2Speed ?? 2.00"
      @input="instance.options.bg2Speed = +$event.target.value"
    />
    <label>Densité <span class="value">{{ (+(instance.options.bg2Scale ?? 0.75)).toFixed(2) }}</span></label>
    <input
      type="range" min="0.2" max="8" step="0.01"
      :value="instance.options.bg2Scale ?? 0.75"
      @input="instance.options.bg2Scale = +$event.target.value"
    />
  </div>
</template>

<script setup>


const props = defineProps({ instance: { type: Object, required: true } });

</script>
