import { reactive, markRaw } from 'vue';
import { ModuleHost } from '../core/ModuleHost.js';
import { PipelineRuntime } from '../core/PipelineRuntime.js';
import { PostProcessor } from '../core/PostProcessor.js';
import { SettingsController } from '../core/SettingsController.js';
import { FrameLoopController } from '../core/FrameLoopController.js';
import { effectRegistry } from '../registry/effectRegistry.js';
import { subjectRegistry } from '../registry/subjectRegistry.js';

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

  const [subjectClasses, effectClasses] = await Promise.all([
    Promise.all(subjectRegistry.map((r) => r.classLoader())),
    Promise.all(effectRegistry.map((r) => r.classLoader())),
  ]);

  const subjects = subjectClasses.map((Cls) => markRaw(Cls.deserialize({})));
  const effects = effectClasses.map((Cls) => markRaw(Cls.deserialize({})));

  const moduleHost = new ModuleHost({ subjects, effects });

  const pipelineRuntime = new PipelineRuntime(canvas, gl, state, runtimeConfig, moduleHost);

  const colorTintEffect = moduleHost.findEffectByClassName('ColorTintEffect');
  const settingsController = new SettingsController(moduleHost);
  const postProcessor = new PostProcessor({ moduleHost, pipelineRuntime });
  const particleSubject = moduleHost.getSubjects()[0];

  function setupAllModules() {
    moduleHost.setupAllModules((extra = {}) => pipelineRuntime.buildPassContext(extra));
  }

  function resizeAllModules() {
    moduleHost.resizeAllModules((extra = {}) => pipelineRuntime.buildPassContext(extra));
  }

  function resize() {
    const rect = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.floor(rect.width * dpr));
    const h = Math.max(2, Math.floor(rect.height * dpr));
    if (w === state.width && h === state.height && dpr === state.dpr) return;
    pipelineRuntime.resizeTargets(w, h, dpr);
    resizeAllModules();
    particleSubject.reseedParticles();
  }

  function executeEffectStages(t) {
    const runtimeContext = { time: t, moduleHost, state };
    for (const effect of moduleHost.getEffects()) {
      effect.update({ ...runtimeContext });
    }
    postProcessor.render(t);
  }

  function renderFrame(t) {
    moduleHost.renderSubjects((extra = {}) => pipelineRuntime.buildPassContext({
      time: t,
      effects: moduleHost.getEffects(),
      ...extra,
    }));
    executeEffectStages(t);
  }

  function loadSettings() {
    settingsController.loadFromUrl();
  }

  function persistSettings() {
    settingsController.persistToUrl();
  }

  function bindPersistence() {
    const persist = () => {
      const t = performance.now() * 0.001;
      moduleHost.getEffects().forEach((e) => e.onSettingsChanged(t));
      persistSettings();
    };
    settingsController.bindPersistence(persist);
  }

  setupAllModules();
  resize();
  colorTintEffect?.rebuildAccentCache();

  loadSettings();
  bindPersistence();
  persistSettings();

  const frameLoopController = new FrameLoopController({
    moduleHost,
    pipelineRuntime,
    onResize: resize,
    onRenderFrame: renderFrame,
  });

  return {
    gl,
    state,
    moduleHost,
    pipelineRuntime,
    colorTintEffect,
    particleSubject,
    frameLoopController,
    settingsController,
    resize,
    subjectRegistry,
    effectRegistry,
    subjects,
    effects,
  };
}