<template>
  <div class="controls">
    <component
      v-for="(entry, i) in subjectEntries"
      :key="'subject-' + i"
      :is="entry.component"
      :instance="entry.instance"
    />
    <component
      v-for="(entry, i) in effectEntries"
      :key="'effect-' + i"
      :is="entry.component"
      :instance="entry.instance"
    />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';

const props = defineProps({
  subjects: { type: Array, default: () => [] },
  effects: { type: Array, default: () => [] },
  subjectRegistry: { type: Array, default: () => [] },
  effectRegistry: { type: Array, default: () => [] },
});

const emit = defineEmits(['settings-change']);

watch(
  () => [
    ...props.subjects.map((s) => s.options),
    ...props.effects.map((e) => e.options),
  ],
  () => emit('settings-change'),
  { deep: true },
);

const subjectEntries = computed(() =>
  props.subjects
    .map((instance) => {
      const reg = props.subjectRegistry.find((r) => r.className === instance.constructor.name);
      return { instance, component: reg?.component };
    })
    .filter((e) => e.component)
);

const effectEntries = computed(() =>
  props.effects
    .map((instance) => {
      const reg = props.effectRegistry.find((r) => r.className === instance.constructor.name);
      return { instance, component: reg?.component };
    })
    .filter((e) => e.component)
);
</script>

<style scoped>
.controls {
  overflow: auto;
  min-height: 0;
  padding: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(18, 18, 24, 0.95), rgba(10, 10, 14, 0.95));
}
</style>