import { defineAsyncComponent } from 'vue';

export const effectRegistry = [
  {
    className: 'ChromaticAberrationEffect',
    label: 'Aberration chromatique',
    classLoader: () => import('../effects/ChromaticAberrationEffect.js')
      .then((m) => m.ChromaticAberrationEffect),
    componentLoader: () => import('../components/effects/ChromaticAberrationEffect.vue'),
    component: defineAsyncComponent(
      () => import('../components/effects/ChromaticAberrationEffect.vue')
    ),
  },
  {
    className: 'GlowEffect',
    label: 'Lueur',
    classLoader: () => import('../effects/GlowEffect.js').then((m) => m.GlowEffect),
    componentLoader: () => import('../components/effects/GlowEffect.vue'),
    component: defineAsyncComponent(() => import('../components/effects/GlowEffect.vue')),
  },
  {
    className: 'DreamyGlowEffect',
    label: 'Lueur onirique',
    classLoader: () => import('../effects/DreamyGlowEffect.js').then((m) => m.DreamyGlowEffect),
    componentLoader: () => import('../components/effects/DreamyGlowEffect.vue'),
    component: defineAsyncComponent(() => import('../components/effects/DreamyGlowEffect.vue')),
  },
  {
    className: 'LensFlareEffect',
    label: 'Halo',
    classLoader: () => import('../effects/LensFlareEffect.js').then((m) => m.LensFlareEffect),
    componentLoader: () => import('../components/effects/LensFlareEffect.vue'),
    component: defineAsyncComponent(() => import('../components/effects/LensFlareEffect.vue')),
  },
  {
    className: 'ColorTintEffect',
    label: 'Teinte 1',
    classLoader: () => import('../effects/ColorTintEffect.js').then((m) => m.ColorTintEffect),
    componentLoader: () => import('../components/effects/ColorTintEffect.vue'),
    component: defineAsyncComponent(() => import('../components/effects/ColorTintEffect.vue')),
  },
  {
    className: 'GrainEffect',
    label: 'Grain de film',
    classLoader: () => import('../effects/GrainEffect.js').then((m) => m.GrainEffect),
    componentLoader: () => import('../components/effects/GrainEffect.vue'),
    component: defineAsyncComponent(() => import('../components/effects/GrainEffect.vue')),
  },
  {
    className: 'ColorShimmerEffect',
    label: 'Teinte 2',
    classLoader: () => import('../effects/ColorShimmerEffect.js')
      .then((m) => m.ColorShimmerEffect),
    componentLoader: () => import('../components/effects/ColorShimmerEffect.vue'),
    component: defineAsyncComponent(
      () => import('../components/effects/ColorShimmerEffect.vue')
    ),
  },
  {
    className: 'RGBSplitEffect',
    label: 'Split RGB',
    classLoader: () => import('../effects/RGBSplitEffect.js').then((m) => m.RGBSplitEffect),
    componentLoader: () => import('../components/effects/RGBSplitEffect.vue'),
    component: defineAsyncComponent(() => import('../components/effects/RGBSplitEffect.vue')),
  },
  {
    className: 'PixelSortEffect',
    label: 'Glitchs horizontaux',
    classLoader: () => import('../effects/PixelSortEffect.js').then((m) => m.PixelSortEffect),
    componentLoader: () => import('../components/effects/PixelSortEffect.vue'),
    component: defineAsyncComponent(() => import('../components/effects/PixelSortEffect.vue')),
  },
  {
    className: 'TemporalGhostEffect',
    label: 'Ghost 1',
    classLoader: () => import('../effects/TemporalGhostEffect.js')
      .then((m) => m.TemporalGhostEffect),
    componentLoader: () => import('../components/effects/TemporalGhostEffect.vue'),
    component: defineAsyncComponent(
      () => import('../components/effects/TemporalGhostEffect.vue')
    ),
  },
  {
    className: 'TemporalGhost2Effect',
    label: 'Ghost 2',
    classLoader: () => import('../effects/TemporalGhost2Effect.js')
      .then((m) => m.TemporalGhost2Effect),
    componentLoader: () => import('../components/effects/TemporalGhost2Effect.vue'),
    component: defineAsyncComponent(
      () => import('../components/effects/TemporalGhost2Effect.vue')
    ),
  },
  {
    className: 'BlockGlitchEffect',
    label: 'Blocs 1',
    classLoader: () => import('../effects/BlockGlitchEffect.js').then((m) => m.BlockGlitchEffect),
    componentLoader: () => import('../components/effects/BlockGlitchEffect.vue'),
    component: defineAsyncComponent(
      () => import('../components/effects/BlockGlitchEffect.vue')
    ),
  },
  {
    className: 'BlockGlitch2Effect',
    label: 'Blocs 2',
    classLoader: () => import('../effects/BlockGlitch2Effect.js')
      .then((m) => m.BlockGlitch2Effect),
    componentLoader: () => import('../components/effects/BlockGlitch2Effect.vue'),
    component: defineAsyncComponent(
      () => import('../components/effects/BlockGlitch2Effect.vue')
    ),
  },
  {
    className: 'BlockGlitch3Effect',
    label: 'Blocs 3',
    classLoader: () => import('../effects/BlockGlitch3Effect.js')
      .then((m) => m.BlockGlitch3Effect),
    componentLoader: () => import('../components/effects/BlockGlitch3Effect.vue'),
    component: defineAsyncComponent(
      () => import('../components/effects/BlockGlitch3Effect.vue')
    ),
  },
  {
    className: 'CRTEffect',
    label: 'Écran CRT',
    classLoader: () => import('../effects/CRTEffect.js').then((m) => m.CRTEffect),
    componentLoader: () => import('../components/effects/CRTEffect.vue'),
    component: defineAsyncComponent(() => import('../components/effects/CRTEffect.vue')),
  },
  {
    className: 'ChromaticNoiseEffect',
    label: 'Teinte 3',
    classLoader: () => import('../effects/ChromaticNoiseEffect.js')
      .then((m) => m.ChromaticNoiseEffect),
    componentLoader: () => import('../components/effects/ChromaticNoiseEffect.vue'),
    component: defineAsyncComponent(
      () => import('../components/effects/ChromaticNoiseEffect.vue')
    ),
  },
  {
    className: 'ColorGradingEffect',
    label: 'Colorimétrie',
    classLoader: () => import('../effects/ColorGradingEffect.js')
      .then((m) => m.ColorGradingEffect),
    componentLoader: () => import('../components/effects/ColorGradingEffect.vue'),
    component: defineAsyncComponent(
      () => import('../components/effects/ColorGradingEffect.vue')
    ),
  },
];
