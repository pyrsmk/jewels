<template>
  <div class="controls-wrap">
    <Header
      :fps="fps"
      :is-fullscreen="isFullscreen"
      :has-source="hasSource"
      @toggle-fullscreen="canvasViewRef?.toggleFullscreen()"
      @open-add-effect="showAddEffect = true"
    />
    <ControlPanel
      v-if="engine"
      :sources="sources"
      :effects="effects"
      :source-registry="engine.sourceRegistry"
      :effect-registry="engine.effectRegistry"
      @settings-change="onSettingsChange"
      @reorder-effects="onReorderEffects"
    />
  </div>
  <CanvasView
    ref="canvasViewRef"
    :has-source="hasSource"
    :show-add-effect="showAddEffect"
    :source-registry="engine?.sourceRegistry ?? []"
    :effect-registry="engine?.effectRegistry ?? []"
    @engine-ready="onEngineReady"
    @fps-update="fps = $event"
    @fullscreen-change="isFullscreen = $event"
    @add-source="onAddSource"
    @add-effect="onAddEffect"
    @close-add-effect="showAddEffect = false"
  />
</template>

<script setup>
import { ref, shallowRef, computed } from 'vue';
import Header from './components/Header.vue';
import CanvasView from './components/CanvasView.vue';
import ControlPanel from './components/ControlPanel.vue';

const canvasViewRef = ref(null);
const fps = ref(0);
const isFullscreen = ref(false);
const engine = shallowRef(null);
const showAddEffect = ref(false);

const sources = computed(() => engine.value?.sources.value ?? []);
const effects = computed(() => engine.value?.effects.value ?? []);
const hasSource = computed(() => sources.value.length > 0);

function onEngineReady(eng) {
  engine.value = eng;
}

async function onAddSource(className) {
  if (!engine.value) return;
  await engine.value.addSource(className);
}

async function onAddEffect(className) {
  if (!engine.value) return;
  await engine.value.addEffect(className);
}

function onReorderEffects(newOrder) {
  engine.value?.reorderEffects(newOrder);
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