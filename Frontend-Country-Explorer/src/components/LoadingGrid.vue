<template>
  <div class="country-grid" aria-busy="true" aria-label="Cargando países">
    <q-card v-for="n in count" :key="n" flat bordered class="q-pa-md">
      <div class="row items-center no-wrap q-gutter-sm">
        <q-skeleton width="48px" height="32px" />
        <q-skeleton type="text" width="60%" />
      </div>
      <q-skeleton type="text" class="q-mt-md" width="80%" />
      <div class="row q-gutter-sm q-mt-sm">
        <q-skeleton type="QChip" />
        <q-skeleton type="QChip" />
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
// Tarjetas "esqueleto" que se muestran mientras carga el listado.
withDefaults(defineProps<{ count?: number }>(), { count: 8 });
</script>
