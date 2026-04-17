<template>
  <div>
    <label>Intensité <span class="value">{{ glowDisplay }}</span></label>
    <input
      type="range" min="0" max="2.5" step="0.01"
      :value="instance.options.glow ?? 1.0"
      @input="instance.options.glow = +$event.target.value"
    />
    <label>
      Réponse au grain
      <span class="value">{{ (+(instance.options.glowGrainResponse ?? 1)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.01"
      :value="instance.options.glowGrainResponse ?? 1"
      @input="instance.options.glowGrainResponse = +$event.target.value"
    />
    <label>Mode</label>
    <select
      :value="instance.options.glowMode ?? 'post2'"
      @change="instance.options.glowMode = $event.target.value"
    >
      <option value="simple">Simple</option>
      <option value="post">Post-process</option>
      <option value="post2">Post-process v2</option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue';


const props = defineProps({ instance: { type: Object, required: true } });

const glowDisplay = computed(() => {
  const enabled = props.instance.options.glowEnabled ?? true;
  const val = enabled ? +(props.instance.options.glow ?? 1.0) : 0;
  return val.toFixed(2);
});
</script>
