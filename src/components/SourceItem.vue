<template>
  <div class="source-item" :class="{ 'source-item--expanded': expanded }">
    <div class="source-item__header" @click="$emit('toggle')">
      <span
        v-if="isDraggable"
        class="material-symbols-outlined source-item__handle"
        :draggable="true"
        @dragstart.stop="$emit('dragstart', $event)"
        @dragend.stop="$emit('dragend', $event)"
        @mousedown.stop="$emit('collapse')"
      >drag_indicator</span>
      <span class="source-item__badge" :class="className === 'BackgroundSource' ? 'source-item__badge--root' : ''">
        {{ className === 'BackgroundSource' ? 'RACINE' : 'SOURCE' }}
      </span>
      <span class="source-item__label">{{ label }}</span>
      <span
        v-if="instance.options?._warn"
        class="material-symbols-outlined source-item__warn"
        title="Aucun fichier chargé"
      >warning</span>
      <span class="material-symbols-outlined source-item__chevron">
        {{ expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
      </span>
      <span
        v-if="isDeletable"
        class="material-symbols-outlined source-item__delete"
        @click.stop="$emit('delete')"
      >delete</span>
    </div>
    <div class="source-item__body" :class="{ 'source-item__body--expanded': expanded }">
      <div class="source-item__body-inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  instance: { type: Object, required: true },
  label: { type: String, required: true },
  className: { type: String, required: true },
  expanded: { type: Boolean, default: false },
  isDeletable: { type: Boolean, default: true },
  isDraggable: { type: Boolean, default: false },
});
defineEmits(['toggle', 'delete', 'dragstart', 'dragend', 'collapse']);
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
  background: rgba(160, 100, 255, 0.08);
}
.source-item__header:hover { background: rgba(160, 100, 255, 0.14); }
.source-item__badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #b07fff;
  background: rgba(160, 100, 255, 0.18);
  border-radius: 4px;
  padding: 2px 5px;
  flex-shrink: 0;
}
.source-item__badge--root {
  color: #ff6b6b;
  background: rgba(255, 80, 80, 0.18);
}
.source-item__label {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: #ddd;
}
.source-item__handle {
  font-size: 16px;
  color: #8f9bb3;
  cursor: grab;
  flex-shrink: 0;
}
.source-item__handle:active { cursor: grabbing; }
.source-item__chevron { font-size: 16px; color: #8f9bb3; }
.source-item__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s ease;
}
.source-item__body--expanded {
  grid-template-rows: 1fr;
}
.source-item__body-inner {
  overflow: hidden;
  padding: 0 10px;
  transition: padding 0.35s ease;
}
.source-item__body--expanded .source-item__body-inner {
  padding: 10px;
}
.source-item__warn {
  font-size: 16px;
  color: #f5a623;
  flex-shrink: 0;
}
.source-item__delete {
  font-size: 16px;
  color: #8f9bb3;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px;
}
.source-item__delete:hover { color: #ff6b6b; }
.source-item__body--expanded > * { padding: 10px; }
</style>
