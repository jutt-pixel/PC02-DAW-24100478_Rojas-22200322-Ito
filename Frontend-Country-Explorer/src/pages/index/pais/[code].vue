<template>
  <q-page class="page-container">
    <q-btn
      flat
      no-caps
      color="primary"
      icon="chevron_left"
      label="Volver al listado"
      class="q-mb-md"
      @click="goBack"
    />

    <!-- Estado de carga -->
    <q-card v-if="loading" flat bordered class="q-pa-lg detail-card">
      <div class="row items-center q-gutter-md">
        <q-skeleton width="120px" height="80px" />
        <div class="col">
          <q-skeleton type="text" width="50%" height="36px" />
          <q-skeleton type="QChip" />
        </div>
      </div>
      <q-skeleton height="72px" class="q-mt-lg" />
      <div class="row q-col-gutter-md q-mt-sm">
        <div v-for="n in 6" :key="n" class="col-12 col-sm-6 col-md-4">
          <q-skeleton height="64px" />
        </div>
      </div>
    </q-card>

    <!-- Estado de error -->
    <StateMessage
      v-else-if="error"
      type="error"
      title="No se pudo cargar el país"
      :message="error"
      show-retry
      @retry="reload"
    />

    <StateMessage
      v-else-if="notFound || !country"
      title="País no encontrado"
      message="El código indicado no corresponde a ningún país."
      show-retry
      retry-label="Volver al listado"
      @retry="goBack"
    />

    <!-- Detalle -->
    <q-card v-else flat bordered class="q-pa-lg detail-card">
      <div class="row items-center q-gutter-md">
        <img
          :src="flagUrl(country.code, 320)"
          :alt="'Bandera de ' + country.name"
          class="detail-flag"
        />
        <div>
          <h1 class="text-h4 text-weight-bold q-my-none">{{ country.name }}</h1>
          <q-chip dense color="blue-1" text-color="blue-9" class="q-ml-none q-mt-sm">
            {{ continentLabel(country) }}
          </q-chip>
        </div>
      </div>

      <div class="capital-box q-mt-lg">
        <q-icon name="place" size="28px" />
        <div class="q-ml-md">
          <div class="text-caption text-uppercase">Capital</div>
          <div class="text-h6 text-weight-bold">{{ country.capital }}</div>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-12 col-sm-6 col-md-4">
          <InfoItem label="Población" :value="formatPopulation(country.population)" />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <InfoItem label="Área" :value="formatArea(country.area)" />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <InfoItem label="Moneda">
            <template v-if="country.currencies.length">
              <q-btn
                v-for="currency in country.currencies"
                :key="currency.code"
                flat
                dense
                no-caps
                color="primary"
                icon-right="chevron_right"
                class="q-pa-none q-mr-sm"
                :label="(currency.name || currency.code) + ' (' + currency.code + ')'"
                @click="openCurrency(currency)"
              />
            </template>
            <span v-else>Sin dato</span>
          </InfoItem>
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <InfoItem label="Idiomas" :value="joinList(country.languages)" />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <InfoItem label="Zona horaria" :value="joinList(country.timezones)" />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <InfoItem label="Código telefónico" :value="callingCodes" />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <InfoItem label="Dominio" :value="joinList(country.domains)" />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <InfoItem label="Conducción" :value="drivingSideLabel(country.drivingSide)" />
        </div>
      </div>

      <div class="q-mt-lg">
        <div class="text-caption text-muted q-mb-xs">Países fronterizos</div>
        <div v-if="borders.length">
          <q-chip
            v-for="border in borders"
            :key="border.code3"
            :clickable="Boolean(border.code)"
            color="grey-2"
            text-color="grey-9"
            @click="openBorder(border)"
          >
            {{ border.name }}
          </q-chip>
        </div>
        <div v-else class="text-muted">No tiene países fronterizos.</div>
      </div>
    </q-card>

    <CurrencyDialog v-model="dialogOpen" :currency="selectedCurrency" />
  </q-page>
</template>

<script setup lang="ts">
// Pantalla 2: detalle de un pais. Reemplaza al listado (no es una ventana aparte).
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCountry } from '@/composables/useCountry';
import { flagUrl, formatPopulation, formatArea, drivingSideLabel, joinList } from '@/utils/format';
import { continentLabel } from '@/utils/labels';
import type { BorderCountry, Currency } from '@/types/country';
import InfoItem from '@/components/InfoItem.vue';
import StateMessage from '@/components/StateMessage.vue';
import CurrencyDialog from '@/components/CurrencyDialog.vue';

const route = useRoute();
const router = useRouter();

// Codigo ISO alpha-2 que llega en la ruta /pais/:code
const code = computed(() => String((route.params as { code?: string }).code ?? ''));
const { country, borders, loading, error, notFound, reload } = useCountry(code);

const dialogOpen = ref(false);
const selectedCurrency = ref<Currency | null>(null);

const callingCodes = computed(() => {
  const codes = country.value ? country.value.callingCodes : [];
  return codes.length ? codes.map((c) => '+' + c).join(', ') : 'Sin dato';
});

function openCurrency(currency: Currency) {
  selectedCurrency.value = currency;
  dialogOpen.value = true;
}

function goBack() {
  void router.push('/');
}

function openBorder(border: BorderCountry) {
  if (border.code) {
    void router.push('/pais/' + border.code.toLowerCase());
  }
}
</script>

<style scoped>
.detail-card {
  border-radius: 14px;
  max-width: 860px;
  margin: 0 auto;
}

.detail-flag {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e3e8ee;
}

.capital-box {
  display: flex;
  align-items: center;
  background: #1976d2;
  color: #fff;
  border-radius: 12px;
  padding: 14px 18px;
}
</style>
