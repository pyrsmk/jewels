<template>
  <OverlayModal @close="$emit('close')">
    <template #title>
      <span class="modal-title">Ajouter un effet</span>
    </template>
    <div class="effect-grid">
      <Button
        v-for="entry in sortedRegistry"
        :key="entry.className"
        :label="entry.label"
        icon="add"
        size="xl"
        :disabled="activeClassNames.includes(entry.className)"
        @click="$emit('add', entry.className)"
      />
    </div>
  </OverlayModal>
</template>

<script setup>
import { computed } from 'vue';
import OverlayModal from './OverlayModal.vue';
import Button from './Button.vue';

const props = defineProps({
  effectRegistry: { type: Array, required: true },
  activeClassNames: { type: Array, default: () => [] },
});
defineEmits(['add', 'close']);

const sortedRegistry = computed(() =>
  [...props.effectRegistry].sort((a, b) => a.label.localeCompare(b.label, 'fr'))
);
</script>

<style scoped>
.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #ddd;
}
.effect-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 8px;
}
</style>