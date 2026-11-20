<template>
  <q-page class="page-container">
    <h1 class="text-h4 text-weight-bold q-my-none">Explorador de países</h1>
    <p class="text-muted q-mt-xs q-mb-lg">
      Busca por capital, filtra por continente, toca una tarjeta para ver el detalle o toca la
      moneda para ver su tasa
    </p>

    <CountryFilters v-model:search="search" v-model:continent="continent" class="q-mb-lg" />

    <LoadingGrid v-if="loading" />

    <StateMessage
      v-else-if="error"
      type="error"
      title="No se pudo cargar el listado"
      :message="error"
      show-retry
      @retry="reload"
    />

    <StateMessage
      v-else-if="!countries.length"
      title="Sin resultados"
      message="No hay países que coincidan con la búsqueda. Prueba con otra capital u otro continente."
      show-retry
      retry-label="Limpiar filtros"
      @retry="clearFilters"
    />

    <template v-else>
      <div class="text-caption text-muted q-mb-sm">{{ countries.length }} países</div>
      <div class="country-grid">
        <CountryCard
          v-for="country in countries"
          :key="country.code"
          :country="country"
          @open="openDetail"
          @currency="openCurrency"
        />
      </div>
    </template>

    <CurrencyDialog v-model="currencyOpen" :currency="selectedCurrency" />
  </q-page>
</template>

<script setup lang="ts">
// Pantalla 1: listado de paises con buscador por capital y filtro por continente.
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCountries } from '@/composables/useCountries';
import type { Country, Currency } from '@/types/country';
import CountryFilters from '@/components/CountryFilters.vue';
import CountryCard from '@/components/CountryCard.vue';
import LoadingGrid from '@/components/LoadingGrid.vue';
import StateMessage from '@/components/StateMessage.vue';
import CurrencyDialog from '@/components/CurrencyDialog.vue';

const router = useRouter();
const { search, continent, countries, loading, error, reload } = useCountries();

// Moneda elegida desde una tarjeta: abre el panel de tipo de cambio.
const selectedCurrency = ref<Currency | null>(null);
const currencyOpen = ref(false);

function openDetail(country: Country) {
  // La vista de detalle recibe el codigo ISO alpha-2 del pais en la ruta.
  void router.push('/pais/' + country.code.toLowerCase());
}

function openCurrency(currency: Currency) {
  selectedCurrency.value = currency;
  currencyOpen.value = true;
}

function clearFilters() {
  search.value = '';
  continent.value = '';
}
</script>
