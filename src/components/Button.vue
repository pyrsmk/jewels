<template>
  <button type="button" :title="tooltip" :class="['btn', `btn--${variant}`, `btn--${size}`]" :disabled="disabled" @click="$emit('click')">
    <span v-if="icon" class="material-icons">{{ icon }}</span>
    <span v-if="label" class="btn__label">{{ label }}</span>
  </button>
</template>

<script setup>
defineProps({
  icon: { type: String, default: null },
  label: { type: String, default: null },
  tooltip: { type: String, default: null },
  variant: { type: String, default: 'default' },
  size: { type: String, default: 'default' },
  disabled: { type: Boolean, default: false },
});

defineEmits(['click']);
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #181a22;
  color: #ddd;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 6px;
  padding: 7px 8px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  width: auto;
}
.btn:hover:not(:disabled) { background: #202434; }
.btn:disabled { opacity: 0.35; cursor: not-allowed; }
.material-icons { font-size: 18px; }
.btn--xl {
  padding: 12px 18px;
  font-size: 15px;
  border-radius: 8px;
  gap: 10px;
}
.btn--xl .material-icons { font-size: 22px; }
.btn--xxl {
  padding: 18px 28px;
  font-size: 20px;
  border-radius: 10px;
  gap: 14px;
}
.btn--xxl .material-icons { font-size: 40px; }
</style>