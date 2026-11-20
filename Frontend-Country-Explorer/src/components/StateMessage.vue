<template>
  <div class="column items-center text-center q-pa-xl">
    <q-icon
      :name="type === 'error' ? 'error_outline' : 'travel_explore'"
      :color="type === 'error' ? 'negative' : 'grey-6'"
      size="56px"
    />
    <div class="text-h6 q-mt-md">{{ title }}</div>
    <div v-if="message" class="text-muted q-mt-xs">{{ message }}</div>
    <q-btn
      v-if="showRetry"
      class="q-mt-md"
      color="primary"
      unelevated
      no-caps
      icon="refresh"
      :label="retryLabel"
      @click="emit('retry')"
    />
  </div>
</template>

<script setup lang="ts">
// Mensaje reutilizable para los estados de error y de "sin resultados".
withDefaults(
  defineProps<{
    type?: 'empty' | 'error';
    title: string;
    message?: string;
    retryLabel?: string;
    showRetry?: boolean;
  }>(),
  {
    type: 'empty',
    message: '',
    retryLabel: 'Reintentar',
    showRetry: false,
  },
);

const emit = defineEmits<{ retry: [] }>();
</script>
