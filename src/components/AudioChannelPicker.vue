<template>
  <OverlayModal title="Canal audio" @close="$emit('close')">
    <p v-if="error" class="picker-error">{{ error }}</p>
    <p v-else-if="loading" class="picker-loading">Recherche des périphériques…</p>
    <template v-else>
      <p v-if="!devices.length" class="picker-empty">Aucun périphérique audio détecté</p>
      <ul v-else class="picker-list">
        <li v-for="d in devices" :key="d.deviceId" class="picker-item" @click="$emit('select', d)">
          <span class="material-symbols-outlined">mic</span>
          <span class="picker-item__label">{{ d.label || 'Entrée inconnue' }}</span>
        </li>
      </ul>
    </template>
  </OverlayModal>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import OverlayModal from './OverlayModal.vue';

defineEmits(['close', 'select']);

const devices = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    // Request permission so enumerateDevices returns labels
    const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of tempStream.getTracks()) track.stop();

    const allDevices = await navigator.mediaDevices.enumerateDevices();
    devices.value = allDevices.filter(d => d.kind === 'audioinput');
  } catch (err) {
    error.value = err.name === 'NotAllowedError'
      ? 'Accès au microphone refusé'
      : `Erreur : ${err.message}`;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.picker-loading, .picker-empty, .picker-error {
  text-align: center;
  color: #666;
  font-size: 13px;
  padding: 16px 0;
  margin: 0;
}
.picker-error { color: #e55; }
.picker-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 300px;
}
.picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #ccc;
  font-size: 13px;
  transition: background 0.15s ease;
}
.picker-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.picker-item .material-symbols-outlined {
  font-size: 18px;
  color: #8f9bb3;
}
</style>
