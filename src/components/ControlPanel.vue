<template>
  <div class="controls">
    <SourceItem
      v-for="(entry, i) in sourceEntries"
      :key="'source-' + i"
      :instance="entry.instance"
      :label="entry.label"
      :expanded="expandedId === 'source-' + i"
      @toggle="toggleExpanded('source-' + i)"
      @delete="$emit('delete-source', entry.instance)"
    >
      <component :is="entry.component" :instance="entry.instance" />
    </SourceItem>
    <div class="effects-list" @dragover.prevent="onDragOverList" @drop.prevent="onDrop" @dragleave="onDragLeaveList">
      <template v-for="(entry, i) in effectEntries" :key="'effect-' + i">
        <div v-if="dropLineIndex === i" class="drop-line" />
        <EffectItem
          :instance="entry.instance"
          :label="entry.label"
          :expanded="expandedId === 'effect-' + i"
          :draggable="true"
          @toggle="toggleExpanded('effect-' + i)"
          @delete="$emit('delete-effect', entry.instance)"
          @collapse="expandedId = null"
          @dragstart="onDragStart(i, $event)"
          @dragend="onDragEnd"
        >
          <component :is="entry.component" :instance="entry.instance" />
        </EffectItem>
      </template>
      <div v-if="dropLineIndex === effectEntries.length" class="drop-line" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import SourceItem from './SourceItem.vue';
import EffectItem from './EffectItem.vue';

const props = defineProps({
  sources: { type: Array, default: () => [] },
  effects: { type: Array, default: () => [] },
  sourceRegistry: { type: Array, default: () => [] },
  effectRegistry: { type: Array, default: () => [] },
});
const emit = defineEmits(['settings-change', 'reorder-effects', 'delete-source', 'delete-effect']);

const expandedId = ref(null);
const dragIndex = ref(null);
const dropLineIndex = ref(null);

watch(
  () => [...props.sources.map((s) => s.options), ...props.effects.map((e) => e.options)],
  () => emit('settings-change'),
  { deep: true },
);

function toggleExpanded(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

const sourceEntries = computed(() =>
  props.sources
    .map((instance) => {
      const reg = props.sourceRegistry.find((r) => r.className === instance.constructor.name);
      return reg ? { instance, label: reg.label, component: reg.component } : null;
    })
    .filter(Boolean)
);

const effectEntries = computed(() =>
  props.effects
    .map((instance) => {
      const reg = props.effectRegistry.find((r) => r.className === instance.constructor.name);
      return reg ? { instance, label: reg.label, component: reg.component } : null;
    })
    .filter(Boolean)
);

function onDragStart(index, event) {
  dragIndex.value = index;
  event.dataTransfer.effectAllowed = 'move';
}

function onDragEnd() {
  dragIndex.value = null;
  dropLineIndex.value = null;
}

function onDragOverList(event) {
  if (dragIndex.value === null) return;
  const list = event.currentTarget;
  const items = [...list.querySelectorAll('.effect-item')];
  if (items.length === 0) {
    dropLineIndex.value = 0;
    return;
  }
  let index = items.length;
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (event.clientY < mid) {
      index = i;
      break;
    }
  }
  dropLineIndex.value = index;
}

function onDragLeaveList(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    dropLineIndex.value = null;
  }
}

function onDrop() {
  if (dragIndex.value === null || dropLineIndex.value === null) return;
  const from = dragIndex.value;
  let to = dropLineIndex.value;
  if (to === from || to === from + 1) {
    dragIndex.value = null;
    dropLineIndex.value = null;
    return;
  }
  const newOrder = [...props.effects];
  const [moved] = newOrder.splice(from, 1);
  const insertAt = to > from ? to - 1 : to;
  newOrder.splice(insertAt, 0, moved);
  emit('reorder-effects', newOrder);
  dragIndex.value = null;
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
.effects-list { display: flex; flex-direction: column; gap: 6px; }
.effects-list :deep(.effect-item) { margin-bottom: 0; }
.drop-line {
  height: 1px;
  background: #fff;
  border-radius: 1px;
  margin: 0;
  flex-shrink: 0;
}
</style>