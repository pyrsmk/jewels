<template>
  <div>
    <div class="color-palette">
      <div v-for="(color, i) in colors" :key="i" class="color-chip">
        <input
          type="color"
          :value="color"
          @input="updateColor(i, $event.target.value)"
          @change="updateColor(i, $event.target.value)"
        />
        <button v-if="colors.length > 1" type="button" class="remove-btn" @click="removeFluid(i)">×</button>
      </div>
      <button v-if="colors.length < 8" type="button" class="add-btn" @click="addFluid">+</button>
    </div>
    <label>
      Vitesse
      <span class="value">{{ (+(instance.options.speed ?? 0.4)).toFixed(2) }}</span>
    </label>
    <input
      type="range" min="0.2" max="1" step="0.01"
      :value="instance.options.speed ?? 0.4"
      @input="instance.options.speed = +$event.target.value"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({ instance: { type: Object, required: true } });

const colors = ref([...props.instance.colors]);

onMounted(() => {
  colors.value = [...props.instance.colors];
});

function commit() {
  props.instance.setFluids([...colors.value]);
}

function updateColor(i, val) {
  colors.value.splice(i, 1, val);
  commit();
}

function addFluid() {
  colors.value = [...colors.value, '#ffffff'];
  commit();
}

function removeFluid(i) {
  colors.value = colors.value.filter((_, j) => j !== i);
  commit();
}

watch(
  () => props.instance.colors,
  (newColors) => {
    if (JSON.stringify(newColors) !== JSON.stringify(colors.value)) {
      colors.value = [...newColors];
    }
  },
  { deep: true },
);
</script>

<style scoped>
.color-palette {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.color-chip {
  position: relative;
  width: 28px;
  height: 28px;
}
.color-chip input[type="color"] {
  width: 28px;
  height: 28px;
  cursor: pointer;
  border-radius: 4px;
  padding: 1px;
  border: 1px solid rgba(255,255,255,.15);
  background: none;
}
.remove-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 14px;
  height: 14px;
  font-size: 9px;
  border-radius: 50%;
  background: #444;
  color: #fff;
  border: none;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.color-chip:hover .remove-btn { display: flex; }
.remove-btn:hover { background: #ff6b6b; }
.add-btn {
  width: 28px;
  height: 28px;
  font-size: 18px;
  background: rgba(255,255,255,.06);
  border: 1px dashed rgba(255,255,255,.2);
  color: #aaa;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}
.add-btn:hover { background: rgba(255,255,255,.12); color: #fff; }
</style>
