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

    <section class="section-heading-row">
      <div>
        <div class="eyebrow">DESCUBRE</div>
        <h2>Países destacados</h2>
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
          <div class="country-region">{{ country.region || 'Región no disponible' }}</div>
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
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import CurrencyRateDialog from '@/components/CurrencyRateDialog.vue';
import {
  getCountries,
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

onMounted(loadCountries);

async function loadCountries() {
  loading.value = true;
  error.value = '';
  try {
    countries.value = await getCountries();
  } catch (cause) {
    error.value = toUserMessage(cause);
  } finally {
    loading.value = false;
  }
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
