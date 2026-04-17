<template>
  <div class="controls-wrap">
    <Header
      :fps="fps"
      :is-fullscreen="isFullscreen"
      @toggle-fullscreen="canvasViewRef?.toggleFullscreen()"
      @open-add-effect="showAddEffect = true"
      @open-add-objet="showAddObjet = true"
    />
    <ControlPanel
      v-if="engine"
      ref="controlPanelRef"
      :items="items"
      :source-registry="engine.sourceRegistry"
      :effect-registry="engine.effectRegistry"
      @settings-change="onSettingsChange"
      @reorder-items="onReorderItems"
      @delete-objet="onDeleteObjet"
      @delete-effect="onDeleteEffect"
    />
  </div>
  <CanvasView
    ref="canvasViewRef"
    @engine-ready="onEngineReady"
    @fps-update="fps = $event"
    @fullscreen-change="isFullscreen = $event"
  />
  <Transition name="overlay">
    <AddSourceMenu
      v-if="showAddObjet"
      :source-registry="engine?.sourceRegistry ?? []"
      :active-source-names="items.filter(i => i.type === 'objet').map(i => i.instance.constructor.name)"
      @add="onAddObjet"
      @close="showAddObjet = false"
    />
  </Transition>
  <Transition name="overlay">
    <AddEffectMenu
      v-if="showAddEffect"
      :effect-registry="engine?.effectRegistry ?? []"
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
const controlPanelRef = ref(null);
const fps = ref(0);
const isFullscreen = ref(false);
const engine = shallowRef(null);
const showAddObjet = ref(false);
const showAddEffect = ref(false);

const items = computed(() => engine.value?.items.value ?? []);

function onEngineReady(eng) {
  engine.value = eng;
}

async function onAddObjet(className) {
  if (!engine.value) return;
  const instance = await engine.value.addObjet(className);
  showAddObjet.value = false;
  if (instance) controlPanelRef.value?.expandItem(instance);
}

async function onAddEffect(className) {
  if (!engine.value) return;
  const insertIndex = controlPanelRef.value?.getEffectInsertIndex() ?? items.value.length;
  const instance = await engine.value.addEffect(className, insertIndex);
  showAddEffect.value = false;
  if (instance) controlPanelRef.value?.expandItem(instance);
}

function onReorderItems(newOrder) {
  engine.value?.reorderItems(newOrder);
}

function onDeleteEffect(instance) {
  engine.value?.removeEffect(instance);
}

function onDeleteObjet(instance) {
  engine.value?.removeObjet(instance);
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
