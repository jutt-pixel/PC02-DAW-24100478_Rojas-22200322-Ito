<template>
  <q-chip
    clickable
    dense
    color="green-1"
    text-color="green-9"
    icon="paid"
    :aria-label="'Ver tipo de cambio de ' + currency.code"
    @click.stop="emit('select', currency)"
  >
    {{ currency.code }}
  </q-chip>
</template>

<script setup lang="ts">
// Chip de moneda reutilizable: al tocarlo avisa al padre para abrir el panel de cambio.
import type { Currency } from '@/types/country';

defineProps<{ currency: Currency }>();

const emit = defineEmits<{ select: [currency: Currency] }>();
</script>
