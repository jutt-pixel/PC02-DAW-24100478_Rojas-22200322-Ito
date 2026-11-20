// Servicio de paises: arma las URLs y normaliza la respuesta de la API
// a un objeto simple que usan los componentes.

import { apiGet, COUNTRIES_BASE, type ApiData } from './http';
import type { ContinentOption, Country, Currency } from '@/types/country';

// Continentes del selector y el valor de "region" que espera la API.
export const CONTINENTS: ContinentOption[] = [
  { label: 'Todos los continentes', value: '' },
  { label: 'África', value: 'Africa' },
  { label: 'América', value: 'Americas' },
  { label: 'Asia', value: 'Asia' },
  { label: 'Europa', value: 'Europe' },
  { label: 'Oceanía', value: 'Oceania' },
  { label: 'Antártida', value: 'Antarctic' },
];

const PAGE_SIZE = 100; // maximo permitido en el plan gratuito

// En los listados solo se piden los campos que muestra la tarjeta (respuesta mas liviana).
const LIST_FIELDS = [
  'names.common',
  'names.official',
  'codes.alpha_2',
  'codes.alpha_3',
  'capitals',
  'population',
  'region',
  'continents',
  'currencies',
].join(',');

// Forma (parcial) de un pais tal como lo entrega la API.
interface RawCountry {
  names?: { common?: string; official?: string };
  codes?: { alpha_2?: string; alpha_3?: string };
  capitals?: { name?: string }[];
  population?: number;
  region?: string;
  continents?: string[];
  currencies?: { code?: string; name?: string; symbol?: string }[];
  area?: { kilometers?: number };
  languages?: { name?: string }[];
  timezones?: string[];
  calling_codes?: string[];
  tlds?: string[];
  cars?: { driving_side?: string };
  borders?: string[];
}

function texts(values: (string | undefined)[]): string[] {
  return values.filter((value): value is string => Boolean(value));
}

// Convierte un pais de la API en el objeto que usa la interfaz.
export function normalizeCountry(raw: RawCountry): Country {
  const capitals = texts((raw.capitals ?? []).map((c) => c.name));
  const currencies: Currency[] = (raw.currencies ?? []).map((c) => ({
    code: c.code ?? '',
    name: c.name ?? '',
    symbol: c.symbol ?? '',
  }));

  return {
    code: (raw.codes?.alpha_2 ?? '').toUpperCase(),
    code3: (raw.codes?.alpha_3 ?? '').toUpperCase(),
    name: raw.names?.common || raw.names?.official || 'Sin nombre',
    officialName: raw.names?.official ?? '',
    capital: capitals[0] ?? 'Sin capital',
    capitals,
    population: typeof raw.population === 'number' ? raw.population : null,
    region: raw.region ?? '',
    continent: raw.continents?.[0] ?? raw.region ?? '',
    currencies,
    area: typeof raw.area?.kilometers === 'number' ? raw.area.kilometers : null,
    languages: texts((raw.languages ?? []).map((l) => l.name)),
    timezones: raw.timezones ?? [],
    callingCodes: raw.calling_codes ?? [],
    domains: raw.tlds ?? [],
    drivingSide: raw.cars?.driving_side ?? '',
    borders: raw.borders ?? [],
  };
}

function objectsOf(data: ApiData): Country[] {
  const items = (data.objects ?? []) as RawCountry[];
  return items.map(normalizeCountry).filter((c) => c.code);
}

// Trae todas las paginas de un listado (la API devuelve como maximo 100 por pedido).
async function fetchAllPages(baseUrl: string): Promise<Country[]> {
  const separator = baseUrl.includes('?') ? '&' : '?';
  let offset = 0;
  let total = Infinity;
  const result: Country[] = [];

  while (offset < total && offset < 400) {
    const url =
      baseUrl +
      separator +
      'limit=' +
      PAGE_SIZE +
      '&offset=' +
      offset +
      '&response_fields=' +
      LIST_FIELDS;
    const data = await apiGet(url);
    const page = objectsOf(data);
    result.push(...page);
    total = typeof data.meta?.total === 'number' ? data.meta.total : result.length;
    if (page.length === 0) break;
    offset += PAGE_SIZE;
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

// Listado inicial: GET /countries/v5
export function getAllCountries(): Promise<Country[]> {
  return fetchAllPages(COUNTRIES_BASE);
}

// Busqueda por capital: GET /countries/v5/capitals?q={texto}
export function searchByCapital(text: string): Promise<Country[]> {
  return fetchAllPages(COUNTRIES_BASE + '/capitals?q=' + encodeURIComponent(text));
}

// Filtro por continente: GET /countries/v5/region/{continente}
export function getByContinent(region: string): Promise<Country[]> {
  return fetchAllPages(COUNTRIES_BASE + '/region/' + encodeURIComponent(region));
}

// Detalle de un pais: GET /countries/v5/codes.alpha_2/{codigo}
export async function getCountryByCode(code: string): Promise<Country | null> {
  const data = await apiGet(COUNTRIES_BASE + '/codes.alpha_2/' + encodeURIComponent(code));
  return objectsOf(data)[0] ?? null;
}
