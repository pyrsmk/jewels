<template>
  <OverlayModal @close="$emit('close')">
    <template #title>
      <div class="modal-header">
        <span class="modal-title">Automations</span>
        <Button icon="add" label="Ajouter" @click="addBinding" />
      </div>
    </template>

    <div class="automation-list">
      <AutomationRow
        v-for="(binding, idx) in bindings"
        :key="idx"
        :binding="binding"
        :enabled="binding.enabled"
        :source-type="binding.source.type"
        :target-class-name="binding.targetClassName"
        :target-instance-index="binding.targetInstanceIndex"
        :target-option-key="binding.targetOptionKey"
        :items="items"
        :source-registry="sourceRegistry"
        :effect-registry="effectRegistry"
        @toggle="toggleBinding(binding)"
        @remove="removeBinding(binding)"
        @change-source="changeSource(binding, $event)"
        @change-module="changeModule(binding, $event)"
        @change-param="changeParam(binding, $event)"
        @settings-change="$emit('settings-change')"
      />

      <p v-if="!bindings.length" class="empty">Aucune automation</p>
    </div>
  </OverlayModal>
</template>

<script setup>
import { computed, triggerRef, shallowRef } from 'vue';
import OverlayModal from './OverlayModal.vue';
import Button from './Button.vue';
import AutomationRow from './AutomationRow.vue';
import { AutomationBinding } from '../core/automation/AutomationBinding.js';
import { LFOAutomationSource } from '../core/automation/LFOAutomationSource.js';
import { NoiseAutomationSource } from '../core/automation/NoiseAutomationSource.js';
import { MouseAutomationSource } from '../core/automation/MouseAutomationSource.js';
import { AudioAutomationSource } from '../core/automation/AudioAutomationSource.js';

const SOURCE_CTORS = { lfo: LFOAutomationSource, noise: NoiseAutomationSource, mouse: MouseAutomationSource, audio: AudioAutomationSource };

const props = defineProps({
  automationHost: { type: Object, required: true },
  items: { type: Array, required: true },
  sourceRegistry: { type: Array, required: true },
  effectRegistry: { type: Array, required: true },
});

const emit = defineEmits(['close', 'settings-change']);

const version = shallowRef(0);
const bindings = computed(() => {
  version.value;
  return props.automationHost?.bindings ? [...props.automationHost.bindings] : [];
});

function touch() {
  version.value++;
}

function addBinding() {
  if (!props.items.length) return;

  const item = props.items[0];
  const paramKeys = Object.keys(item.instance.options).filter((k) => !k.startsWith('_'));
  const paramKey = paramKeys[0] ?? '';
  const currentValue = item.instance.options[paramKey];
  const { paramType, mappingConfig } = detectParamType(currentValue);

  const binding = new AutomationBinding({
    source: new LFOAutomationSource(),
    targetClassName: item.className,
    targetInstanceIndex: 0,
    targetOptionKey: paramKey,
    paramType,
    mappingConfig,
  });

  binding.captureInitialValue(item.instance);
  props.automationHost.addBinding(binding);
  touch();
  emit('settings-change');
}

function changeSource(binding, sourceType) {
  const Ctor = SOURCE_CTORS[sourceType];
  if (!Ctor) return;
  binding.changeSource(new Ctor());
  touch();
  emit('settings-change');
}

function changeModule(binding, moduleIndex) {
  const item = props.items[moduleIndex];
  if (!item) return;

  const oldTarget = props.automationHost._resolveTarget(binding);
  binding.restoreInitialValue(oldTarget);

  let instanceIndex = 0;
  for (let i = 0; i < moduleIndex; i++) {
    if (props.items[i].className === item.className) instanceIndex++;
  }

  binding.targetClassName = item.className;
  binding.targetInstanceIndex = instanceIndex;

  const paramKeys = Object.keys(item.instance.options).filter((k) => !k.startsWith('_'));
  if (!paramKeys.includes(binding.targetOptionKey)) {
    binding.targetOptionKey = paramKeys[0] ?? '';
    const currentValue = item.instance.options[binding.targetOptionKey];
    const { paramType, mappingConfig } = detectParamType(currentValue);
    binding.paramType = paramType;
    binding.mappingConfig = mappingConfig;
  }

  binding.captureInitialValue(item.instance);
  touch();
  emit('settings-change');
}

function changeParam(binding, paramKey) {
  const target = props.automationHost._resolveTarget(binding);
  binding.restoreInitialValue(target);

  binding.targetOptionKey = paramKey;
  if (target) {
    const currentValue = target.options[paramKey];
    const { paramType, mappingConfig } = detectParamType(currentValue);
    binding.paramType = paramType;
    binding.mappingConfig = mappingConfig;
    binding.captureInitialValue(target);
  }
  touch();
  emit('settings-change');
}

function detectParamType(value) {
  if (typeof value === 'boolean') {
    return { paramType: 'boolean', mappingConfig: {} };
  }
  if (typeof value === 'string' && value.startsWith('#') && value.length === 7) {
    return { paramType: 'color', mappingConfig: {} };
  }
  if (typeof value === 'number') {
    return { paramType: 'range', mappingConfig: { min: 0, max: Math.max(1, value * 2) } };
  }
  return { paramType: 'range', mappingConfig: { min: 0, max: 1 } };
}

function toggleBinding(binding) {
  binding.enabled = !binding.enabled;
  const target = props.automationHost._resolveTarget(binding);
  if (!binding.enabled) {
    binding.restoreInitialValue(target);
  } else {
    binding.captureInitialValue(target);
  }
  touch();
  emit('settings-change');
}

function removeBinding(binding) {
  props.automationHost.removeBinding(binding);
  touch();
  emit('settings-change');
}
</script>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #ddd;
}
.automation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 420px;
  max-height: 60vh;
  overflow-y: auto;
}
.empty {
  text-align: center;
  color: #555;
  font-size: 13px;
  padding: 20px;
  margin: 0;
}
</style>
