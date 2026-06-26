<template>
  <div>
    <label>
      Intensité
      <span class="value">{{ (+(instance.options.intensity ?? 3.00)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="3" step="0.01"
      :value="instance.options.intensity ?? 3.00"
      @input="instance.options.intensity = +$event.target.value"
    />
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.speed ?? 0.60)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="3" step="0.01"
      :value="instance.options.speed ?? 0.60"
      @input="instance.options.speed = +$event.target.value"
    />
    <label>
      Échelle
      <span class="value">{{ (+(instance.options.scale ?? 1.10)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="4" step="0.01"
      :value="instance.options.scale ?? 1.10"
      @input="instance.options.scale = +$event.target.value"
    />
    <label>Palette</label>
    <select
      :value="instance.options.palette ?? 'all'"
      @change="instance.options.palette = $event.target.value"
    >
      <option value="all">Toutes</option>
      <option value="warm">Chaudes</option>
      <option value="cool">Froides</option>
      <option value="fluo">Fluos</option>
      <option value="cyberpunk">Cyberpunk</option>
      <option value="aurora">Aurore boréale</option>
      <option value="fire">Feu</option>
      <option value="sunset">Coucher de soleil</option>
      <option value="toxic">Toxique</option>
      <option value="ice">Glace</option>
      <option value="midnight">Minuit</option>
    </select>
  </div>
</template>

<script setup>


defineProps({ instance: { type: Object, required: true } });
</script>
