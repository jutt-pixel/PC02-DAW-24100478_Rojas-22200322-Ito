<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <!-- Sin clave no se puede consultar la API: se explica como configurarla. -->
      <MissingKeyNotice v-if="!keyConfigured" />
      <router-view v-else />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// Estructura comun de las pantallas (listado y detalle).
import { hasApiKey } from '@/services/http';
import MissingKeyNotice from '@/components/MissingKeyNotice.vue';

const keyConfigured = hasApiKey();
</script>
