<template>
  <div ref="wrapRef" class="canvas-wrap">
    <canvas ref="canvasRef"></canvas>
    <div class="canvas-overlay">
      <div v-if="!hasSource" class="canvas-add-source">
        <Button icon="add_circle" label="Ajouter une source" size="xxl" @click="onClickAddSource" />
      </div>
      <AddSourceMenu
        v-if="showAddSource"
        :source-registry="sourceRegistry"
        :has-source="hasSource"
        @add="onAddSource"
        @close="showAddSource = false"
      />
      <AddEffectMenu
        v-if="showAddEffect"
        :effect-registry="effectRegistry"
        @add="onAddEffect"
        @close="showAddEffect = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useEngine } from '../composables/useEngine.js';
import Button from './Button.vue';
import AddSourceMenu from './AddSourceMenu.vue';
import AddEffectMenu from './AddEffectMenu.vue';

const props = defineProps({
  hasSource: { type: Boolean, default: false },
  showAddEffect: { type: Boolean, default: false },
  sourceRegistry: { type: Array, default: () => [] },
  effectRegistry: { type: Array, default: () => [] },
});
const emit = defineEmits(['engineReady', 'fpsUpdate', 'fullscreenChange', 'addSource', 'addEffect', 'closeAddEffect']);

const wrapRef = ref(null);
const canvasRef = ref(null);
const showAddSource = ref(false);
let engine = null;
let resizeObserver = null;

onMounted(async () => {
  engine = await useEngine(canvasRef.value);
  emit('engineReady', engine);
  engine.frameLoopController.onFpsUpdate = (fps) => emit('fpsUpdate', fps);
  engine.frameLoopController.start();
  resizeObserver = new ResizeObserver(() => { engine.resize(); });
  resizeObserver.observe(wrapRef.value);
  document.addEventListener('fullscreenchange', onFullscreenChange);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  document.removeEventListener('fullscreenchange', onFullscreenChange);
});

function onFullscreenChange() {
  const isFs = document.fullscreenElement === wrapRef.value;
  emit('fullscreenChange', isFs);
  engine?.resize();
}

async function toggleFullscreen() {
  const wrap = wrapRef.value;
  try {
    if (document.fullscreenElement === wrap) {
      await document.exitFullscreen();
    } else {
      await wrap.requestFullscreen();
    }
  } catch (err) {
    console.warn('Impossible de basculer en plein écran:', err);
  }
}

function onClickAddSource() {
  showAddSource.value = true;
}

function onAddSource(className) {
  emit('addSource', className);
  showAddSource.value = false;
}

function onAddEffect(className) {
  emit('addEffect', className);
  emit('closeAddEffect');
}

defineExpose({ toggleFullscreen });
</script>

<style scoped>
.canvas-wrap {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.canvas-wrap:fullscreen {
  width: 100vw;
  height: 100vh;
  background: #050507;
  cursor: none;
}
.canvas-wrap:fullscreen canvas {
  width: 100%;
  height: 100%;
}
canvas { width: 100%; height: 100%; display: block; }
.canvas-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.canvas-overlay > * { pointer-events: auto; }
.canvas-add-source {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.canvas-add-source > * { pointer-events: auto; }
</style>