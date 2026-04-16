<template>
  <div
    class="effect-item"
    :class="{ 'effect-item--expanded': expanded, 'effect-item--draggable': draggable }"
    :draggable="draggable"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
    @dragover.prevent="$emit('dragover', $event)"
  >
    <div class="effect-item__header" @click="$emit('toggle')">
      <span v-if="draggable" class="material-icons effect-item__handle">drag_indicator</span>
      <span class="effect-item__badge">EFFET</span>
      <span class="effect-item__label">{{ label }}</span>
      <span class="material-icons effect-item__chevron">
        {{ expanded ? 'expand_less' : 'expand_more' }}
      </span>
      <span class="material-icons effect-item__delete" @click.stop="$emit('delete')">delete</span>
    </div>
    <div v-if="expanded" class="effect-item__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  instance: { type: Object, required: true },
  label: { type: String, required: true },
  expanded: { type: Boolean, default: false },
  draggable: { type: Boolean, default: false },
});
defineEmits(['toggle', 'delete', 'dragstart', 'dragend', 'dragover']);
</script>

<style scoped>
.effect-item {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6px;
}
.effect-item--draggable { cursor: grab; }
.effect-item--draggable:active { cursor: grabbing; }
.effect-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  user-select: none;
  background: rgba(255,255,255,.03);
}
.effect-item__header:hover { background: rgba(255,255,255,.06); }
.effect-item__handle { font-size: 16px; color: #8f9bb3; cursor: grab; }
.effect-item__badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #c8a800;
  background: rgba(200, 168, 0, 0.18);
  border-radius: 4px;
  padding: 2px 5px;
  flex-shrink: 0;
}
.effect-item__label { flex: 1; font-size: 12px; font-weight: 600; color: #ddd; }
.effect-item__chevron { font-size: 16px; color: #8f9bb3; }
.effect-item__delete {
  font-size: 16px;
  color: #8f9bb3;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px;
}
.effect-item__delete:hover { color: #ff6b6b; }
.effect-item__body { padding: 10px; }
</style>