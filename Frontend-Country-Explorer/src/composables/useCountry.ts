// Estado del detalle de un pais y de los nombres de sus paises fronterizos.

import { ref, watch, type Ref } from 'vue';
import { getCountryByCode, getAllCountries } from '@/services/countries';
import { ApiError, errorMessage } from '@/services/http';
import type { BorderCountry, Country } from '@/types/country';

export function useCountry(codeRef: Ref<string>) {
  const country = ref<Country | null>(null);
  const borders = ref<BorderCountry[]>([]);
  const loading = ref(false);
  const error = ref('');
  const notFound = ref(false);

  async function loadBorders(codes: string[]): Promise<void> {
    borders.value = codes.map((code3) => ({ code3, code: '', name: code3 }));
    if (!codes.length) return;
    try {
      // El listado completo ya esta en cache si se entro desde la pantalla principal.
      const all = await getAllCountries();
      borders.value = codes.map((code3) => {
        const match = all.find((c) => c.code3 === code3);
        return match
          ? { code3, code: match.code, name: match.name }
          : { code3, code: '', name: code3 };
      });
    } catch {
      // Si falla, se muestran los codigos tal como vienen de la API.
    }
  }

  async function load(): Promise<void> {
    const code = codeRef.value.trim();
    if (!code) return;
    loading.value = true;
    error.value = '';
    notFound.value = false;
    country.value = null;
    borders.value = [];
    try {
      const result = await getCountryByCode(code);
      if (!result) {
        notFound.value = true;
        return;
      }
      country.value = result;
      void loadBorders(result.borders);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        notFound.value = true;
      } else {
        error.value = errorMessage(e, 'No se pudo cargar el país.');
      }
    } finally {
      loading.value = false;
    }
  }

  watch(codeRef, () => void load(), { immediate: true });

  return { country, borders, loading, error, notFound, reload: load };
}
