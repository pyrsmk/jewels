import { reactive, ref, markRaw } from 'vue';
import { ModuleHost } from '../core/ModuleHost.js';
import { PipelineRuntime } from '../core/PipelineRuntime.js';
import { PostProcessor } from '../core/PostProcessor.js';
import { SettingsController } from '../core/SettingsController.js';
import { FrameLoopController } from '../core/FrameLoopController.js';
import { effectRegistry } from '../registry/effectRegistry.js';
import { sourceRegistry } from '../registry/sourceRegistry.js';

export async function useEngine(canvas) {
  const gl = canvas.getContext('webgl', {
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) throw new Error('WebGL non supporté');

  const state = reactive({
    width: 0, height: 0, dpr: 1,
    sceneA: null, sceneB: null, sceneTex: null, frameHistory: [],
  });

  const runtimeConfig = { frameHistoryLimit: 5, frameHistoryScale: 0.5 };

  const sources = ref([]);
  const effects = ref([]);
  const moduleHost = new ModuleHost({ sources: sources.value, effects: effects.value });

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

  function executeEffectStages(t) {
    const runtimeContext = { time: t, moduleHost, state };
    for (const effect of moduleHost.getEffects()) {
      effect.update({ ...runtimeContext });
    }
    postProcessor.render(t);
  }

  function renderFrame(t) {
    moduleHost.renderSources((extra = {}) => pipelineRuntime.buildPassContext({
      time: t,
      effects: moduleHost.getEffects(),
      ...extra,
    }));
    executeEffectStages(t);
  }

  async function addSource(className) {
    const entry = sourceRegistry.find((r) => r.className === className);
    if (!entry) throw new Error(`Source inconnue : ${className}`);
    if (moduleHost.sources.some((s) => s.constructor.name === className)) return;
    entry.componentLoader?.();
    const Cls = await entry.classLoader();
    const instance = markRaw(Cls.deserialize({}));
    moduleHost.addSource(instance);
    sources.value = [...moduleHost.sources];
    instance.setup(contextFactory({}));
    instance.resize(contextFactory({}));
    instance.reseedParticles?.();
    return instance;
  }

  async function addEffect(className) {
    const entry = effectRegistry.find((r) => r.className === className);
    if (!entry) throw new Error(`Effet inconnu : ${className}`);
    if (moduleHost.effects.some((e) => e.constructor.name === className)) return;
    entry.componentLoader?.();
    const Cls = await entry.classLoader();
    const instance = markRaw(Cls.deserialize({}));
    moduleHost.addEffect(instance);
    effects.value = [...moduleHost.effects];
    instance.setup(contextFactory({}));
    instance.resize(contextFactory({}));
    return instance;
  }

  function removeSource(instance) {
    moduleHost.removeSource(instance);
    sources.value = [...moduleHost.sources];
    pipelineRuntime.clearScene();
  }

  function removeEffect(instance) {
    moduleHost.removeEffect(instance);
    effects.value = [...moduleHost.effects];
  }

  function reorderEffects(newOrder) {
    moduleHost.reorderEffects(newOrder);
    effects.value = [...moduleHost.effects];
  }

  resize();

  const frameLoopController = new FrameLoopController({
    moduleHost,
    pipelineRuntime,
    onResize: resize,
    onRenderFrame: renderFrame,
  });

  return {
    gl,
    state,
    sources,
    effects,
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
    reorderEffects,
  };
}