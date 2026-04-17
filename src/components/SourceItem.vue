<template>
  <div class="objet-item" :class="{ 'objet-item--expanded': expanded }">
    <div class="objet-item__header" @click="$emit('toggle')">
      <span
        v-if="isDraggable"
        class="material-symbols-outlined objet-item__handle"
        :draggable="true"
        @dragstart.stop="$emit('dragstart', $event)"
        @dragend.stop="$emit('dragend', $event)"
        @mousedown.stop="$emit('collapse')"
      >drag_indicator</span>
      <span class="objet-item__badge">OBJET</span>
      <span class="objet-item__label">{{ label }}</span>
      <span class="material-symbols-outlined objet-item__chevron">
        {{ expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
      </span>
      <span
        v-if="isDeletable"
        class="material-symbols-outlined objet-item__delete"
        @click.stop="$emit('delete')"
      >delete</span>
    </div>
    <div class="objet-item__body" :class="{ 'objet-item__body--expanded': expanded }">
      <div class="objet-item__body-inner">
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
  isDeletable: { type: Boolean, default: true },
  isDraggable: { type: Boolean, default: false },
});
defineEmits(['toggle', 'delete', 'dragstart', 'dragend', 'collapse']);
</script>

<style scoped>
.objet-item {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6px;
}
.objet-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  user-select: none;
  background: rgba(160, 100, 255, 0.08);
}
.objet-item__header:hover { background: rgba(160, 100, 255, 0.14); }
.objet-item__badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #b07fff;
  background: rgba(160, 100, 255, 0.18);
  border-radius: 4px;
  padding: 2px 5px;
  flex-shrink: 0;
}
.objet-item__label {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: #ddd;
}
.objet-item__handle {
  font-size: 16px;
  color: #8f9bb3;
  cursor: grab;
  flex-shrink: 0;
}
.objet-item__handle:active { cursor: grabbing; }
.objet-item__chevron { font-size: 16px; color: #8f9bb3; }
.objet-item__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s ease;
}
.objet-item__body--expanded {
  grid-template-rows: 1fr;
}
.objet-item__body-inner {
  overflow: hidden;
  padding: 0 10px;
  transition: padding 0.35s ease;
}
.objet-item__body--expanded .objet-item__body-inner {
  padding: 10px;
}
.objet-item__delete {
  font-size: 16px;
  color: #8f9bb3;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px;
}
.objet-item__delete:hover { color: #ff6b6b; }
.objet-item__body--expanded > * { padding: 10px; }
</style>
