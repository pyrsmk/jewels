import { defineAsyncComponent } from 'vue';

export const effectRegistry = [
  {
    className: 'ChromaticAberrationEffect',
    classLoader: () => import('../effects/ChromaticAberrationEffect.js')
      .then((m) => m.ChromaticAberrationEffect),
    component: defineAsyncComponent(
      () => import('../components/effects/ChromaticAberrationEffect.vue')
    ),
  },
  {
    className: 'GlowEffect',
    classLoader: () => import('../effects/GlowEffect.js').then((m) => m.GlowEffect),
    component: defineAsyncComponent(() => import('../components/effects/GlowEffect.vue')),
  },
  {
    className: 'DreamyGlowEffect',
    classLoader: () => import('../effects/DreamyGlowEffect.js').then((m) => m.DreamyGlowEffect),
    component: defineAsyncComponent(() => import('../components/effects/DreamyGlowEffect.vue')),
  },
  {
    className: 'LensFlareEffect',
    classLoader: () => import('../effects/LensFlareEffect.js').then((m) => m.LensFlareEffect),
    component: defineAsyncComponent(() => import('../components/effects/LensFlareEffect.vue')),
  },
  {
    className: 'ColorTintEffect',
    classLoader: () => import('../effects/ColorTintEffect.js').then((m) => m.ColorTintEffect),
    component: defineAsyncComponent(() => import('../components/effects/ColorTintEffect.vue')),
  },
  {
    className: 'GrainEffect',
    classLoader: () => import('../effects/GrainEffect.js').then((m) => m.GrainEffect),
    component: defineAsyncComponent(() => import('../components/effects/GrainEffect.vue')),
  },
  {
    className: 'ChromaticNoiseEffect',
    classLoader: () => import('../effects/ChromaticNoiseEffect.js')
      .then((m) => m.ChromaticNoiseEffect),
    component: defineAsyncComponent(
      () => import('../components/effects/ChromaticNoiseEffect.vue')
    ),
  },
  {
    className: 'ColorShimmerEffect',
    classLoader: () => import('../effects/ColorShimmerEffect.js')
      .then((m) => m.ColorShimmerEffect),
    component: defineAsyncComponent(
      () => import('../components/effects/ColorShimmerEffect.vue')
    ),
  },
  {
    className: 'RGBSplitEffect',
    classLoader: () => import('../effects/RGBSplitEffect.js').then((m) => m.RGBSplitEffect),
    component: defineAsyncComponent(() => import('../components/effects/RGBSplitEffect.vue')),
  },
  {
    className: 'PixelSortEffect',
    classLoader: () => import('../effects/PixelSortEffect.js').then((m) => m.PixelSortEffect),
    component: defineAsyncComponent(() => import('../components/effects/PixelSortEffect.vue')),
  },
  {
    className: 'TemporalGhostEffect',
    classLoader: () => import('../effects/TemporalGhostEffect.js')
      .then((m) => m.TemporalGhostEffect),
    component: defineAsyncComponent(
      () => import('../components/effects/TemporalGhostEffect.vue')
    ),
  },
  {
    className: 'TemporalGhost2Effect',
    classLoader: () => import('../effects/TemporalGhost2Effect.js')
      .then((m) => m.TemporalGhost2Effect),
    component: defineAsyncComponent(
      () => import('../components/effects/TemporalGhost2Effect.vue')
    ),
  },
  {
    className: 'BlockGlitchEffect',
    classLoader: () => import('../effects/BlockGlitchEffect.js').then((m) => m.BlockGlitchEffect),
    component: defineAsyncComponent(
      () => import('../components/effects/BlockGlitchEffect.vue')
    ),
  },
  {
    className: 'BlockGlitch2Effect',
    classLoader: () => import('../effects/BlockGlitch2Effect.js')
      .then((m) => m.BlockGlitch2Effect),
    component: defineAsyncComponent(
      () => import('../components/effects/BlockGlitch2Effect.vue')
    ),
  },
  {
    className: 'BlockGlitch3Effect',
    classLoader: () => import('../effects/BlockGlitch3Effect.js')
      .then((m) => m.BlockGlitch3Effect),
    component: defineAsyncComponent(
      () => import('../components/effects/BlockGlitch3Effect.vue')
    ),
  },
  {
    className: 'CRTEffect',
    classLoader: () => import('../effects/CRTEffect.js').then((m) => m.CRTEffect),
    component: defineAsyncComponent(() => import('../components/effects/CRTEffect.vue')),
  },
];