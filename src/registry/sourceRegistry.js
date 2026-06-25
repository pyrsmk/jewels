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
    className: 'PearlSource',
    label: 'Perles',
    isDeletable: true,
    classLoader: () => import('../sources/PearlSource.js').then((m) => m.PearlSource),
    componentLoader: () => import('../components/sources/PearlSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/PearlSource.vue')
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
    className: 'WireworldSource',
    label: 'Wireworld',
    isDeletable: true,
    classLoader: () => import('../sources/WireworldSource.js').then((m) => m.WireworldSource),
    componentLoader: () => import('../components/sources/WireworldSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/WireworldSource.vue')
    ),
  },
  {
    className: 'RPSSource',
    label: 'Shifumi',
    isDeletable: true,
    classLoader: () => import('../sources/RPSSource.js').then((m) => m.RPSSource),
    componentLoader: () => import('../components/sources/RPSSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/RPSSource.vue')
    ),
  },
  {
    className: 'CyclicCASource',
    label: 'Automate cyclique',
    isDeletable: true,
    classLoader: () => import('../sources/CyclicCASource.js').then((m) => m.CyclicCASource),
    componentLoader: () => import('../components/sources/CyclicCASource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/CyclicCASource.vue')
    ),
  },
  {
    className: 'EvoloopsSource',
    label: 'Evoloops',
    isDeletable: true,
    classLoader: () => import('../sources/EvoloopsSource.js').then((m) => m.EvoloopsSource),
    componentLoader: () => import('../components/sources/EvoloopsSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/EvoloopsSource.vue')
    ),
  },
  {
    className: 'SmoothLifeSource',
    label: 'SmoothLife',
    isDeletable: true,
    classLoader: () => import('../sources/SmoothLifeSource.js').then((m) => m.SmoothLifeSource),
    componentLoader: () => import('../components/sources/SmoothLifeSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/SmoothLifeSource.vue')
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
