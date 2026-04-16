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
      @delete-source="onDeleteSource"
      @delete-effect="onDeleteEffect"
    />
  </div>
  <CanvasView
    ref="canvasViewRef"
    :has-source="hasSource"
    @engine-ready="onEngineReady"
    @fps-update="fps = $event"
    @fullscreen-change="isFullscreen = $event"
    @open-add-source="showAddSource = true"
  />
  <Transition name="overlay">
    <AddSourceMenu
      v-if="showAddSource"
      :source-registry="engine?.sourceRegistry ?? []"
      :has-source="hasSource"
      @add="onAddSource"
      @close="showAddSource = false"
    />
  </Transition>
  <Transition name="overlay">
    <AddEffectMenu
      v-if="showAddEffect"
      :effect-registry="engine?.effectRegistry ?? []"
      :active-class-names="effects.map(e => e.constructor.name)"
      @add="onAddEffect"
      @close="showAddEffect = false"
    />
  </Transition>
</template>

<script setup>
import { ref, shallowRef, computed } from 'vue';
import Header from './components/Header.vue';
import CanvasView from './components/CanvasView.vue';
import ControlPanel from './components/ControlPanel.vue';
import AddSourceMenu from './components/AddSourceMenu.vue';
import AddEffectMenu from './components/AddEffectMenu.vue';

const canvasViewRef = ref(null);
const fps = ref(0);
const isFullscreen = ref(false);
const engine = shallowRef(null);
const showAddSource = ref(false);
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
  showAddSource.value = false;
}

async function onAddEffect(className) {
  if (!engine.value) return;
  await engine.value.addEffect(className);
  showAddEffect.value = false;
}

function onReorderEffects(newOrder) {
  engine.value?.reorderEffects(newOrder);
}

function onDeleteEffect(instance) {
  engine.value?.removeEffect(instance);
}

function onDeleteSource(instance) {
  if (!engine.value) return;
  engine.value.removeSource(instance);
  [...engine.value.effects.value].forEach((e) => engine.value.removeEffect(e));
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
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>