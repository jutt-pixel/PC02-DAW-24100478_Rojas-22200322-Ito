<template>
  <div class="info-item">
    <div class="text-caption text-muted">{{ label }}</div>
    <div class="text-body1 text-weight-medium">
      <slot>{{ value }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// Bloque pequeno "etiqueta + valor" usado en la vista de detalle.
withDefaults(defineProps<{ label: string; value?: string }>(), { value: 'Sin dato' });
</script>

<style scoped>
.info-item {
  background: #f7f9fb;
  border-radius: 10px;
  padding: 12px 14px;
  height: 100%;
}
</style>
