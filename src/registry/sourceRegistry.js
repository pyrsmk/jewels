import { defineAsyncComponent } from 'vue';

export const sourceRegistry = [
  {
    className: 'ParticleSource',
    label: 'Particules',
    classLoader: () => import('../sources/ParticleSource.js').then((m) => m.ParticleSource),
    componentLoader: () => import('../components/sources/ParticleSource.vue'),
    component: defineAsyncComponent(
      () => import('../components/sources/ParticleSource.vue')
    ),
  },
];