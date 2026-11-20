<template>
  <q-card
    flat
    bordered
    class="country-card cursor-pointer"
    tabindex="0"
    role="button"
    :aria-label="'Ver detalle de ' + country.name"
    @click="emit('open', country)"
    @keyup.enter="emit('open', country)"
  >
    <q-card-section>
      <div class="row items-center no-wrap q-gutter-sm">
        <img
          :src="flag"
          :alt="'Bandera de ' + country.name"
          class="country-card__flag"
          loading="lazy"
        />
        <div class="text-subtitle1 text-weight-bold ellipsis">{{ country.name }}</div>
      </div>

      <div class="row items-center justify-between no-wrap q-mt-sm text-muted">
        <span class="ellipsis">Capital: {{ country.capital }}</span>
        <span class="text-weight-medium q-ml-sm">{{ formatPopulation(country.population) }}</span>
      </div>

      <div class="row items-center q-mt-sm">
        <q-chip dense color="blue-1" text-color="blue-9" class="q-ml-none">
          {{ continentLabel(country) }}
        </q-chip>
        <CurrencyChip
          v-for="currency in country.currencies"
          :key="currency.code"
          :currency="currency"
          @select="emit('currency', currency)"
        />
        <span v-if="!country.currencies.length" class="text-caption text-muted">Sin moneda</span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
// Tarjeta de un pais en el listado.
import { computed } from 'vue';
import { flagUrl, formatPopulation } from '@/utils/format';
import { continentLabel } from '@/utils/labels';
import type { Country, Currency } from '@/types/country';
import CurrencyChip from '@/components/CurrencyChip.vue';

const props = defineProps<{ country: Country }>();

const emit = defineEmits<{
  open: [country: Country];
  currency: [currency: Currency];
}>();

const flag = computed(() => flagUrl(props.country.code, 80));
</script>

<style scoped>
.country-card {
  border-radius: 12px;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.country-card:hover,
.country-card:focus-visible {
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
  transform: translateY(-2px);
  outline: none;
}

.country-card__flag {
  width: 48px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e3e8ee;
}
</style>
