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
      <label>
        Source
        <select :value="sourceType" @change="$emit('change-source', $event.target.value)">
          <option value="lfo">LFO</option>
          <option value="noise">Noise</option>
          <option value="mouse">Souris</option>
          <option value="audio">Audio</option>
        </select>
      </label>
      <label>
        Cible
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
            {{ formatKey(key) }}
          </option>
        </select>
      </label>
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
      <template v-else-if="sourceType === 'audio'">
        <div class="audio-grid">
          <span class="audio-grid__label">Flux</span>
          <div class="audio-grid__control audio-grid__file">
            <select :value="binding.source.options.streamId ?? ''" @change="onAudioFileSelect($event.target.value)">
              <option v-if="!binding.source.options.streamId" value="" disabled>
                {{ binding.source.options.streamName ? binding.source.options.streamName + ' (manquant)' : 'Aucun flux' }}
              </option>
              <option v-for="f in audioFiles" :key="f.id" :value="f.id">{{ f.name }}</option>
              <option value="__load__">Charger un fichier...</option>
              <option value="__channel__">Choisir un canal audio...</option>
            </select>
            <input ref="audioFileInput" type="file" accept="audio/*" style="display: none" @change="onFileInputChange" />
            <button class="audio-btn" :disabled="!binding.source.options.streamId" @click="toggleAudioPlayback" :title="isAudioPlaying ? 'Stop' : 'Lecture'">
              <span class="material-symbols-outlined">{{ isAudioPlaying ? 'stop' : 'play_arrow' }}</span>
            </button>
          </div>

          <span class="audio-grid__label">Mode</span>
          <div class="audio-grid__control">
            <select :value="binding.source.options.mode" @change="updateSourceOption('mode', $event.target.value)">
              <option v-for="m in audioModes" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>

          <template v-if="binding.source.options.mode !== 'beat'">
            <span class="audio-grid__label">Attack</span>
            <div class="audio-grid__control audio-grid__slider">
              <span class="audio-grid__value">{{ (binding.source.options.attack * 1000).toFixed(0) }} ms</span>
              <input
                type="range"
                :min="0.001" :max="0.5" :step="0.001"
                :value="binding.source.options.attack"
                @input="updateSourceOption('attack', +$event.target.value)"
              />
            </div>

            <span class="audio-grid__label">Release</span>
            <div class="audio-grid__control audio-grid__slider">
              <span class="audio-grid__value">{{ (binding.source.options.release * 1000).toFixed(0) }} ms</span>
              <input
                type="range"
                :min="0.01" :max="1" :step="0.001"
                :value="binding.source.options.release"
                @input="updateSourceOption('release', +$event.target.value)"
              />
            </div>
          </template>
        </div>
        <AudioChannelPicker
          v-if="showChannelPicker"
          @select="onChannelSelect"
          @close="showChannelPicker = false"
        />
      </template>
    </div>
    <div v-if="binding.paramType === 'range'" class="automation-row__mapping">
      <label class="mapping-slider">
        Intensité
        <span class="mapping-slider__value">{{ ((binding.mappingConfig.amount ?? 1) * 100).toFixed(0) }}%</span>
        <input
          type="range"
          :min="0" :max="1" :step="0.01"
          :value="binding.mappingConfig.amount ?? 1"
          @input="updateMappingConfig('amount', +$event.target.value)"
        />
      </label>
      <label>
        Modulation
        <select :value="binding.mappingConfig.anchor ?? 0" @change="updateMappingConfig('anchor', Number($event.target.value))">
          <option :value="0">Vers le haut</option>
          <option :value="0.5">Au centre</option>
          <option :value="1">Vers le bas</option>
        </select>
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import SliderControl from './SliderControl.vue';
import { AudioStreamManager } from '../core/automation/AudioStreamManager.js';
import { AUDIO_MODES } from '../core/automation/AudioAutomationSource.js';
import AudioChannelPicker from './AudioChannelPicker.vue';

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

function formatKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase());
}


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

const audioFileInput = ref(null);
const audioFilesVersion = ref(0);
const playbackVersion = ref(0);
const showChannelPicker = ref(false);

const audioModes = AUDIO_MODES;

