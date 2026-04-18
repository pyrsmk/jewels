<template>
  <div class="header">
    <h1 class="title">Jewels <span class="version">{{ version }}</span></h1>
    <div class="spacer"></div>
    <div v-if="fps > 0" class="fps">{{ fps }} FPS</div>
    <div class="spacer"></div>
    <Button
      icon="ev_shadow_add"
      tooltip="Ajouter un source"
      @click="$emit('openAddSource')"
    />
    <Button
      icon="texture_add"
      tooltip="Ajouter un effet"
      @click="$emit('openAddEffect')"
    />
    <Button
      :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
      :tooltip="isFullscreen ? 'Quitter le plein écran' : 'Plein écran'"
      @click="$emit('toggleFullscreen')"
    />
  </div>
</template>

<script setup>
import Button from './Button.vue';

defineProps({
  fps: { type: Number, default: 0 },
  isFullscreen: { type: Boolean, default: false },
});
defineEmits(['toggleFullscreen', 'openAddEffect', 'openAddSource']);

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
.version { font-size: 10px; color: #8f9bb3; font-weight: normal; }
.spacer { flex: 1; }
.fps {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #6a8fff;
  background: rgba(80, 120, 255, 0.18);
  border-radius: 4px;
  padding: 2px 7px;
  white-space: nowrap;
}
:deep(.btn) { width: auto; }
</style>
