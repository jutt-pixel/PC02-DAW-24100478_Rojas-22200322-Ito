<template>
  <q-page class="detail-page page-width">
    <div class="detail-nav-row">
      <q-btn flat no-caps icon="arrow_back" label="Todos los países" class="back-button" to="/" />
      <div class="breadcrumb gt-xs">
        Explorar <q-icon name="chevron_right" /> <span>Detalle del país</span>
      </div>
    </div>

    <section v-if="loading" class="detail-loading">
      <q-skeleton height="300px" class="detail-hero-skeleton" />
      <div class="detail-skeleton-grid">
        <q-skeleton v-for="item in 6" :key="item" height="120px" />
      </div>
    </section>

    <section v-else-if="error" class="state-panel detail-error" role="alert">
      <div class="state-icon state-icon-error"><q-icon name="travel_explore" /></div>
      <div class="eyebrow">DETALLE NO DISPONIBLE</div>
      <h2>No pudimos cargar este país</h2>
      <p>{{ error }}</p>
      <q-btn
        unelevated
        no-caps
        label="Volver al listado"
        icon="arrow_back"
        class="primary-button"
        to="/"
      />
    </section>

    <template v-else-if="country">
      <section class="detail-hero">
        <div class="hero-copy">
          <div class="eyebrow"><span class="eyebrow-line"></span> PERFIL DEL PAÍS</div>
          <div class="detail-title-row">
            <h1>{{ country.names?.common || 'País' }}</h1>
            <span v-if="country.codes?.alpha_2" class="detail-country-code">{{
              country.codes.alpha_2
            }}</span>
          </div>
          <p class="official-name">{{ country.names?.official || country.names?.common }}</p>
          <div class="detail-tags">
            <span class="detail-tag"
              ><q-icon name="public" /> {{ country.region || 'Región no disponible' }}</span
            >
            <span v-if="country.subregion" class="detail-tag detail-tag-muted">{{
              country.subregion
            }}</span>
          </div>
          <div class="capital-callout">
            <div class="capital-icon"><q-icon name="location_city" /></div>
            <div>
              <span>CAPITAL</span>
              <strong>{{ capitalName || 'No disponible' }}</strong>
            </div>
            <q-icon name="north_east" class="capital-corner" />
          </div>
        </div>

        <div class="detail-flag-wrap">
          <div class="flag-shadow"></div>
          <img
            v-if="flagUrl"
            :src="flagUrl"
            :alt="`Bandera de ${country.names?.common || 'este país'}`"
            class="detail-flag"
            @error="flagUrl = ''"
          />
          <div v-else class="detail-flag-emoji">{{ country.flag?.emoji || '🌐' }}</div>
          <div class="flag-caption">{{ country.codes?.alpha_3 || country.codes?.alpha_2 }}</div>
        </div>
        <div class="hero-decoration hero-decoration-one"></div>
        <div class="hero-decoration hero-decoration-two"></div>
      </section>

      <section class="detail-content-grid">
        <div class="facts-column">
          <div class="section-heading-row detail-section-heading">
            <div>
              <div class="eyebrow">INFORMACIÓN GENERAL</div>
              <h2>Datos del país</h2>
            </div>
            <span class="section-index">01 — 02</span>
          </div>

          <div class="facts-grid">
            <article class="fact-card fact-card-highlight">
              <div class="fact-icon"><q-icon name="groups" /></div>
              <span class="fact-label">Población</span>
              <strong>{{ formatNumber(country.population) }}</strong>
              <span class="fact-caption">habitantes</span>
            </article>
            <article class="fact-card">
              <div class="fact-icon"><q-icon name="straighten" /></div>
              <span class="fact-label">Superficie</span>
              <strong>{{ formatNumber(country.area?.kilometers) }}</strong>
              <span class="fact-caption">kilómetros cuadrados</span>
            </article>
            <article class="fact-card fact-card-wide">
              <div class="fact-icon"><q-icon name="translate" /></div>
              <span class="fact-label">Idiomas</span>
              <div v-if="country.languages?.length" class="fact-chip-list">
                <span
                  v-for="(language, index) in country.languages"
                  :key="language.name || language.native || index"
                  class="soft-chip"
                >
                  {{ language.name || language.native || 'Idioma' }}
                </span>
              </div>
              <strong v-else class="fact-empty">No disponible</strong>
            </article>
            <article class="fact-card fact-card-wide">
              <div class="fact-icon"><q-icon name="schedule" /></div>
              <span class="fact-label">Zonas horarias</span>
              <div v-if="country.timezones?.length" class="fact-chip-list">
                <span
                  v-for="timezone in country.timezones.slice(0, 6)"
                  :key="timezone"
                  class="soft-chip soft-chip-neutral"
                >
                  {{ timezone }}
                </span>
                <span v-if="country.timezones.length > 6" class="soft-chip soft-chip-neutral"
                  >+{{ country.timezones.length - 6 }}</span
                >
              </div>
              <strong v-else class="fact-empty">No disponible</strong>
            </article>
            <article class="fact-card">
              <div class="fact-icon"><q-icon name="phone_in_talk" /></div>
              <span class="fact-label">Código telefónico</span>
              <strong>{{ callingCodes || 'No disponible' }}</strong>
            </article>
            <article class="fact-card">
              <div class="fact-icon"><q-icon name="language" /></div>
              <span class="fact-label">Dominio</span>
              <strong>{{ domains || 'No disponible' }}</strong>
            </article>
            <article class="fact-card fact-card-wide fact-card-driving">
              <div class="fact-icon"><q-icon name="directions_car" /></div>
              <span class="fact-label">Lado de conducción</span>
              <strong>{{ drivingSide }}</strong>
              <span class="fact-caption">en las vías del país</span>
            </article>
          </div>

          <section class="borders-section">
            <div class="borders-heading">
              <div class="borders-icon"><q-icon name="share_location" /></div>
              <div>
                <div class="eyebrow">GEOGRAFÍA</div>
                <h3>Países fronterizos</h3>
              </div>
              <span class="border-count">{{ borderCountries.length }}</span>
            </div>
            <div v-if="borderCountries.length" class="border-chips">
              <span v-for="border in borderCountries" :key="border.code" class="border-chip">
                <img v-if="border.flag" :src="border.flag" :alt="''" loading="lazy" />
                <span>{{ border.name }}</span>
              </span>
            </div>
            <p v-else class="no-borders">Este país no tiene fronteras terrestres.</p>
          </section>
        </div>

        <aside class="currency-column">
          <div class="section-heading-row detail-section-heading">
            <div>
              <div class="eyebrow">DIVISA OFICIAL</div>
              <h2>Moneda</h2>
            </div>
            <span class="section-index">02 — 02</span>
          </div>

          <article v-if="currency" class="currency-feature-card">
            <div class="currency-feature-top">
              <div class="large-currency-symbol">
                {{ currency.symbol || currency.code.slice(0, 1) }}
              </div>
              <span class="currency-code-pill">{{ currency.code }}</span>
            </div>
            <div class="eyebrow">MONEDA LOCAL</div>
            <h3>{{ currency.name }}</h3>
            <p>Consulta el valor de referencia y convierte un monto a dólares estadounidenses.</p>
            <div class="currency-feature-divider"></div>
            <div class="currency-rate-teaser">
              <span><q-icon name="show_chart" /> Consulta la tasa actual</span>
              <q-icon name="east" />
            </div>
            <q-btn
              unelevated
              no-caps
              icon-right="north_east"
              label="Ver tipo de cambio"
              class="currency-open-button"
              @click="currencyDialogOpen = true"
            />
          </article>
          <article v-else class="no-currency-card">
            <div class="currency-empty-icon"><q-icon name="payments" /></div>
            <h3>Moneda no disponible</h3>
            <p>La API no reporta una moneda oficial para este territorio.</p>
          </article>

          <div class="source-note">
            <q-icon name="info_outline" />
            <span
              >Los tipos de cambio se consultan en RestCountries y pueden actualizarse según el plan
              de la API.</span
            >
          </div>
        </aside>
      </section>
    </template>

    <footer v-if="country && !loading" class="page-footer detail-footer">
      <span>Country Explorer <i>·</i> Datos provistos por RestCountries</span>
      <q-btn flat dense no-caps icon="arrow_back" label="Volver a explorar" to="/" />
    </footer>

    <CurrencyRateDialog v-model="currencyDialogOpen" :currency="currency" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import CurrencyRateDialog from '@/components/CurrencyRateDialog.vue';
