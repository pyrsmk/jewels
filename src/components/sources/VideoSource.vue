<template>
  <div>
    <label class="file-label">
      <span class="material-symbols-outlined icon">movie</span>
      <span class="text">{{ fileName ?? 'Aucun fichier' }}</span>
      <input
        type="file"
        accept=".mp4,.webm,.mov,.ogg"
        @change="onFileChange"
      />
    </label>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ instance: { type: Object, required: true } });

const fileName = ref(null);

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  fileName.value = file.name;
  props.instance.loadFile(file);
}
</script>

<style scoped>
.file-label {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  color: #ccc;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  padding: 7px 10px;
  overflow: hidden;
}
.file-label .icon {
  position: absolute;
  left: 10px;
  font-size: 16px;
  opacity: 0.7;
}
.file-label .text {
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-label:hover { background: rgba(255,255,255,0.10); }
.file-label input[type="file"] { display: none; }
</style>
