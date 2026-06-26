<template>
  <div>
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.intensity ?? 4)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="5" step="0.01"
      :value="instance.options.intensity ?? 4"
      @input="instance.options.intensity = +$event.target.value"
    />
    <label>
      Réponse au grain
      <span class="value">{{ (+(instance.options.grainResponse ?? 1)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.grainResponse ?? 1"
      @input="instance.options.grainResponse = +$event.target.value"
    />
    <label>Application du halo</label>
    <select
      :value="instance.options.haloDirection ?? 15"
      @change="instance.options.haloDirection = +$event.target.value"
    >
      <option :value="1">Haut</option>
      <option :value="2">Bas</option>
      <option :value="4">Gauche</option>
      <option :value="8">Droite</option>
      <option :value="12">Horizontal</option>
      <option :value="3">Vertical</option>
      <option :value="15">Tous les bords</option>
    </select>
    <label>
      Force du halo
      <span class="value">{{ (+(instance.options.haloStrength ?? 0.5)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="3" step="0.01"
      :value="instance.options.haloStrength ?? 0.5"
      @input="instance.options.haloStrength = +$event.target.value"
    />
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
