<template>
  <q-page class="explore-page page-width">
    <section class="intro-row">
      <div class="intro-copy">
        <div class="eyebrow"><span class="eyebrow-line"></span> UNA MIRADA AL MUNDO</div>
        <h1>Explora el mundo<span class="title-period">.</span></h1>
        <p>Encuentra un país, descubre sus detalles y revisa su moneda en segundos.</p>
      </div>
      <div class="intro-map" aria-hidden="true">
        <div class="map-orbit orbit-one"></div>
        <div class="map-orbit orbit-two"></div>
        <q-icon name="public" class="map-globe" />
        <span class="map-pin pin-one"></span><span class="map-pin pin-two"></span>
      </div>
    </section>

    <section class="filters-row" aria-label="Filtros del listado">
      <div class="filter-field filter-search">
        <label for="capital-search">Buscar</label>
        <q-input
          id="capital-search"
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
      <div class="filter-field filter-continent">
        <label for="continent-select">Continente</label>
        <q-select
          v-model="continent"
          for="continent-select"
          :options="continentOptions"
          outlined
          dense
          bg-color="white"
          emit-value
          map-options
          aria-label="Filtrar por continente"
        />
      </div>
    </section>

    <section class="section-heading-row">
      <div>
        <div class="eyebrow">DESCUBRE</div>
        <h2>{{ hasFilters ? 'Resultados' : 'Todos los países' }}</h2>
      </div>
      <div class="results-label">
        <span class="results-dot"></span>
        {{ loading ? 'Buscando países' : `${countries.length} países` }}
      </div>
    </section>

    <div v-if="loading" class="country-grid" aria-label="Cargando países">
      <q-card v-for="item in 8" :key="item" flat class="country-card skeleton-card">
        <q-skeleton height="150px" />
        <q-card-section>
          <q-skeleton type="text" width="65%" />
          <q-skeleton type="text" width="45%" />
          <q-skeleton type="text" width="80%" />
        </q-card-section>
      </q-card>
    </div>

    <section v-else-if="error" class="state-panel" role="alert">
      <div class="state-icon state-icon-error"><q-icon name="cloud_off" /></div>
      <div class="eyebrow">NO SE PUDO CARGAR EL LISTADO</div>
      <h2>Conectemos con RestCountries</h2>
      <p>{{ error }}</p>
      <div class="state-actions">
        <q-btn
          unelevated
          no-caps
          icon="refresh"
          label="Reintentar"
          class="primary-button"
          @click="loadCountries"
        />
        <a href="https://restcountries.com/docs" target="_blank" rel="noreferrer"
          >Ver documentación API <q-icon name="north_east"
        /></a>
      </div>
    </section>

    <section v-else-if="!countries.length" class="state-panel">
      <div class="state-icon"><q-icon name="travel_explore" /></div>
      <div class="eyebrow">SIN RESULTADOS</div>
      <h2>No encontramos países</h2>
      <p>Prueba con otra capital u otro continente.</p>
      <div class="state-actions">
        <q-btn
          unelevated
          no-caps
          icon="filter_alt_off"
          label="Limpiar filtros"
          class="primary-button"
          @click="clearFilters"
        />
      </div>
    </section>

    <div v-else class="country-grid">
      <q-card
        v-for="country in countries"
        :key="country.codes?.alpha_2 || country.names?.common || 'unknown'"
        flat
        class="country-card"
        tabindex="0"
        role="link"
        :aria-label="`Ver detalles de ${country.names?.common || 'país'}`"
        @click="openCountry(country)"
        @keydown.enter="openCountry(country)"
      >
        <div class="country-card-image">
          <div class="country-flag-fallback">
            {{ country.flag?.emoji || '🌐' }}
            <img
              v-if="countryFlagUrl(country)"
              :src="countryFlagUrl(country)"
              :alt="`Bandera de ${country.names?.common || 'país'}`"
              loading="lazy"
              @error="hideFlagImage"
            />
          </div>
          <div class="country-region">{{ continentLabel(country) }}</div>
          <q-btn
            round
            flat
            icon="arrow_outward"
            class="country-arrow"
            aria-label="Abrir detalle"
            @click.stop="openCountry(country)"
          />
        </div>
        <q-card-section class="country-card-content">
          <div class="country-card-title-row">
            <h3>{{ country.names?.common || 'País' }}</h3>
            <span class="country-code">{{ country.codes?.alpha_2 || '—' }}</span>
          </div>
          <div class="country-capital">
            <q-icon name="location_on" />
            {{ country.capitals?.[0]?.name || 'Capital no disponible' }}
          </div>
          <div class="country-card-footer">
            <span class="population-note"
              ><q-icon name="groups" /> {{ formatPopulation(country.population) }}</span
            >
            <q-btn
              v-if="getCurrency(country)"
              flat
              dense
              no-caps
              class="currency-chip"
              :label="getCurrency(country)?.code"
              :aria-label="`Ver tipo de cambio de ${getCurrency(country)?.name}`"
              @click.stop="openCurrency(country)"
            >
              <q-tooltip>Consultar tipo de cambio</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <footer class="page-footer">
      <span>Datos de países y monedas en tiempo real</span>
      <span>Desarrollo de Aplicaciones Web <i>·</i> PC02</span>
    </footer>

    <CurrencyRateDialog v-model="currencyDialogOpen" :currency="selectedCurrency" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import CurrencyRateDialog from '@/components/CurrencyRateDialog.vue';
