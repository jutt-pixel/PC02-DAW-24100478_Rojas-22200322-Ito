// Estado del listado: paises, carga, error, busqueda por capital y filtro por continente.

import { ref, watch } from 'vue';
import { getAllCountries, searchByCapital, getByContinent } from '@/services/countries';
import { errorMessage } from '@/services/http';
import type { Country } from '@/types/country';

// Se guarda fuera de la funcion para conservar el filtro al volver del detalle.
const search = ref('');
const continent = ref('');
const countries = ref<Country[]>([]);
const loading = ref(false);
const error = ref('');
let started = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let lastRequest = 0;

async function load(): Promise<void> {
  const requestId = ++lastRequest;
  loading.value = true;
  error.value = '';

  const text = search.value.trim();
  const region = continent.value;

  try {
    let result: Country[];
    if (text) {
      // Con texto se usa el endpoint de capitales; el continente se aplica sobre ese resultado.
      result = await searchByCapital(text);
      if (region) {
        result = result.filter((c) => c.region === region);
      }
    } else if (region) {
      result = await getByContinent(region);
    } else {
      result = await getAllCountries();
    }
    // Si llego una respuesta vieja despues de una nueva, se descarta.
    if (requestId !== lastRequest) return;
    countries.value = result;
  } catch (e) {
    if (requestId !== lastRequest) return;
    countries.value = [];
    error.value = errorMessage(e, 'No se pudo cargar el listado.');
  } finally {
    if (requestId === lastRequest) loading.value = false;
  }
}

export function useCountries() {
  if (!started) {
    started = true;
    void load();

    // Espera 400 ms despues de la ultima tecla para no gastar consultas.
    watch(search, () => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(), 400);
    });
    watch(continent, () => {
      clearTimeout(timer);
      void load();
    });
  }

  return { search, continent, countries, loading, error, reload: load };
}
