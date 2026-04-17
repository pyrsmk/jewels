<template>
  <div>
    <label>
      Réponse au grain
      <span class="value">{{ (+(instance.options.lensFlareGrainResponse ?? 0.5)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.lensFlareGrainResponse ?? 0.5"
      @input="instance.options.lensFlareGrainResponse = +$event.target.value"
    />
    <label>Type</label>
    <select
      :value="instance.options.lensFlareType ?? 'horizontal'"
      @change="instance.options.lensFlareType = $event.target.value"
    >
      <option value="horizontal">Horizontal</option>
      <option value="vertical">Vertical</option>
      <option value="star">Étoile</option>
    </select>
    <label>
      Anamorphique
      <input
        type="checkbox"
        :checked="instance.options.lensFlareAnamorphic ?? true"
        @change="instance.options.lensFlareAnamorphic = $event.target.checked"
      />
    </label>
    <label>
      Épaisseur
      <span class="value">{{ (+(instance.options.flareThickness ?? 3)).toFixed(1) }} px</span>
    </label>
    <input
      type="range" min="0" max="10" step="0.1"
      :value="instance.options.flareThickness ?? 3"
      @input="instance.options.flareThickness = +$event.target.value"
    />
    <label>
      Longueur
      <span class="value">{{ (+(instance.options.flareLength ?? 60)) }}%</span>
    </label>
    <input
      type="range" min="5" max="100" step="1"
      :value="instance.options.flareLength ?? 60"
      @input="instance.options.flareLength = +$event.target.value"
    />
    <label>
      Diffusion
      <span class="value">{{ (+(instance.options.flareDiffusion ?? 2.5)).toFixed(1) }}x</span>
    </label>
    <input
      type="range" min="0" max="5" step="0.1"
      :value="instance.options.flareDiffusion ?? 2.5"
      @input="instance.options.flareDiffusion = +$event.target.value"
    />
    <label>
      Durée
      <span class="value">{{ (+(instance.options.flareDuration ?? 4000)) }} ms</span>
    </label>
    <input
      type="range" min="100" max="20000" step="10"
      :value="instance.options.flareDuration ?? 4000"
      @input="instance.options.flareDuration = +$event.target.value"
    />
    <label>
      Borne min de déclenchement
      <span class="value">{{ (+(instance.options.flareMin ?? 10)).toFixed(1) }}</span>
    </label>
    <input
      type="range" min="1" max="30" step="0.5"
      :value="instance.options.flareMin ?? 10"
      @input="instance.options.flareMin = +$event.target.value"
    />
    <label>
      Borne max de déclenchement
      <span class="value">{{ (+(instance.options.flareMax ?? 60)).toFixed(1) }}</span>
    </label>
    <input
      type="range" min="5" max="60" step="0.5"
      :value="instance.options.flareMax ?? 60"
      @input="instance.options.flareMax = +$event.target.value"
    />
    <label>
      Fondu entrant
      <span class="value">{{ (+(instance.options.flareFadeIn ?? 13)) }}%</span>
    </label>
    <input
      type="range" min="0" max="100" step="1"
      :value="instance.options.flareFadeIn ?? 13"
      @input="instance.options.flareFadeIn = +$event.target.value"
    />
    <label>
      Maintien
      <span class="value">{{ (+(instance.options.flareHold ?? 10)) }}%</span>
    </label>
    <input
      type="range" min="0" max="100" step="1"
      :value="instance.options.flareHold ?? 10"
      @input="instance.options.flareHold = +$event.target.value"
    />
    <label>
      Fondu sortant
      <span class="value">{{ (+(instance.options.flareFadeOut ?? 77)) }}%</span>
    </label>
    <input
      type="range" min="0" max="100" step="1"
      :value="instance.options.flareFadeOut ?? 77"
      @input="instance.options.flareFadeOut = +$event.target.value"
    />
    <label>
      Distance au bord
      <span class="value">{{ (+(instance.options.flareEdgeDistance ?? 0)) }} px</span>
    </label>
    <input
      type="range" min="0" max="500" step="1"
      :value="instance.options.flareEdgeDistance ?? 0"
      @input="instance.options.flareEdgeDistance = +$event.target.value"
    />
    <label>
      Fantômes
      <input
        type="checkbox"
        :checked="instance.options.ghostEnabled ?? true"
        @change="instance.options.ghostEnabled = $event.target.checked"
      />
    </label>
    <label>
      Intensité fantôme
      <span class="value">{{ (+(instance.options.ghostIntensity ?? 0.3)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.ghostIntensity ?? 0.3"
      @input="instance.options.ghostIntensity = +$event.target.value"
    />
    <label>
      Nombre de fantômes
      <span class="value">{{ (+(instance.options.ghostCount ?? 2)) }}</span>
    </label>
    <input
      type="range" min="1" max="5" step="1"
      :value="instance.options.ghostCount ?? 2"
      @input="instance.options.ghostCount = +$event.target.value"
    />
    <label>
      Espacement
      <span class="value">{{ (+(instance.options.ghostSpacing ?? 0.17)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.05" max="0.40" step="0.01"
      :value="instance.options.ghostSpacing ?? 0.17"
      @input="instance.options.ghostSpacing = +$event.target.value"
    />
    <label>
      Taille fantôme
      <span class="value">{{ (+(instance.options.ghostSize ?? 1.8)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="2.5" step="0.01"
      :value="instance.options.ghostSize ?? 1.8"
      @input="instance.options.ghostSize = +$event.target.value"
    />
    <label>
      Diffusion fantôme
      <span class="value">{{ (+(instance.options.ghostDiffusion ?? 2.5)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="4.0" step="0.01"
      :value="instance.options.ghostDiffusion ?? 2.5"
      @input="instance.options.ghostDiffusion = +$event.target.value"
    />
    <label>
      Décroissance fantôme
      <span class="value">{{ (+(instance.options.ghostDecay ?? 0.50)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.0" max="1.0" step="0.01"
      :value="instance.options.ghostDecay ?? 0.50"
      @input="instance.options.ghostDecay = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