import {
  getCountries,
  getCountriesByContinent,
  searchCountriesByCapital,
  toUserMessage,
  type Country,
  type CurrencyInfo,
} from '@/services/restCountries';

const router = useRouter();
const countries = ref<Country[]>([]);
const loading = ref(true);
const error = ref('');
const currencyDialogOpen = ref(false);
const selectedCurrency = ref<CurrencyInfo | null>(null);

// Filtros del listado: texto de la capital y continente (valor "region" de la API).
const search = ref('');
const continent = ref('');
const continentOptions = [
  { label: 'Todos los continentes', value: '' },
  { label: 'África', value: 'Africa' },
  { label: 'América', value: 'Americas' },
  { label: 'Asia', value: 'Asia' },
  { label: 'Europa', value: 'Europe' },
  { label: 'Oceanía', value: 'Oceania' },
  { label: 'Antártida', value: 'Antarctic' },
];
const continentNames: Record<string, string> = {
  Africa: 'África',
  Americas: 'América',
  'North America': 'Norteamérica',
  'South America': 'Sudamérica',
  Asia: 'Asia',
  Europe: 'Europa',
  Oceania: 'Oceanía',
  Antarctic: 'Antártida',
  Antarctica: 'Antártida',
};
const hasFilters = computed(() => search.value.trim() !== '' || continent.value !== '');

let searchTimer: ReturnType<typeof setTimeout> | undefined;
let lastRequest = 0;

onMounted(loadCountries);

// Espera 400 ms despues de la ultima tecla para no gastar consultas.
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => void loadCountries(), 400);
});
watch(continent, () => {
  clearTimeout(searchTimer);
  void loadCountries();
});

async function loadCountries() {
  const requestId = ++lastRequest;
  loading.value = true;
  error.value = '';

  const text = search.value.trim();
  const region = continent.value;

  try {
    let result: Country[];
    if (text) {
      // Con texto se consulta por capital; el continente se aplica sobre ese resultado.
      result = await searchCountriesByCapital(text);
      if (region) result = result.filter((country) => country.region === region);
    } else if (region) {
      result = await getCountriesByContinent(region);
    } else {
      result = await getCountries();
    }
    // Si llega una respuesta antigua despues de una nueva, se descarta.
    if (requestId !== lastRequest) return;
    countries.value = result;
  } catch (cause) {
    if (requestId !== lastRequest) return;
    countries.value = [];
    error.value = toUserMessage(cause);
  } finally {
    if (requestId === lastRequest) loading.value = false;
  }
}

function onSearch(value: string | number | null) {
  // Al limpiar el campo, Quasar entrega null.
  search.value = value === null ? '' : String(value);
}

function clearFilters() {
  search.value = '';
  continent.value = '';
}

function continentLabel(country: Country) {
  const value = country.continents?.[0] || country.region || '';
  return continentNames[value] ?? (value || 'Continente no disponible');
}

function getCurrency(country: Country): CurrencyInfo | null {
  const [code, currency] = Object.entries(country.currencies ?? {})[0] ?? [];
  if (!code) return null;
  return { code, name: currency?.name || code, symbol: currency?.symbol ?? null };
}

function openCountry(country: Country) {
  const code = country.codes?.alpha_2;
  if (code) void router.push(`/country/${code.toLowerCase()}`);
}

function openCurrency(country: Country) {
  selectedCurrency.value = getCurrency(country);
  currencyDialogOpen.value = selectedCurrency.value !== null;
}

function formatPopulation(population: number | null | undefined) {
  if (population == null) return 'Población n/d';
  return new Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 1 }).format(
    population,
  );
}

function countryFlagUrl(country: Country) {
  const alpha2 = country.codes?.alpha_2?.toLowerCase();
  return alpha2 ? `https://flagcdn.com/w160/${alpha2}.png` : '';
}

function hideFlagImage(event: Event) {
  (event.currentTarget as HTMLImageElement).style.display = 'none';
}
</script>
