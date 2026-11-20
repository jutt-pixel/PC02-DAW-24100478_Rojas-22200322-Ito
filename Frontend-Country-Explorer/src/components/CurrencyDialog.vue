<template>
  <q-dialog v-model="open">
    <q-card v-if="currency" class="currency-dialog">
      <q-card-section class="row items-center no-wrap q-pb-sm">
        <q-avatar
          color="green-1"
          text-color="green-9"
          size="44px"
          font-size="16px"
          class="text-weight-bold"
        >
          {{ currency.symbol || currency.code }}
        </q-avatar>
        <div class="q-ml-md">
          <div class="text-h6">{{ currency.name || currency.code }}</div>
          <div class="text-caption text-muted">
            Código: {{ currency.code }} · Símbolo: {{ currency.symbol || 'sin símbolo' }}
          </div>
        </div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" aria-label="Cerrar" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="rate-box">
          <div v-if="rateLoading" class="row items-center q-gutter-sm">
            <q-spinner color="primary" size="20px" />
            <span>Consultando la tasa de cambio...</span>
          </div>
          <div v-else-if="rateError" class="text-negative">
            {{ rateError }}
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Reintentar"
              @click="loadRate(currency.code)"
            />
          </div>
          <div v-else-if="rate !== null" class="text-subtitle1 text-weight-medium">
            1 {{ currency.code }} = {{ formatRate(rate) }} USD
          </div>
        </div>

        <div class="text-caption text-weight-medium q-mt-md q-mb-xs">
          Convertir monto en {{ currency.code }}
        </div>
        <q-input
          v-model.number="amount"
          type="number"
          outlined
          dense
          min="0"
          step="any"
          :aria-label="'Monto en ' + currency.code"
          @keyup.enter="onConvert"
        />

        <q-btn
          class="full-width q-mt-md"
          color="primary"
          unelevated
          no-caps
          label="Convertir a USD"
          :loading="convertLoading"
          @click="onConvert"
        />

        <div v-if="convertError" class="text-negative q-mt-sm">{{ convertError }}</div>
        <div v-else-if="converted !== null" class="result-box q-mt-md">
          {{ formatNumber(Number(amount), 2) }} {{ currency.code }} =
          <strong>{{ formatNumber(converted, 2) }} USD</strong>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// Panel de tipo de cambio: datos de la moneda, tasa frente al dolar y conversor a USD.
import { ref, watch } from 'vue';
import { useCurrency } from '@/composables/useCurrency';
import { formatNumber, formatRate } from '@/utils/format';
import type { Currency } from '@/types/country';

const props = defineProps<{ currency: Currency | null }>();

const open = defineModel<boolean>({ default: false });

const amount = ref<number | null>(100);
const { rate, rateLoading, rateError, converted, convertLoading, convertError, loadRate, convert } =
  useCurrency();

// Cada vez que se abre el panel con una moneda se consulta su tasa.
watch(
  () => [open.value, props.currency?.code] as const,
  ([isOpen, code]) => {
    if (isOpen && code) {
      amount.value = 100;
      void loadRate(code);
    }
  },
  { immediate: true },
);

function onConvert() {
  if (props.currency) {
    void convert(props.currency.code, amount.value);
  }
}
</script>

<style scoped>
.currency-dialog {
  width: 380px;
  max-width: 92vw;
  border-radius: 14px;
}

.rate-box {
  background: #f7f9fb;
  border-radius: 10px;
  padding: 12px 14px;
  min-height: 46px;
}

.result-box {
  background: #e8f5e9;
  color: #1b5e20;
  border-radius: 10px;
  padding: 12px 14px;
}
</style>
