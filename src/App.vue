<template>
  <div class="controls-wrap">
    <AppHeader
      :fps="fps"
      :is-fullscreen="isFullscreen"
      @toggle-fullscreen="canvasViewRef?.toggleFullscreen()"
    />
    <ControlPanel
      v-if="engine"
      :sources="engine.sources"
      :effects="engine.effects"
      :source-registry="engine.sourceRegistry"
      :effect-registry="engine.effectRegistry"
      @settings-change="onSettingsChange"
    />
  </div>
  <CanvasView
    ref="canvasViewRef"
    @engine-ready="onEngineReady"
    @fps-update="fps = $event"
    @fullscreen-change="isFullscreen = $event"
  />
</template>

<script setup>
import { ref, shallowRef } from 'vue';
import AppHeader from './components/AppHeader.vue';
import CanvasView from './components/CanvasView.vue';
import ControlPanel from './components/ControlPanel.vue';

const canvasViewRef = ref(null);
const fps = ref(0);
const isFullscreen = ref(false);
const engine = shallowRef(null);

function onEngineReady(eng) {
  engine.value = eng;
}

function onSettingsChange() {
  engine.value?.settingsController.persistToUrl();
}
</script>

<style>
@import './style.css';

.controls-wrap {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}
</style>