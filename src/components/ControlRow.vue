<template>
  <label>
    {{ label }}
    <span v-if="value !== undefined" class="value">{{ value }}</span>
    <slot v-else />
  </label>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: undefined },
});
</script>