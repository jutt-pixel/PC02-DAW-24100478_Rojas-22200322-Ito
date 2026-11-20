<template>
  <div class="row q-col-gutter-md items-end">
    <div class="col-12 col-md-9">
      <div class="text-caption text-weight-medium q-mb-xs">Buscar</div>
      <q-input
        :model-value="search"
        outlined
        dense
        clearable
        bg-color="white"
        placeholder="Buscar por capital..."
        aria-label="Buscar por capital"
        @update:model-value="onSearch"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>
    <div class="col-12 col-md-3">
      <div class="text-caption text-weight-medium q-mb-xs">Continente</div>
      <q-select
        v-model="continent"
        :options="CONTINENTS"
        outlined
        dense
        bg-color="white"
        emit-value
        map-options
        aria-label="Filtrar por continente"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Buscador por capital y selector de continente.
import { CONTINENTS } from '@/services/countries';

const search = defineModel<string>('search', { default: '' });
const continent = defineModel<string>('continent', { default: '' });

function onSearch(value: string | number | null) {
  // Al limpiar el campo Quasar entrega null: se guarda como texto vacio.
  search.value = value === null ? '' : String(value);
}
</script>
