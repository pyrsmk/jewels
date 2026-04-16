<template>
  <OverlayModal @close="$emit('close')">
    <template #title>
      <span class="modal-title">Ajouter un effet</span>
    </template>
    <div class="effect-grid">
      <Button
        v-for="entry in effectRegistry"
        :key="entry.className"
        :label="entry.label"
        icon="add"
        size="xl"
        @click="$emit('add', entry.className)"
      />
    </div>
  </OverlayModal>
</template>

<script setup>
import OverlayModal from './OverlayModal.vue';
import Button from './Button.vue';

defineProps({ effectRegistry: { type: Array, required: true } });
defineEmits(['add', 'close']);
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