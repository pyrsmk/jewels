import { defineAsyncComponent } from 'vue';

export const sourceRegistry = [
  {
    className: 'ParticleSource',
    classLoader: () => import('../sources/ParticleSource.js').then((m) => m.ParticleSource),
    component: defineAsyncComponent(
      () => import('../components/sources/ParticleSource.vue')
    ),
  },
];