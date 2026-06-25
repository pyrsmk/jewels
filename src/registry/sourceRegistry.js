import { defineAsyncComponent } from 'vue';

export const sourceRegistry = [
  {
    className: 'BackgroundSource',
    label: 'Fond',
    isDeletable: false,
    classLoader: () => import('../sources/BackgroundSource.js').then((m) => m.BackgroundSource),
    componentLoader: () => import('../components/sources/BackgroundSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/BackgroundSource.vue')
    ),
  },
  {
    className: 'ParticleSource',
    label: 'Particules',
    isDeletable: true,
    classLoader: () => import('../sources/ParticleSource.js').then((m) => m.ParticleSource),
    componentLoader: () => import('../components/sources/ParticleSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/ParticleSource.vue')
    ),
  },
  {
    className: 'FluidSource',
    label: 'Fluides',
    isDeletable: true,
    classLoader: () => import('../sources/FluidSource.js').then((m) => m.FluidSource),
    componentLoader: () => import('../components/sources/FluidSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/FluidSource.vue')
    ),
  },
  {
    className: 'GameOfLifeSource',
    label: 'Game of Life',
    isDeletable: true,
    classLoader: () => import('../sources/GameOfLifeSource.js').then((m) => m.GameOfLifeSource),
    componentLoader: () => import('../components/sources/GameOfLifeSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/GameOfLifeSource.vue')
    ),
  },
  {
    className: 'LeniaSource',
    label: 'Lenia',
    isDeletable: true,
    classLoader: () => import('../sources/LeniaSource.js').then((m) => m.LeniaSource),
    componentLoader: () => import('../components/sources/LeniaSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/LeniaSource.vue')
    ),
  },
  {
    className: 'VideoSource',
    label: 'Vidéo',
    isDeletable: true,
    classLoader: () => import('../sources/VideoSource.js').then((m) => m.VideoSource),
    componentLoader: () => import('../components/sources/VideoSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/VideoSource.vue')
    ),
  },
];
