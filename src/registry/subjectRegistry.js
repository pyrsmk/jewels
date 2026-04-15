import { defineAsyncComponent } from 'vue';

export const subjectRegistry = [
  {
    className: 'ParticleSubject',
    classLoader: () => import('../subjects/ParticleSubject.js').then((m) => m.ParticleSubject),
    component: defineAsyncComponent(
      () => import('../components/subjects/ParticleSubject.vue')
    ),
  },
];