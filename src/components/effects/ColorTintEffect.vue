<template>
  <div>
    <div id="colors">
      <div v-for="(color, i) in colors" :key="i" class="row">
        <input
          type="color"
          :value="color"
          @input="updateColor(i, $event.target.value)"
          @change="updateColor(i, $event.target.value)"
        />
        <button type="button" @click="removeColor(i)">×</button>
      </div>
    </div>
    <button type="button" @click="addColor">Ajouter une couleur</button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';


const props = defineProps({ instance: { type: Object, required: true } });

const colors = ref([...(props.instance.colors ?? ['#5900ff', '#00d5ff'])]);

onMounted(() => {
  colors.value = [...(props.instance.colors ?? ['#5900ff', '#00d5ff'])];
});

function updateColor(i, val) {
  colors.value[i] = val;
  onColorChange();
}

function removeColor(i) {
  colors.value.splice(i, 1);
  onColorChange();
}

function addColor() {
  colors.value.push('#ffffff');
  onColorChange();
}

function onColorChange() {
  props.instance.setColors([...colors.value]);
}

watch(
  () => props.instance.colors,
  (newColors) => {
    if (JSON.stringify(newColors) !== JSON.stringify(colors.value)) {
      colors.value = [...newColors];
    }
  },
  { deep: true }
);
</script>

<style scoped>
#colors .row {
  display: grid;
  grid-template-columns: 1fr 32px;
  gap: 6px;
  margin: 6px 0;
}
</style>