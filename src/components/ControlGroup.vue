<template>
  <div class="group">
    <slot />
  </div>
</template>

<script setup>
defineProps({ title: { type: String, default: null } });
</script>