<template>
  <q-layout view="hHh lpR fFf" class="app-shell">
    <q-header class="app-header">
      <q-toolbar
        ref="toolbar"
        class="page-width header-toolbar"
        :class="{ 'search-active': searchOpen }"
        @keydown.esc.stop="dismissSearch(true)"
        @focusout="handleFocusOut"
      >
        <router-link to="/" class="brand-link" aria-label="Country Explorer, inicio">
          <span class="brand-mark"><q-icon name="public" /></span>
          <span class="brand-name">country<span>explorer</span></span>
        </router-link>

        <q-space />

        <div v-if="!searchOpen" class="header-note gt-xs">
          <span class="status-dot"></span>
          Explorando el mundo, país a país
        </div>
        <form
          v-if="searchOpen"
          id="country-search-form"
          class="header-search"
          role="search"
          @submit.prevent="submitSearch(activeOption?.capital ?? searchText)"
        >
          <q-icon name="search" class="header-search-icon" />
          <input
            ref="searchInput"
            v-model="searchText"
            type="text"
            role="combobox"
            autocomplete="off"
            enterkeyhint="search"
            aria-autocomplete="list"
            :aria-expanded="options.length > 0"
            :aria-controls="options.length ? 'capital-options' : undefined"
            :aria-activedescendant="activeOption ? optionId(activeIndex) : undefined"
            placeholder="Busca una capital..."
            aria-label="Buscar por capital"
            @keydown.down.prevent="moveOption(1)"
            @keydown.up.prevent="moveOption(-1)"
          />
          <button type="submit" class="header-search-submit" aria-label="Buscar capital">
            <q-icon name="arrow_forward" />
          </button>
        </form>
        <q-btn
          ref="searchToggle"
          flat
          round
          dense
          :icon="searchOpen ? 'close' : 'travel_explore'"
          class="header-action"
          :aria-label="searchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda y filtros'"
          :aria-expanded="searchOpen"
          @click="toggleSearch"
        />
        <Transition name="capital-panel">
          <div v-if="searchOpen" class="capital-panel">
            <div class="header-filters">
              <label class="header-filter-field" for="header-continent">
                <span>Continente</span>
                <select id="header-continent" v-model="region">
                  <option
                    v-for="option in continentOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <button type="submit" form="country-search-form" class="header-filter-apply">
                Buscar países <q-icon name="arrow_forward" aria-hidden="true" />
              </button>
            </div>
            <p id="capital-options-label">
              {{ searchText.trim() ? 'Sugerencias' : 'Capitales sugeridas' }}
            </p>
            <ul
              v-if="options.length"
              id="capital-options"
              role="listbox"
              aria-labelledby="capital-options-label"
            >
              <li
                v-for="(option, index) in options"
                :id="optionId(index)"
                :key="option.capital"
                role="option"
                :aria-selected="index === activeIndex"
                :style="{ '--option-delay': index * 32 + 'ms' }"
                @pointerdown.prevent
                @click="submitSearch(option.capital)"
              >
                <span class="capital-flag" aria-hidden="true">{{ option.flag }}</span>
                <span class="capital-label"
                  ><strong>{{ option.capital }}</strong
                  ><small>{{ option.country }}</small></span
                >
                <q-icon name="north_east" aria-hidden="true" />
              </li>
            </ul>
            <p v-else class="capital-hint" role="status">
              {{
                query ? `Pulsa Enter para buscar «${query}».` : 'Escribe el nombre de una capital.'
              }}
            </p>
          </div>
        </Transition>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { QBtn, QToolbar } from 'quasar';
import { continentOptions } from '@/data/continents';
import { capitalApiQuery, searchByCapital } from '@/services/restCountries';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const searchOpen = ref(false);
const searchText = ref('');
const searchInput = ref<HTMLInputElement | null>(null);

watch(
  () => route.query.capital,
  (value) => {
    searchText.value = typeof value === 'string' ? value : '';
  },
  { immediate: true },
);

interface CapitalOption {
  capital: string;
  country: string;
  flag: string;
  region: string;
}

