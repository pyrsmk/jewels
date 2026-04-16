<template>
  <div class="header">
    <h1 class="title">Jewels <span class="version">v{{ version }}</span></h1>
    <div class="spacer"></div>
    <div class="fps">{{ fps }} FPS</div>
    <div class="spacer"></div>
    <Button
      icon="add"
      tooltip="Ajouter un effet"
      :disabled="!hasSource"
      @click="$emit('openAddEffect')"
    />
    <Button
      :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
      :tooltip="isFullscreen ? 'Quitter le plein écran' : 'Plein écran'"
      :disabled="!hasSource"
      @click="$emit('toggleFullscreen')"
    />
  </div>
</template>

<script setup>
import Button from './Button.vue';

defineProps({
  fps: { type: Number, default: 0 },
  isFullscreen: { type: Boolean, default: false },
  hasSource: { type: Boolean, default: false },
});
defineEmits(['toggleFullscreen', 'openAddEffect']);

const version = __APP_VERSION__;
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 0;
  margin-bottom: 10px;
}
.title {
  margin: 0;
  font-size: 15px;
  white-space: nowrap;
}
.version { font-size: 11px; color: #8f9bb3; font-weight: normal; }
.spacer { flex: 1; }
.fps { font-size: 12px; color: #8f9bb3; white-space: nowrap; }
:deep(.btn) { width: auto; }
</style>