<template>
  <OverlayModal @close="$emit('close')">
    <template #title>
      <span class="modal-title">Ajouter un objet</span>
    </template>
    <div class="source-grid">
      <Button
        v-for="entry in sourceRegistry"
        :key="entry.className"
        :label="entry.label"
        icon="ev_shadow"
        size="xl"
        :disabled="entry.className === 'BackgroundSource'"
        @click="entry.className !== 'BackgroundSource' && $emit('add', entry.className)"
      />
    </div>
  </OverlayModal>
</template>

<script setup>
import OverlayModal from './OverlayModal.vue';
import Button from './Button.vue';

defineProps({
  sourceRegistry: { type: Array, required: true },
  activeSourceNames: { type: Array, default: () => [] },
});
defineEmits(['add', 'close']);
</script>

<style scoped>
.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #ddd;
}
.source-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 8px;
}
</style>