const suggestedCapitals: CapitalOption[] = [
  { capital: 'Lima', country: 'Perú', flag: '🇵🇪', region: 'Americas' },
  { capital: 'Bogotá', country: 'Colombia', flag: '🇨🇴', region: 'Americas' },
  { capital: 'Madrid', country: 'España', flag: '🇪🇸', region: 'Europe' },
  { capital: 'Ottawa', country: 'Canadá', flag: '🇨🇦', region: 'Americas' },
  { capital: 'Tokio', country: 'Japón', flag: '🇯🇵', region: 'Asia' },
];

const toolbar = ref<QToolbar | null>(null);
const searchToggle = ref<QBtn | null>(null);
const activeIndex = ref(-1);
const liveOptions = ref<CapitalOption[]>([]);
const query = computed(() => searchText.value.trim());
const region = ref('');
const options = computed(() => {
  const suggestions = suggestedCapitals.filter(
    (option) =>
      (!region.value || option.region === region.value) &&
      (normalize(option.capital).includes(normalize(query.value)) ||
        normalize(capitalApiQuery(option.capital)).includes(normalize(query.value))),
  );
  if (liveOptions.value.length) return liveOptions.value;
  return suggestions;
});
const activeOption = computed(() => options.value[activeIndex.value]);

watch([searchOpen, query, region], ([open, value, selectedRegion], _previous, onCleanup) => {
  liveOptions.value = [];
  if (!open || value.length < 2) return;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    void searchByCapital(value, controller.signal)
      .then((countries) => {
        if (controller.signal.aborted) return;
        const found = new Map<string, CapitalOption>();
        for (const country of countries) {
          if (selectedRegion && country.region !== selectedRegion) continue;
          for (const { name } of country.capitals ?? []) {
            if (!name || !normalize(name).includes(normalize(capitalApiQuery(value)))) continue;
            found.set(name, {
              capital: name,
              country: country.names?.common || 'Capital',
              flag: country.flag?.emoji || '🌐',
              region: country.region ?? '',
            });
          }
        }
        liveOptions.value = [...found.values()].slice(0, 5);
      })
      .catch(() => {
        // Keep the local suggestions. Submitting the search shows API errors in the results.
      });
  }, 320);
  onCleanup(() => {
    clearTimeout(timer);
    controller.abort();
  });
});
watch(options, () => {
  activeIndex.value = -1;
});

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
function optionId(index: number) {
  return 'capital-option-' + index;
}
function moveOption(direction: number) {
  const count = options.value.length;
  if (!count) return;
  const index = activeIndex.value === -1 && direction < 0 ? 0 : activeIndex.value;
  activeIndex.value = (index + count + direction) % count;
  document.getElementById(optionId(activeIndex.value))?.scrollIntoView({ block: 'nearest' });
}
function dismissSearch(restoreFocus = false) {
  if (!searchOpen.value) return;
  searchOpen.value = false;
  if (restoreFocus) searchToggle.value?.$el.focus();
}
function handleFocusOut(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && !toolbar.value?.$el.contains(event.relatedTarget)) {
    dismissSearch();
  }
}
function handleOutsidePress(event: PointerEvent) {
  if (event.target instanceof Node && !toolbar.value?.$el.contains(event.target)) dismissSearch();
}
onMounted(() => document.addEventListener('pointerdown', handleOutsidePress));
onUnmounted(() => document.removeEventListener('pointerdown', handleOutsidePress));

async function toggleSearch() {
  if (searchOpen.value) {
    dismissSearch(true);
    return;
  }
  searchText.value = typeof route.query.capital === 'string' ? route.query.capital : '';
  region.value =
    continentOptions.find(({ value }) => value === route.query.continente)?.value ?? '';
  searchOpen.value = true;
  await nextTick();
  searchInput.value?.focus();
}
async function submitSearch(value: string) {
  const capital = value.trim();
  const query = { capital: capital || undefined, continente: region.value || undefined };
  dismissSearch(true);
  await router.push({ path: '/', query });
  await nextTick();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('resultados')?.scrollIntoView({
    behavior: reduceMotion ? 'instant' : 'smooth',
    block: 'start',
  });
}
</script>
