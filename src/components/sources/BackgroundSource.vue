<template>
  <div>
    <label>Couleur</label>
    <input
      type="color"
      :value="bgColor"
      @input="updateColor($event.target.value)"
      @change="updateColor($event.target.value)"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({ instance: { type: Object, required: true } });

const bgColor = ref(props.instance.bgColor ?? '#000000');

onMounted(() => {
  bgColor.value = props.instance.bgColor ?? '#000000';
});

function updateColor(val) {
  bgColor.value = val;
  props.instance.setBgColor(val);
}

watch(() => props.instance.bgColor, (val) => {
  if (val !== bgColor.value) {
    bgColor.value = val ?? '#000000';
  }
});
</script>

<style scoped>
input[type="color"] { height: 32px; cursor: pointer; }
</style>
