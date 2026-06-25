<template>
  <div :class="['automation-row', { 'automation-row--disabled': !enabled }]">
    <div class="automation-row__header">
      <button
        class="toggle-btn"
        :title="enabled ? 'Désactiver' : 'Activer'"
        @click="$emit('toggle')"
      >
        <span class="material-symbols-outlined">{{ enabled ? 'toggle_on' : 'toggle_off' }}</span>
      </button>
      <div class="automation-row__selects">
        <label>
          Source
          <select :value="sourceType" @change="$emit('change-source', $event.target.value)">
            <option value="lfo">LFO</option>
            <option value="noise">Bruit</option>
            <option value="mouse">Souris</option>
          </select>
        </label>
        <label>
          Module
          <select :value="currentModuleIndex" @change="$emit('change-module', Number($event.target.value))">
            <option v-for="(m, idx) in moduleOptions" :key="idx" :value="idx">
              {{ m.label }}
            </option>
          </select>
        </label>
        <label>
          Paramètre
          <select :value="targetOptionKey" @change="$emit('change-param', $event.target.value)">
            <option v-for="key in paramOptions" :key="key" :value="key">
              {{ key }}
            </option>
          </select>
        </label>
      </div>
      <div class="spacer" />
      <button class="delete-btn" title="Supprimer" @click="$emit('remove')">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="automation-row__config">
      <template v-if="sourceType === 'lfo'">
        <label>
          Forme
          <select :value="binding.source.options.waveform" @change="updateSourceOption('waveform', $event.target.value)">
            <option value="sine">Sinus</option>
            <option value="triangle">Triangle</option>
            <option value="square">Carré</option>
            <option value="sawtooth">Dent de scie</option>
          </select>
        </label>
        <SliderControl
          label="Fréquence"
          :model-value="binding.source.options.frequency"
          :min="0.01" :max="1" :step="0.001"
          :display-fn="v => v.toFixed(2) + ' Hz'"
          @update:model-value="updateSourceOption('frequency', $event)"
        />
      </template>
      <template v-else-if="sourceType === 'noise'">
        <SliderControl
          label="Vitesse"
          :model-value="binding.source.options.speed"
          :min="0.01" :max="3" :step="0.01"
          :display-fn="v => v.toFixed(2)"
          @update:model-value="updateSourceOption('speed', $event)"
        />
        <SliderControl
          label="Lissage"
          :model-value="binding.source.options.smoothness"
          :min="0" :max="0.99" :step="0.01"
          :display-fn="v => v.toFixed(2)"
          @update:model-value="updateSourceOption('smoothness', $event)"
        />
      </template>
      <template v-else-if="sourceType === 'mouse'">
        <label>
          Axe
          <select :value="binding.source.options.axis" @change="updateSourceOption('axis', $event.target.value)">
            <option value="x">X (horizontal)</option>
            <option value="y">Y (vertical)</option>
          </select>
        </label>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import SliderControl from './SliderControl.vue';

const props = defineProps({
  binding: { type: Object, required: true },
  enabled: { type: Boolean, required: true },
  targetClassName: { type: String, required: true },
  targetInstanceIndex: { type: Number, required: true },
  targetOptionKey: { type: String, required: true },
  sourceType: { type: String, required: true },
  items: { type: Array, required: true },
  sourceRegistry: { type: Array, required: true },
  effectRegistry: { type: Array, required: true },
});

const emit = defineEmits(['toggle', 'remove', 'change-source', 'change-module', 'change-param', 'settings-change']);


const moduleOptions = computed(() =>
  props.items.map((item) => {
    const registry = item.type === 'source' ? props.sourceRegistry : props.effectRegistry;
    const entry = registry.find((r) => r.className === item.className);
    return { label: entry?.label ?? item.className, item };
  }),
);

const currentModuleIndex = computed(() => {
  let instanceIndex = 0;
  for (let i = 0; i < props.items.length; i++) {
    const item = props.items[i];
    if (item.className === props.targetClassName && instanceIndex === props.targetInstanceIndex) {
      return i;
    }
    if (item.className === props.targetClassName) instanceIndex++;
  }
  return 0;
});

const paramOptions = computed(() => {
  const idx = currentModuleIndex.value;
  const item = props.items[idx];
  if (!item) return [];
  return Object.keys(item.instance.options).filter((k) => !k.startsWith('_'));
});

function updateSourceOption(key, value) {
  props.binding.source.options[key] = value;
  emit('settings-change');
}
</script>

<style scoped>
.spacer { flex: 1; }
.automation-row {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 12px;
  transition: opacity 0.2s ease;
}
.automation-row--disabled {
  opacity: 0.45;
}
.automation-row__header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.automation-row__selects {
  flex: 1;
  display: flex;
  gap: 8px;
}
.automation-row__selects label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8f9bb3;
}
.automation-row__selects select {
  flex: 1;
  min-width: 60px;
  background: #181a22;
  color: #ddd;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
}
.automation-row__config {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 8px;
  font-size: 12px;
}
.automation-row__config label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8f9bb3;
}
.automation-row__config select {
  background: #181a22;
  color: #ddd;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
}
.toggle-btn, .delete-btn {
  background: none;
  border: none;
  color: #8f9bb3;
  cursor: pointer;
  padding: 0;
  display: flex;
}
.toggle-btn:hover, .delete-btn:hover { color: #ddd; }
.toggle-btn .material-symbols-outlined { font-size: 22px; }
.delete-btn .material-symbols-outlined { font-size: 16px; }
</style>
