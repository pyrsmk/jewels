<template>
  <div
    class="effect-item"
    :class="{ 'effect-item--expanded': expanded, 'effect-item--draggable': draggable }"
  >
    <div class="effect-item__header" @click="$emit('toggle')">
      <span
        class="material-icons effect-item__handle"
        :draggable="draggable"
        @dragstart.stop="draggable && $emit('dragstart', $event)"
        @dragend.stop="$emit('dragend', $event)"
        @click.stop="$emit('collapse')"
      >drag_indicator</span>
      <span class="effect-item__badge">EFFET</span>
      <span class="effect-item__label">{{ label }}</span>
      <span class="material-icons effect-item__chevron">
        {{ expanded ? 'expand_less' : 'expand_more' }}
      </span>
      <span class="material-icons effect-item__delete" @click.stop="$emit('delete')">delete</span>
    </div>
    <div class="effect-item__body" :class="{ 'effect-item__body--expanded': expanded }">
      <div class="effect-item__body-inner">
        <slot />
      </div>
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
defineEmits(['toggle', 'delete', 'dragstart', 'dragend', 'collapse']);
</script>

<style scoped>
.effect-item {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6px;
}
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
.effect-item__handle {
  font-size: 16px;
  color: #8f9bb3;
  cursor: grab;
  flex-shrink: 0;
}
.effect-item__handle:active { cursor: grabbing; }
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
.effect-item__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s ease;
}
.effect-item__body--expanded {
  grid-template-rows: 1fr;
}
.effect-item__body-inner {
  overflow: hidden;
  padding: 0 10px;
  transition: padding 0.35s ease;
}
.effect-item__body--expanded .effect-item__body-inner {
  padding: 10px;
}
</style>