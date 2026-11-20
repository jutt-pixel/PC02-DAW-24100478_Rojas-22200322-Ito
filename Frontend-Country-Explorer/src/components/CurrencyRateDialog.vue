<template>
  <q-dialog v-model="isOpen" persistent transition-show="scale" transition-hide="scale">
    <q-card class="currency-dialog">
      <div class="dialog-topline">
        <div class="currency-symbol-mark">
          {{ currency?.symbol || currency?.code?.slice(0, 1) || '¤' }}
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-7"
          aria-label="Cerrar panel de moneda"
          @click="isOpen = false"
        />
      </div>

      <div class="dialog-heading">
        <div class="eyebrow">CONVERSOR DE DIVISAS</div>
        <h2>{{ currency?.name || 'Moneda' }}</h2>
        <div class="currency-code-line">
          <span class="currency-code-pill">{{ currency?.code || '—' }}</span>
          <span v-if="currency?.symbol" class="muted-copy">Símbolo {{ currency.symbol }}</span>
        </div>
      </div>

      <q-card-section class="rate-panel">
        <div class="rate-panel-top">
          <div>
            <div class="rate-label">Tipo de cambio actual</div>
            <div class="rate-base">frente al dólar estadounidense</div>
          </div>
          <span class="live-indicator"><i></i> API</span>
        </div>

        <q-skeleton v-if="loadingRate" type="text" width="78%" height="42px" class="q-mt-sm" />
        <div v-else-if="rateError" class="inline-error q-mt-md">
          <q-icon name="error_outline" />
          <span>{{ rateError }}</span>
          <q-btn flat dense no-caps label="Reintentar" @click="loadRate" />
        </div>
        <template v-else>
          <div class="rate-value">
            <span>1 {{ currency?.code }}</span>
            <q-icon name="east" size="18px" />
            <strong>{{ formatRate(rate) }} <small>USD</small></strong>
          </div>
          <div v-if="asOf" class="rate-updated">Datos del {{ formatDate(asOf) }}</div>
        </template>
      </q-card-section>

      <q-card-section class="convert-section">
        <div class="convert-section-heading">
          <div>
            <div class="eyebrow">HAZ EL CÁLCULO</div>
            <h3>Convierte a USD</h3>
          </div>
          <div class="convert-target">USD <span>$</span></div>
        </div>

        <q-form class="convert-form" @submit.prevent="convert">
          <q-input
            v-model.number="amount"
            outlined
            dense
            type="number"
            min="0.01"
            step="any"
            :prefix="currency?.symbol || undefined"
            :suffix="currency?.symbol ? undefined : currency?.code"
            label="Monto a convertir"
            inputmode="decimal"
            :disable="converting"
            class="amount-input"
          />
          <q-btn
            type="submit"
            unelevated
            no-caps
            icon-right="arrow_forward"
            label="Convertir a USD"
            class="convert-button"
            :loading="converting"
            :disable="!currency?.code || converting"
          />
        </q-form>

        <div v-if="conversionError" class="conversion-error">{{ conversionError }}</div>
        <div v-else-if="convertedAmount !== null" class="conversion-result" aria-live="polite">
          <div>
            <span class="result-label">Resultado estimado</span>
            <strong>{{ formatUsd(convertedAmount) }}</strong>
          </div>
          <q-icon name="check_circle" color="positive" size="22px" />
        </div>
        <p class="conversion-footnote">
          Tasas de referencia. El monto final puede variar según el proveedor de cambio.
        </p>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  convertToUsd,
  getUsdRate,
  toUserMessage,
  type CurrencyInfo,
} from '@/services/restCountries';

const props = defineProps<{ currency: CurrencyInfo | null }>();
const isOpen = defineModel<boolean>({ default: false });

const loadingRate = ref(false);
const converting = ref(false);
const rate = ref<number | null>(null);
const asOf = ref<number | null>(null);
const rateError = ref('');
const conversionError = ref('');
const amount = ref<number | null>(1);
const convertedAmount = ref<number | null>(null);

const currencyCode = computed(() => props.currency?.code?.toUpperCase() ?? '');

watch(
  [isOpen, currencyCode],
  ([open]) => {
    if (open) {
      amount.value = 1;
      convertedAmount.value = null;
      conversionError.value = '';
      void loadRate();
    }
  },
  { immediate: true },
);

async function loadRate() {
  if (!currencyCode.value) return;
  loadingRate.value = true;
  rateError.value = '';
  rate.value = null;
  asOf.value = null;
  try {
    const response = await getUsdRate(currencyCode.value);
    rate.value = response.rates.USD ?? null;
    asOf.value = response.as_of;
  } catch (error) {
    rateError.value = toUserMessage(error);
  } finally {
    loadingRate.value = false;
  }
}

async function convert() {
  const value = Number(amount.value);
  if (!Number.isFinite(value) || value <= 0) {
    conversionError.value = 'Ingresa un monto mayor que cero.';
    convertedAmount.value = null;
    return;
  }

  if (!currencyCode.value) return;
  converting.value = true;
  conversionError.value = '';
  convertedAmount.value = null;
  try {
    const response = await convertToUsd(currencyCode.value, value);
    convertedAmount.value = response.result;
    asOf.value = response.as_of || asOf.value;
  } catch (error) {
    conversionError.value = toUserMessage(error);
  } finally {
    converting.value = false;
  }
}

function formatUsd(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(value);
}

function formatRate(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—';
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value)}`;
}

function formatDate(unixSeconds: number) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(unixSeconds * 1000));
}
</script>
