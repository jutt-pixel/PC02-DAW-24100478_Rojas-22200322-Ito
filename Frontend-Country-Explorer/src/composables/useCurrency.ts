// Estado del panel de moneda: tasa frente al dolar y conversor.

import { ref } from 'vue';
import { getRateToUsd, convertAmount } from '@/services/currencies';
import { errorMessage } from '@/services/http';

export function useCurrency() {
  const rate = ref<number | null>(null);
  const rateLoading = ref(false);
  const rateError = ref('');

  const converted = ref<number | null>(null);
  const convertLoading = ref(false);
  const convertError = ref('');

  async function loadRate(code: string): Promise<void> {
    rate.value = null;
    rateError.value = '';
    converted.value = null;
    convertError.value = '';
    if (!code) return;
    rateLoading.value = true;
    try {
      const data = await getRateToUsd(code);
      if (data.rate === null) {
        rateError.value = 'No hay tasa disponible para esta moneda.';
      } else {
        rate.value = data.rate;
      }
    } catch (e) {
      rateError.value = errorMessage(e, 'No se pudo obtener la tasa de cambio.');
    } finally {
      rateLoading.value = false;
    }
  }

  async function convert(code: string, amount: number | null): Promise<void> {
    converted.value = null;
    convertError.value = '';
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      convertError.value = 'Ingresa un monto mayor a cero.';
      return;
    }
    if (code.toUpperCase() === 'USD') {
      converted.value = value;
      return;
    }
    convertLoading.value = true;
    try {
      const result = await convertAmount(code, 'USD', value);
      if (result === null) {
        convertError.value = 'No se pudo convertir el monto.';
      } else {
        converted.value = result;
      }
    } catch (e) {
      convertError.value = errorMessage(e, 'No se pudo convertir el monto.');
    } finally {
      convertLoading.value = false;
    }
  }

  return {
    rate,
    rateLoading,
    rateError,
    converted,
    convertLoading,
    convertError,
    loadRate,
    convert,
  };
}
