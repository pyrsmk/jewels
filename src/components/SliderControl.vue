<template>
  <label>{{ label }} <span v-if="displayFn" class="value">{{ displayFn(modelValue) }}</span></label>
  <input
    type="range"
    :min="min"
    :max="max"
    :step="step"
    :value="modelValue"
    :disabled="disabled"
    @input="$emit('update:modelValue', +$event.target.value)"
  />
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 0.01 },
  displayFn: { type: Function, default: null },
  disabled: { type: Boolean, default: false },
});

defineEmits(['update:modelValue']);
</script>