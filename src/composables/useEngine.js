import { reactive, ref, markRaw } from 'vue';
import { ModuleHost } from '../core/ModuleHost.js';
import { PipelineRuntime } from '../core/PipelineRuntime.js';
import { PostProcessor } from '../core/PostProcessor.js';
import { SettingsController } from '../core/SettingsController.js';
import { FrameLoopController } from '../core/FrameLoopController.js';
import { effectRegistry } from '../registry/effectRegistry.js';
import { sourceRegistry } from '../registry/sourceRegistry.js';

export async function useEngine(canvas) {
  const gl = canvas.getContext('webgl2', {
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) throw new Error('WebGL 2 non supporté');
  if (!gl.getExtension('EXT_color_buffer_float')) {
    console.warn('EXT_color_buffer_float non disponible, fallback RGBA8');
  }

  const state = reactive({
    width: 0, height: 0, dpr: 1,
    sceneA: null, sceneB: null, sceneTex: null, accumulator: null, frameHistory: [],
  });

  const runtimeConfig = { frameHistoryLimit: 5, frameHistoryScale: 0.5 };

  const items = ref([]);
  const moduleHost = new ModuleHost();

  const pipelineRuntime = new PipelineRuntime(canvas, gl, state, runtimeConfig, moduleHost);
  const settingsController = new SettingsController(moduleHost);
  const postProcessor = new PostProcessor({ moduleHost, pipelineRuntime });

  function contextFactory(extra = {}) {
    return pipelineRuntime.buildPassContext(extra);
  }

  function resize() {
    const rect = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.floor(rect.width * dpr));
    const h = Math.max(2, Math.floor(rect.height * dpr));
    if (w === state.width && h === state.height && dpr === state.dpr) return;
    pipelineRuntime.resizeTargets(w, h, dpr);
    moduleHost.resizeAllModules(contextFactory);
  }

  const _effectUpdateContext = { time: 0, moduleHost, state };
  function executeEffectStages(t) {
    _effectUpdateContext.time = t;
    for (const effect of moduleHost.getEffects()) {
      effect.update(_effectUpdateContext);
    }
    postProcessor.render(t);
  }

  function renderFrame(t) {
    executeEffectStages(t);
  }

  async function addSource(className, params = {}) {
    const entry = sourceRegistry.find((r) => r.className === className);
    if (!entry) throw new Error(`Source inconnu : ${className}`);
    if (className === 'BackgroundSource' && moduleHost.items.some((i) => i.type === 'source' && i.className === 'BackgroundSource')) return;
    entry.componentLoader?.();
    const Cls = await entry.classLoader();
    const instance = markRaw(Cls.deserialize(params));
    moduleHost.addSource(instance, undefined, className);
    items.value = [...moduleHost.items];
    instance.setup(contextFactory({}));
    instance.resize(contextFactory({}));
    instance.reseedPearls?.();
    return instance;
  }

  async function addEffect(className, position) {
    const entry = effectRegistry.find((r) => r.className === className);
    if (!entry) throw new Error(`Effet inconnu : ${className}`);
    entry.componentLoader?.();
    const Cls = await entry.classLoader();
    const instance = markRaw(Cls.deserialize({}));
    moduleHost.addEffect(instance, position ?? moduleHost.items.length, className);
    items.value = [...moduleHost.items];
    postProcessor.invalidateCache();
    instance.setup(contextFactory({}));
    instance.resize(contextFactory({}));
    return instance;
  }

  function removeSource(instance) {
    if (instance.constructor.name === 'BackgroundSource') return;
    moduleHost.removeSource(instance);
    items.value = [...moduleHost.items];
    pipelineRuntime.clearScene();
  }

  function removeEffect(instance) {
    moduleHost.removeEffect(instance);
    items.value = [...moduleHost.items];
    postProcessor.invalidateCache();
  }

  function toggleEffectEnabled(instance) {
    const item = moduleHost.items.find((i) => i.instance === instance);
    if (!item) return;
    item.enabled = item.enabled === false ? true : false;
    moduleHost._invalidate();
    items.value = [...moduleHost.items];
    postProcessor.invalidateCache();
  }

  function reorderItems(newItems) {
    moduleHost.reorderItems(newItems);
    items.value = [...moduleHost.items];
    postProcessor.invalidateCache();
  }

  async function restoreFromUrl() {
    try {
      const url = new URL(window.location.href);
      const encoded = url.searchParams.get('settings');
      if (!encoded) return;
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const settings = JSON.parse(decoded);
      if (!settings || typeof settings !== 'object') return;

      if (settings.v === 2 && Array.isArray(settings.items)) {
        for (const itemData of settings.items) {
          const isSource = itemData.type === 'source' || itemData.type === 'source';
          if (isSource && itemData.className === 'BackgroundSource') continue;
          if (isSource) {
            await addSource(itemData.className, itemData.params || {});
          } else if (itemData.type === 'effect') {
            await addEffect(itemData.className);
          }
        }
      } else {
        for (const reg of sourceRegistry) {
          if (reg.className === 'BackgroundSource') continue;
          const saved = settings[reg.className];
          if (!saved) continue;
          await addSource(reg.className, typeof saved === 'object' ? saved : {});
        }
        for (const reg of effectRegistry) {
          if (!settings[reg.className]) continue;
          await addEffect(reg.className);
        }
      }

      moduleHost.applySettings(settings);
      items.value = [...moduleHost.items];
    } catch (err) {
      console.warn(`Impossible de restaurer les paramètres depuis l'URL :`, err);
    }
  }

  resize();
  await addSource('BackgroundSource');
  await restoreFromUrl();

  const frameLoopController = new FrameLoopController({
    moduleHost,
    pipelineRuntime,
    onResize: resize,
    onRenderFrame: renderFrame,
  });

  return {
    gl,
    state,
    items,
    moduleHost,
    pipelineRuntime,
    frameLoopController,
    settingsController,
    resize,
    sourceRegistry,
    effectRegistry,
    addSource,
    removeSource,
    addEffect,
    removeEffect,
    reorderItems,
    toggleEffectEnabled,
  };
}
