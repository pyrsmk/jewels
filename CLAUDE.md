# Jewels

Outil visuel temps réel de compositing WebGL avec pipeline de sources et d'effets post-process, piloté par une UI Vue 3. Déployé sur `jewels.animi.st`.

## Stack

- **Vue 3** (Composition API) + **Vite 5** — pas de TypeScript
- **WebGL 2** natif (pas de Three.js ni autre abstraction)
- **Yarn 4** (PnP, zero-install) — pas de `node_modules` classique
- Tâches dev via `Runfile.rb` : `run dev`, `run build`, `run preview`

## Architecture

### Pipeline de rendu

Le moteur suit un pattern **source -> effets -> post-process** :

1. **Sources** (`src/sources/`) génèrent la scène initiale (particules, fluides, vidéo, fond)
2. **Effets** (`src/effects/`) transforment l'image via des shaders GLSL en post-process
3. Les sources et effets sont ordonnés dans un `ModuleHost` qui gère une liste plate `items[]` (type source/effect, instance, enabled, className)
4. `PostProcessor` orchestre le rendu en groupant les effets par source via `getSourceGroups()`, puis composite chaque groupe sur l'accumulateur via un shader de compositing avec mode de fusion configurable (normal, additif, screen, multiply)
5. `PipelineRuntime` gère le contexte WebGL, les FBOs ping-pong, le quad fullscreen, la compilation des shaders et le compositing inter-sources

### Hiérarchie de classes

- `AbstractModule` — classe de base commune (options réactives Vue, gestion GPU, lifecycle setup/resize/dispose)
- `AbstractSource extends AbstractModule` — sources (renderScenePass, résolution automatique des uniforms/attributes, option `blendMode` pour le mode de fusion inter-sources)
- `EffectInterface extends AbstractModule` — effets (transform, contribution au shader post-process via getPostShader*)

### Registres

- `src/registry/effectRegistry.js` — déclare chaque effet avec className, label, classLoader (lazy import), component Vue
- `src/registry/sourceRegistry.js` — idem pour les sources

Pour ajouter une source ou un effet : créer la classe JS + le composant Vue + l'entrée dans le registre correspondant.

### Composant Vue / UI

- `src/components/` — panneau de contrôle avec un composant `.vue` par source et par effet
- `src/composables/useEngine.js` — composable principal qui initialise tout le moteur et expose l'API (addSource, addEffect, remove, reorder, toggle)

### Persistance

Les settings sont sérialisés en JSON base64 dans le query param `?settings=` de l'URL (via `SettingsController`). Format v2 : liste ordonnée d'items avec type, className, params.

## Conventions

- Les noms de classes JS servent d'identifiants stables (className) pour la sérialisation et le registre
- Les shaders GLSL sont inline dans les fichiers JS des effets/sources (template strings)
- Les labels UI sont en français
- Pas de tests automatisés
- Pas de linter/formatter configuré
