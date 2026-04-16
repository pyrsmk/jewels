import { defineAsyncComponent } from 'vue';

export const effectRegistry = [
  {
    className: 'ChromaticAberrationEffect',
    label: 'Aberration chromatique',
    classLoader: () => import('../effects/ChromaticAberrationEffect.js')
      .then((m) => m.ChromaticAberrationEffect),
    component: defineAsyncComponent(
      () => import('../components/effects/ChromaticAberrationEffect.vue')
    ),
  },
  {
    className: 'GlowEffect',
    label: 'Lueur',
    classLoader: () => import('../effects/GlowEffect.js').then((m) => m.GlowEffect),
    component: defineAsyncComponent(() => import('../components/effects/GlowEffect.vue')),
  },
  {
    className: 'DreamyGlowEffect',
    label: 'Lueur onirique',
    classLoader: () => import('../effects/DreamyGlowEffect.js').then((m) => m.DreamyGlowEffect),
    component: defineAsyncComponent(() => import('../components/effects/DreamyGlowEffect.vue')),
  },
  {
    className: 'LensFlareEffect',
    label: 'Lens flare',
    classLoader: () => import('../effects/LensFlareEffect.js').then((m) => m.LensFlareEffect),
    component: defineAsyncComponent(() => import('../components/effects/LensFlareEffect.vue')),
  },
  {
    className: 'ColorTintEffect',
    label: 'Teinte colorée',
    classLoader: () => import('../effects/ColorTintEffect.js').then((m) => m.ColorTintEffect),
    component: defineAsyncComponent(() => import('../components/effects/ColorTintEffect.vue')),
  },
  {
    className: 'GrainEffect',
    label: 'Grain',
    classLoader: () => import('../effects/GrainEffect.js').then((m) => m.GrainEffect),
    component: defineAsyncComponent(() => import('../components/effects/GrainEffect.vue')),
  },
  {
    className: 'ChromaticNoiseEffect',
    label: 'Bruit chromatique',
    classLoader: () => import('../effects/ChromaticNoiseEffect.js')
      .then((m) => m.ChromaticNoiseEffect),
    component: defineAsyncComponent(
      () => import('../components/effects/ChromaticNoiseEffect.vue')
    ),
  },
  {
    className: 'ColorShimmerEffect',
    label: 'Scintillement',
    classLoader: () => import('../effects/ColorShimmerEffect.js')
      .then((m) => m.ColorShimmerEffect),
    component: defineAsyncComponent(
      () => import('../components/effects/ColorShimmerEffect.vue')
    ),
  },
  {
    className: 'RGBSplitEffect',
    label: 'Split RGB',
    classLoader: () => import('../effects/RGBSplitEffect.js').then((m) => m.RGBSplitEffect),
    component: defineAsyncComponent(() => import('../components/effects/RGBSplitEffect.vue')),
  },
  {
    className: 'PixelSortEffect',
    label: 'Pixel sort',
    classLoader: () => import('../effects/PixelSortEffect.js').then((m) => m.PixelSortEffect),
    component: defineAsyncComponent(() => import('../components/effects/PixelSortEffect.vue')),
  },
  {
    className: 'TemporalGhostEffect',
    label: 'Fantôme temporel',
    classLoader: () => import('../effects/TemporalGhostEffect.js')
      .then((m) => m.TemporalGhostEffect),
    component: defineAsyncComponent(
      () => import('../components/effects/TemporalGhostEffect.vue')
    ),
  },
  {
    className: 'TemporalGhost2Effect',
    label: 'Fantôme temporel 2',
    classLoader: () => import('../effects/TemporalGhost2Effect.js')
      .then((m) => m.TemporalGhost2Effect),
    component: defineAsyncComponent(
      () => import('../components/effects/TemporalGhost2Effect.vue')
    ),
  },
  {
    className: 'BlockGlitchEffect',
    label: 'Glitch bloc',
    classLoader: () => import('../effects/BlockGlitchEffect.js').then((m) => m.BlockGlitchEffect),
    component: defineAsyncComponent(
      () => import('../components/effects/BlockGlitchEffect.vue')
    ),
  },
  {
    className: 'BlockGlitch2Effect',
    label: 'Glitch bloc 2',
    classLoader: () => import('../effects/BlockGlitch2Effect.js')
      .then((m) => m.BlockGlitch2Effect),
    component: defineAsyncComponent(
      () => import('../components/effects/BlockGlitch2Effect.vue')
    ),
  },
  {
    className: 'BlockGlitch3Effect',
    label: 'Glitch bloc 3',
    classLoader: () => import('../effects/BlockGlitch3Effect.js')
      .then((m) => m.BlockGlitch3Effect),
    component: defineAsyncComponent(
      () => import('../components/effects/BlockGlitch3Effect.vue')
    ),
  },
  {
    className: 'CRTEffect',
    label: 'CRT',
    classLoader: () => import('../effects/CRTEffect.js').then((m) => m.CRTEffect),
    component: defineAsyncComponent(() => import('../components/effects/CRTEffect.vue')),
  },
];