import {
  getCountryByAlpha2,
  getCountryByAlpha3,
  toUserMessage,
  type Country,
  type CurrencyInfo,
} from '@/services/restCountries';

interface BorderCountry {
  code: string;
  name: string;
  flag: string;
}

const route = useRoute();
const country = ref<Country | null>(null);
const borderCountries = ref<BorderCountry[]>([]);
const loading = ref(true);
const error = ref('');
const currencyDialogOpen = ref(false);
const flagUrl = ref('');

const capitalName = computed(() => country.value?.capitals?.[0]?.name ?? '');
const callingCodes = computed(
  () =>
    country.value?.calling_codes?.map((code) => `+${code.replace(/^\+/, '')}`).join(' · ') ?? '',
);
const domains = computed(() => country.value?.tlds?.join(' · ') ?? '');
const drivingSide = computed(() => {
  const side = country.value?.cars?.driving_side;
  if (side === 'left') return 'Izquierda';
  if (side === 'right') return 'Derecha';
  return 'No disponible';
});
const currency = computed<CurrencyInfo | null>(() => {
  const [code, details] = Object.entries(country.value?.currencies ?? {})[0] ?? [];
  if (!code) return null;
  return { code, name: details?.name || code, symbol: details?.symbol ?? null };
});

watch(
  () => (route.params as Record<string, string | string[]>).code,
  (code) => {
    if (typeof code === 'string') void loadCountry(code);
  },
  { immediate: true },
);

async function loadCountry(code: string) {
  loading.value = true;
  error.value = '';
  country.value = null;
  borderCountries.value = [];
  try {
    const result = await getCountryByAlpha2(code);
    country.value = result;
    const alpha2 = result.codes?.alpha_2?.toLowerCase();
    flagUrl.value = alpha2 ? `https://flagcdn.com/w320/${alpha2}.png` : '';

    const borderCodes = result.borders ?? [];
    const borderDetails = await Promise.all(
      borderCodes.map(async (borderCode) => {
        const border = await getCountryByAlpha3(borderCode);
        return {
          code: borderCode,
          name: border?.names?.common || borderCode,
          flag: border?.codes?.alpha_2
            ? `https://flagcdn.com/w80/${border.codes.alpha_2.toLowerCase()}.png`
            : '',
        };
      }),
    );
    borderCountries.value = borderDetails;
  } catch (cause) {
    error.value = toUserMessage(cause);
  } finally {
    loading.value = false;
  }
}

function formatNumber(value: number | null | undefined) {
  if (value == null) return 'No disponible';
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(value);
}
</script>