const audioFiles = computed(() => {
  audioFilesVersion.value;
  return AudioStreamManager.getInstance().getStreamList();
});

const isAudioPlaying = computed(() => {
  playbackVersion.value;
  const fileId = props.binding.source.options.streamId;
  if (!fileId) return false;
  const file = AudioStreamManager.getInstance().getStream(fileId);
  return file?.playing ?? false;
});

function onAudioFileSelect(value) {
  if (value === '__load__') {
    audioFileInput.value?.click();
    return;
  }
  if (value === '__channel__') {
    showChannelPicker.value = true;
    return;
  }
  updateSourceOption('streamId', value);
  const stream = AudioStreamManager.getInstance().getStream(value);
  if (stream) {
    updateSourceOption('streamName', stream.name);
    if (!stream.playing) stream.play();
  }
}

async function onChannelSelect(device) {
  showChannelPicker.value = false;
  try {
    const manager = AudioStreamManager.getInstance();
    const streamId = await manager.addChannel(device.deviceId, device.label || 'Canal audio');
    const stream = manager.getStream(streamId);
    updateSourceOption('streamId', streamId);
    updateSourceOption('streamName', stream.name);
    stream.play();
    audioFilesVersion.value++;
    playbackVersion.value++;
  } catch (err) {
    console.error('[audio] Erreur canal audio:', err);
  }
}

async function onFileInputChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const manager = AudioStreamManager.getInstance();
  const fileId = await manager.loadFile(file);
  updateSourceOption('streamId', fileId);
  updateSourceOption('streamName', file.name);
  audioFilesVersion.value++;
  const audioFile = manager.getStream(fileId);
  if (audioFile) audioFile.play();
  e.target.value = '';
}

function toggleAudioPlayback() {
  const file = AudioStreamManager.getInstance().getStream(props.binding.source.options.streamId);
  if (!file) return;
  file.playing ? file.stop() : file.play();
  playbackVersion.value++;
}

function updateSourceOption(key, value) {
  props.binding.source.options[key] = value;
  emit('settings-change');
}

function updateMappingConfig(key, value) {
  props.binding.mappingConfig[key] = value;
  emit('settings-change');
}
</script>

<style scoped>
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
.automation-row__header label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8f9bb3;
  white-space: nowrap;
}
.automation-row__header select {
  background: #181a22;
  color: #ddd;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
  width: 75px;
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
.audio-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px 8px;
  align-items: center;
  width: 100%;
}
.audio-grid__label {
  font-size: 12px;
  color: #8f9bb3;
  white-space: nowrap;
}
.audio-grid__control {
  display: flex;
  align-items: center;
  gap: 6px;
}
.audio-grid__control select {
  flex: 1;
  background: #181a22;
  color: #ddd;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
}
.audio-grid__value {
  font-size: 11px;
  color: #aaa;
  min-width: 42px;
  text-align: right;
}
.audio-grid__slider input[type="range"] {
  flex: 1;
}
.audio-btn {
  width: 24px;
  height: 24px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  color: #8f9bb3;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.audio-btn:hover:not(:disabled) { color: #ddd; }
.audio-btn:disabled { opacity: 0.3; cursor: default; }
.audio-btn .material-symbols-outlined { font-size: 16px; }
.automation-row__mapping {
  display: flex;
  align-items: center;
  gap: 8px 16px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
}
.automation-row__mapping label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8f9bb3;
  white-space: nowrap;
}
.automation-row__mapping select {
  background: #181a22;
  color: #ddd;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
}
.mapping-slider {
  flex: 1;
}
.mapping-slider__value {
  font-size: 11px;
  color: #aaa;
  min-width: 32px;
  text-align: right;
}
.mapping-slider input[type="range"] {
  flex: 1;
}
.toggle-btn, .delete-btn {
  appearance: none;
  background: transparent;
  border: none;
  color: #8f9bb3;
  color-scheme: normal;
  cursor: pointer;
  padding: 0;
}
.toggle-btn span, .delete-btn span {
  background: transparent;
}
.toggle-btn:hover, .delete-btn:hover { background: transparent; color: #ddd; }
.toggle-btn .material-symbols-outlined { font-size: 22px; }
.delete-btn .material-symbols-outlined { font-size: 16px; }
</style>
