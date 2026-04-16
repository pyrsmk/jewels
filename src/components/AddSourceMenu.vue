<template>
  <OverlayModal @close="$emit('close')">
    <template #title>
      <span class="modal-title">Ajouter une source</span>
    </template>
    <p v-if="hasSource" class="add-source-menu__info">
      Une source est déjà active.
    </p>
    <div v-else class="source-grid">
      <Button
        v-for="entry in sourceRegistry"
        :key="entry.className"
        :label="entry.label"
        icon="ev_shadow"
        size="xl"
        @click="$emit('add', entry.className)"
      />
    </div>
  </OverlayModal>
</template>

<script setup>
import OverlayModal from './OverlayModal.vue';
import Button from './Button.vue';

defineProps({
  sourceRegistry: { type: Array, required: true },
  hasSource: { type: Boolean, default: false },
});
defineEmits(['add', 'close']);
</script>

<style scoped>
.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #ddd;
}
.add-source-menu__info { margin: 0; color: #8f9bb3; font-size: 12px; }
.source-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 8px;
}
</style>
