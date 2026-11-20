<template>
  <q-page class="explore-page page-width">
    <section class="intro-row">
      <div class="intro-copy">
        <div class="eyebrow"><span class="eyebrow-line"></span> UNA MIRADA AL MUNDO</div>
        <h1>El mundo, más cerca de ti<span class="title-period">.</span></h1>
        <p>Encuentra un país, descubre sus detalles y revisa su moneda en segundos.</p>
      </div>
      <div class="intro-art">
        <img
          src="/country-explorer-hero.png"
          alt="Globo terráqueo, banderas, mapa, lupa y monedas que representan la exploración de países"
          class="intro-art-image"
        />
      </div>
    </section>

    <section id="resultados" class="section-heading-row search-results-heading">
      <div>
        <div class="eyebrow">DESCUBRE</div>
        <h2>{{ capitalQuery ? `Resultados para “${capitalQuery}”` : 'Todos los países' }}</h2>
        <q-btn
          v-if="capitalQuery"
          flat
          dense
          no-caps
          icon="close"
          label="Limpiar búsqueda"
          :to="{ path: '/', query: continent ? { continente: continent } : {} }"
          class="clear-search"
        />
      </div>
      <div class="results-summary">
        <span v-if="continent" class="results-label">{{ continentName(continent) }}</span>
        <div class="results-label" role="status">
          <span class="results-dot"></span>
          {{
            loading
              ? 'Buscando países'
              : error
                ? '0 países'
                : countries.length === 1
                  ? '1 país'
                  : `${countries.length} países`
          }}
        </div>
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
        <q-btn
          outline
          no-caps
          icon="visibility"
          label="Ver ejemplo: Perú y su moneda"
          :to="{ path: '/country/pe', query: { ejemplo: '1' } }"
        />
        <a href="https://restcountries.com/docs" target="_blank" rel="noreferrer"
          >Ver documentación API <q-icon name="north_east"
        /></a>
      </div>
      <p class="q-mt-md">
        El ejemplo permite revisar la interfaz. La tasa y la conversión requieren conexión a la API.
      </p>
    </section>

    <section v-else-if="!countries.length" class="state-panel" role="status">
      <div class="state-icon"><q-icon name="travel_explore" /></div>
      <h2>No encontramos países</h2>
      <p v-if="capitalQuery && continent">Prueba a buscar la capital en todos los continentes.</p>
      <p v-else>Prueba con otra capital o cambia el continente.</p>
      <q-btn
        v-if="capitalQuery && continent"
        unelevated
        no-caps
        label="Buscar en todos los continentes"
        class="primary-button q-mt-md"
        @click="setContinent('')"
      />
      <q-btn flat no-caps label="Limpiar filtros" to="/" />
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
        @keydown.enter.self="openCountry(country)"
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
          <div class="country-region">
            {{ formatContinents(country.continents, country.region) }}
          </div>
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
              v-for="currency in getCountryCurrencies(country)"
              :key="currency.code"
              flat
              dense
              no-caps
              class="currency-chip"
              :label="currency.code"
              :aria-label="`Ver tipo de cambio de ${currency.name}`"
              @click.stop="openCurrency(currency)"
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
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CurrencyRateDialog from '@/components/CurrencyRateDialog.vue';
import { continentName, continentOptions, formatContinents } from '@/data/continents';
import {
  getCountries,
  getCountryCurrencies,
  getCountriesByContinent,
  searchCountriesByCapital,
  toUserMessage,
  type Country,
  type CurrencyInfo,
} from '@/services/restCountries';

const router = useRouter();
const route = useRoute();
const countries = ref<Country[]>([]);
const loading = ref(true);
const error = ref('');
const currencyDialogOpen = ref(false);
const selectedCurrency = ref<CurrencyInfo | null>(null);

const capitalQuery = computed(() =>
  typeof route.query.capital === 'string' ? route.query.capital.trim() : '',
);
const continent = computed(
  () => continentOptions.find(({ value }) => value === route.query.continente)?.value ?? '',
);
function setContinent(value: string) {
  const query = { ...route.query };
  if (value) query.continente = value;
  else delete query.continente;
  void router.push({ path: '/', query, hash: route.hash });
}

let requestId = 0;
watch(
  [capitalQuery, continent],
  () => {
    void loadCountries();
  },
  { immediate: true },
);

async function loadCountries() {
  const currentRequest = ++requestId;
  loading.value = true;
  error.value = '';
  try {
    const capital = capitalQuery.value;
    const region = continent.value;
    let result: Country[];
    if (capital) {
      result = await searchCountriesByCapital(capital);
      if (region) result = result.filter((country) => country.region === region);
    } else {
      result = await (region ? getCountriesByContinent(region) : getCountries());
    }
    if (currentRequest === requestId) countries.value = result;
  } catch (cause) {
    if (currentRequest === requestId) error.value = toUserMessage(cause);
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

function openCountry(country: Country) {
  const code = country.codes?.alpha_2;
  if (code) {
    const { capital, continente } = route.query;
    void router.push({ path: `/country/${code.toLowerCase()}`, query: { capital, continente } });
  }
}

function openCurrency(currency: CurrencyInfo) {
  selectedCurrency.value = currency;
  currencyDialogOpen.value = true;
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
