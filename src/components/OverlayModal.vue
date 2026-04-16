<template>
  <div class="overlay-backdrop" @click.self="$emit('close')">
    <div class="overlay-modal">
      <div v-if="title || $slots.title" class="overlay-modal__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: undefined },
});

defineEmits(['close']);
</script>

<style scoped>
.overlay-backdrop {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  z-index: 100;
}
.overlay-modal {
  background: #13141c;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;
  padding: 20px;
  min-width: 240px;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.overlay-modal__title {
  font-size: 12px;
  font-weight: 700;
  color: #8f9bb3;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
</style>