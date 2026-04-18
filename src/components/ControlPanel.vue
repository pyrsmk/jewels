<template>
  <div class="controls" ref="controlsEl">
    <div
      class="items-list"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
      @dragleave="onDragLeave"
    >
      <template v-for="(item, i) in panelItems" :key="item.instance">
        <div v-if="dropLineIndex === i" class="drop-line" />
        <SourceItem
          v-if="item.type === 'source'"
          :instance="item.instance"
          :label="item.label"
          :is-deletable="item.isDeletable"
          :is-draggable="item.isDeletable"
          :expanded="expandedInstance === item.instance"
          @toggle="toggleExpanded(item.instance)"
          @delete="$emit('delete-source', item.instance)"
          @dragstart="onDragStart(i, 'source', $event)"
          @dragend="onDragEnd"
          @collapse="expandedInstance = null"
        >
          <component :is="item.component" :instance="item.instance" />
        </SourceItem>
        <EffectItem
          v-else
          :instance="item.instance"
          :label="item.label"
          :expanded="expandedInstance === item.instance"
          :enabled="item.enabled !== false"
          :draggable="true"
          @toggle="toggleExpanded(item.instance)"
          @delete="$emit('delete-effect', item.instance)"
          @toggle-enabled="$emit('toggle-effect-enabled', item.instance)"
          @collapse="expandedInstance = null"
          @dragstart="onDragStart(i, 'effect', $event)"
          @dragend="onDragEnd"
        >
          <component :is="item.component" :instance="item.instance" />
        </EffectItem>
      </template>
      <div v-if="dropLineIndex === panelItems.length" class="drop-line" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import SourceItem from './SourceItem.vue';
import EffectItem from './EffectItem.vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  sourceRegistry: { type: Array, default: () => [] },
  effectRegistry: { type: Array, default: () => [] },
});
const emit = defineEmits(['settings-change', 'reorder-items', 'delete-source', 'delete-effect', 'toggle-effect-enabled']);

const controlsEl = ref(null);
const expandedInstance = ref(null);
const dragIndex = ref(null);
const dragType = ref(null);
const dropLineIndex = ref(null);

watch(
  () => props.items.map((item) => item.instance.options),
  () => emit('settings-change'),
  { deep: true },
);

function onDocumentMousedown(event) {
  if (expandedInstance.value && controlsEl.value && !controlsEl.value.contains(event.target)) {
    expandedInstance.value = null;
  }
}

onMounted(() => document.addEventListener('mousedown', onDocumentMousedown));
onUnmounted(() => document.removeEventListener('mousedown', onDocumentMousedown));

function toggleExpanded(instance) {
  expandedInstance.value = expandedInstance.value === instance ? null : instance;
}

function expandItem(instance) {
  expandedInstance.value = instance;
}

function getEffectInsertIndex() {
  if (!expandedInstance.value) return props.items.length;
  const idx = props.items.findIndex((i) => i.instance === expandedInstance.value);
  if (idx < 0) return props.items.length;
  for (let i = idx + 1; i < props.items.length; i++) {
    if (props.items[i].type === 'source') return i;
  }
  return props.items.length;
}

defineExpose({ expandItem, getEffectInsertIndex });

const panelItems = computed(() =>
  props.items
    .map((item) => {
      if (item.type === 'source') {
        const reg = props.sourceRegistry.find((r) => r.className === item.instance.constructor.name);
        return reg ? { ...item, label: reg.label, component: reg.component, isDeletable: reg.isDeletable ?? true } : null;
      } else {
        const reg = props.effectRegistry.find((r) => r.className === item.instance.constructor.name);
        return reg ? { ...item, label: reg.label, component: reg.component } : null;
      }
    })
    .filter(Boolean)
);

function onDragStart(index, type, event) {
  dragIndex.value = index;
  dragType.value = type;
  event.dataTransfer.effectAllowed = 'move';
}

function onDragEnd() {
  dragIndex.value = null;
  dragType.value = null;
  dropLineIndex.value = null;
}

function getSourceGroupEnd(idx) {
  let end = idx + 1;
  while (end < panelItems.value.length && panelItems.value[end].type === 'effect') end++;
  return end;
}

function onDragOver(event) {
  if (dragIndex.value === null) return;
  const list = event.currentTarget;
  const allItems = [...list.querySelectorAll('.effect-item, .source-item')];

  if (dragType.value === 'source') {
    const groupEnd = getSourceGroupEnd(dragIndex.value);
    const noOp = new Set([dragIndex.value, groupEnd]);
    const validPositions = panelItems.value
      .map((item, i) => ({ item, i }))
      .filter(({ item, i }) => item.type === 'source' && item.isDeletable !== false && !noOp.has(i))
      .map(({ i }) => i);
    if (!noOp.has(panelItems.value.length)) validPositions.push(panelItems.value.length);
    if (validPositions.length === 0) return;

    let chosen = validPositions[validPositions.length - 1];
    for (const pos of validPositions) {
      if (pos >= allItems.length) break;
      const rect = allItems[pos].getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) { chosen = pos; break; }
    }
    dropLineIndex.value = chosen;
    return;
  }

  if (allItems.length === 0) { dropLineIndex.value = 0; return; }
  let index = allItems.length;
  for (let i = 0; i < allItems.length; i++) {
    const rect = allItems[i].getBoundingClientRect();
    if (event.clientY < rect.top + rect.height / 2) { index = i; break; }
  }
  dropLineIndex.value = index;
}

function onDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    dropLineIndex.value = null;
  }
}

function onDrop() {
  if (dragIndex.value === null || dropLineIndex.value === null) return;

  if (dragType.value === 'source') {
    const groupStart = dragIndex.value;
    const groupEnd = getSourceGroupEnd(groupStart);
    const groupSize = groupEnd - groupStart;
    const to = dropLineIndex.value;
    const newOrder = [...props.items];
    const group = newOrder.splice(groupStart, groupSize);
    const insertAt = to > groupStart ? to - groupSize : to;
    newOrder.splice(insertAt, 0, ...group);
    emit('reorder-items', newOrder);
  } else {
    const from = dragIndex.value;
    const to = dropLineIndex.value;
    if (to !== from && to !== from + 1) {
      const newOrder = [...props.items];
      const [moved] = newOrder.splice(from, 1);
      const insertAt = to > from ? to - 1 : to;
      newOrder.splice(insertAt, 0, moved);
      emit('reorder-items', newOrder);
    }
  }

  dragIndex.value = null;
  dragType.value = null;
  dropLineIndex.value = null;
}
</script>

<style scoped>
.controls {
  overflow: auto;
  min-height: 0;
  padding: 12px;
  background: linear-gradient(180deg, rgba(18, 18, 24, 0.95), rgba(10, 10, 14, 0.95));
}
.items-list { display: flex; flex-direction: column; gap: 6px; }
.items-list :deep(.effect-item),
.items-list :deep(.source-item) { margin-bottom: 0; }
.drop-line {
  height: 1px;
  background: #fff;
  border-radius: 1px;
  margin: 0;
  flex-shrink: 0;
}
</style>
