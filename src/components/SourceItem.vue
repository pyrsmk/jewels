<template>
  <div class="source-item" :class="{ 'source-item--expanded': expanded }">
    <div class="source-item__header" @click="$emit('toggle')">
      <span class="source-item__badge">SOURCE</span>
      <span class="source-item__label">{{ label }}</span>
      <span class="material-icons source-item__chevron">
        {{ expanded ? 'expand_less' : 'expand_more' }}
      </span>
    </div>
    <div v-if="expanded" class="source-item__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  instance: { type: Object, required: true },
  label: { type: String, required: true },
  expanded: { type: Boolean, default: false },
});
defineEmits(['toggle']);
</script>

<style scoped>
.source-item {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6px;
}
.source-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  user-select: none;
  background: rgba(80, 120, 255, 0.08);
}
.source-item__header:hover { background: rgba(80, 120, 255, 0.14); }
.source-item__badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #6a8fff;
  background: rgba(80, 120, 255, 0.18);
  border-radius: 4px;
  padding: 2px 5px;
  flex-shrink: 0;
}
.source-item__label {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: #ddd;
}
.source-item__chevron { font-size: 16px; color: #8f9bb3; }
.source-item__body { padding: 10px; }
</style>