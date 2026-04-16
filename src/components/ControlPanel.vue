<template>
  <div class="controls">
    <SourceItem
      v-for="(entry, i) in sourceEntries"
      :key="'source-' + i"
      :instance="entry.instance"
      :label="entry.label"
      :expanded="expandedId === 'source-' + i"
      @toggle="toggleExpanded('source-' + i)"
    >
      <component :is="entry.component" :instance="entry.instance" />
    </SourceItem>
    <div
      class="effects-list"
      @drop.prevent="onDrop"
      @dragover.prevent
    >
      <EffectItem
        v-for="(entry, i) in effectEntries"
        :key="'effect-' + i"
        :instance="entry.instance"
        :label="entry.label"
        :expanded="expandedId === 'effect-' + i"
        :draggable="expandedId === null"
        @toggle="toggleExpanded('effect-' + i)"
        @dragstart="onDragStart(i)"
        @dragend="onDragEnd"
        @dragover="onDragOver(i)"
      >
        <component :is="entry.component" :instance="entry.instance" />
      </EffectItem>
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
const emit = defineEmits(['settings-change', 'reorder-effects']);

const expandedId = ref(null);
const dragIndex = ref(null);
const dragOverIndex = ref(null);

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

function onDragStart(index) {
  dragIndex.value = index;
}

function onDragOver(index) {
  dragOverIndex.value = index;
}

function onDragEnd() {
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function onDrop() {
  if (dragIndex.value === null || dragOverIndex.value === null) return;
  if (dragIndex.value === dragOverIndex.value) return;
  const newOrder = [...props.effects];
  const [moved] = newOrder.splice(dragIndex.value, 1);
  newOrder.splice(dragOverIndex.value, 0, moved);
  emit('reorder-effects', newOrder);
  dragIndex.value = null;
  dragOverIndex.value = null;
}
</script>

<style scoped>
.controls {
  overflow: auto;
  min-height: 0;
  padding: 12px;
  background: linear-gradient(180deg, rgba(18, 18, 24, 0.95), rgba(10, 10, 14, 0.95));
}
.effects-list { display: flex; flex-direction: column; }
</style>