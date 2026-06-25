<template>
  <div class="toolbar">
    <Button
      icon="ev_shadow_add"
      tooltip="Ajouter un source"
      @click="$emit('openAddSource')"
    />
    <Button
      icon="texture_add"
      tooltip="Ajouter un effet"
      @click="$emit('openAddEffect')"
    />
    <div class="badge-wrapper">
      <Button
        icon="grid_on"
        tooltip="Automations"
        @click="$emit('openAutomations')"
      />
      <span v-if="automationCount > 0" class="badge">{{ automationCount }}</span>
    </div>
  </div>
</template>

<script setup>
import Button from './Button.vue';

defineProps({
  automationCount: { type: Number, default: 0 },
});

defineEmits(['openAddSource', 'openAddEffect', 'openAutomations']);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.spacer { flex: 1; }
.badge-wrapper {
  position: relative;
  display: inline-flex;
}
.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #5078ff;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  padding: 0 4px;
  pointer-events: none;
}
</style>
