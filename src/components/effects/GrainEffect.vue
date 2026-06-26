<template>
  <div>
    <label>Quantité <span class="value">{{ (+(instance.options.amount ?? 6)).toFixed(2) }}</span></label>
    <input
      type="range" min="0" max="10" step="0.01"
      :value="instance.options.amount ?? 6"
      @input="instance.options.amount = +$event.target.value"
    />
  </div>
</template>

<script setup>
defineProps({ instance: { type: Object, required: true } });
</script>