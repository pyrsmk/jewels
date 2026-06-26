<template>
  <div>
    <label>Couleur</label>
    <input
      type="color"
      :value="color"
      @input="updateColor($event.target.value)"
      @change="updateColor($event.target.value)"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({ instance: { type: Object, required: true } });

const color = ref(props.instance.options.color ?? '#000000');

onMounted(() => {
  color.value = props.instance.options.color ?? '#000000';
});

function updateColor(val) {
  color.value = val;
  props.instance.setColor(val);
}

watch(() => props.instance.options.color, (val) => {
  if (val !== color.value) {
    color.value = val ?? '#000000';
  }
});
</script>

<style scoped>
input[type="color"] { height: 32px; cursor: pointer; }
</style>
