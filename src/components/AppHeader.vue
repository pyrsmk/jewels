<template>
  <div class="header">
    <h1>Jewels <span class="version">v{{ version }}</span></h1>
    <div class="spacer"></div>
    <button class="fullscreen" type="button" @click="$emit('toggleFullscreen')">
      {{ isFullscreen ? 'Quitter le plein écran' : 'Plein écran' }}
    </button>
    <div class="spacer"></div>
    <div class="fps">{{ fps }} FPS</div>
  </div>
</template>

<script setup>
defineProps({
  fps: { type: Number, default: 0 },
  isFullscreen: { type: Boolean, default: false },
});
defineEmits(['toggleFullscreen']);

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
.header h1 { margin: 0; font-size: 15px; }
.version { font-size: 11px; color: #8f9bb3; font-weight: normal; }
.spacer { flex: 1; }
.fullscreen { width: 125px; }
.fps { font-size: 12px; color: #8f9bb3; white-space: nowrap; }
</style>