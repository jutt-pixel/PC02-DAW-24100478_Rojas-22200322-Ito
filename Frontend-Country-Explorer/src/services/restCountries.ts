const apiBase = import.meta.env.DEV ? '/api/restcountries' : 'https://api.restcountries.com';
const COUNTRIES_BASE_URL = apiBase + '/countries/v5';
const CURRENCIES_BASE_URL = apiBase + '/currencies/v1';

export interface CountryCurrency {
  code: string;
  name?: string | null;
  symbol?: string | null;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol?: string | null;
}

export interface Country {
  names?: { common?: string | null; official?: string | null } | null;
  codes?: { alpha_2?: string | null; alpha_3?: string | null } | null;
  capitals?: Array<{ name?: string | null }> | null;
  region?: string | null;
  subregion?: string | null;
  continents?: string[] | null;
  population?: number | null;
  area?: { kilometers?: number | null } | null;
  languages?: Array<{ name?: string | null; native?: string | null }> | null;
  timezones?: string[] | null;
  calling_codes?: string[] | null;
  tlds?: string[] | null;
  cars?: { driving_side?: string | null } | null;
  borders?: string[] | null;
  currencies?: CountryCurrency[] | null;
  flag?: { svg?: string | null; png?: string | null; emoji?: string | null } | null;
}

export function getCountryCurrencies(country: Country): CurrencyInfo[] {
  if (!Array.isArray(country.currencies)) return [];
  return country.currencies
    .filter((currency) => typeof currency?.code === 'string' && currency.code.trim().length > 0)
    .map((currency) => ({
      code: currency.code.toUpperCase(),
      name: currency.name || currency.code,
      symbol: currency.symbol ?? null,
    }));
}

interface ApiError {
  message?: string;
  code?: string;
}

interface ApiEnvelope<T> {
  data?: {
    objects?: T[];
    meta?: { more?: boolean };
  };
  errors?: ApiError[];
}

export interface CurrencyRate {
  base: string;
  as_of: number;
  rates: Record<string, number>;
}

export interface CurrencyConversion {
  from: { code: string; name: string; symbol: string | null };
  to: { code: string; name: string; symbol: string | null };
  amount: number;
  rate: number;
  result: number;
  as_of: number;
}

const apiKey =
  import.meta.env.QCLI_RESTCOUNTRIES_API_KEY?.trim() ||
  import.meta.env.VITE_RESTCOUNTRIES_API_KEY?.trim();

function apiMessage(body: ApiEnvelope<unknown> | null, status: number): string {
  const message = body?.errors?.[0]?.message;

  if (status === 401) {
    return 'La API key no es válida. Revisa QCLI_RESTCOUNTRIES_API_KEY.';
  }

  if (body?.errors?.[0]?.code === 'general.origin_not_allowed') {
    return 'La clave no permite consultas desde este sitio. Agrega el origen del navegador en la configuración CORS de RestCountries.';
  }

  if (status === 429) {
    return 'Se hicieron demasiadas consultas. Espera unos segundos y vuelve a intentar.';
  }

  if (status === 403) {
    return 'La solicitud fue rechazada (HTTP 403). Revisa la configuración de la clave y la cuenta; también puede tratarse de un bloqueo de la red o de Cloudflare.';
  }

  return message || `No se pudo consultar RestCountries (HTTP ${status}).`;
}

async function getPage<T>(baseUrl: string, path: string, signal?: AbortSignal) {
  if (!import.meta.env.DEV && !apiKey) {
    throw new Error(
      'Falta configurar la API key. Copia .env.example a .env y define QCLI_RESTCOUNTRIES_API_KEY.',
    );
  }

  const url = `${baseUrl}${path}`;
  const headers: HeadersInit = import.meta.env.DEV
    ? { 'X-Country-Explorer': 'local' }
    : { Authorization: `Bearer ${apiKey}` };
  const request = () => {
    const timeout = AbortSignal.timeout(8_000);
    return fetch(url, {
      headers,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  };

  let response: Response;
  try {
    response = await request();
    if (response.status === 502 || response.status === 504) {
      await response.body?.cancel();
      response = await request();
    }
  } catch {
    throw new Error(
      'No se pudo conectar con RestCountries. Revisa tu conexión y vuelve a intentar.',
    );
  }

  const body: ApiEnvelope<T> | null = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(apiMessage(body, response.status));
  }

  const objects = body?.data?.objects;
  if (!Array.isArray(objects)) {
    throw new Error('RestCountries devolvió una respuesta inesperada. Inténtalo de nuevo.');
  }

  return { objects, more: body?.data?.meta?.more };
}

async function getObjects<T>(baseUrl: string, path: string, signal?: AbortSignal): Promise<T[]> {
  return (await getPage<T>(baseUrl, path, signal)).objects;
}

// Campos que necesita la tarjeta del listado (respuesta mas liviana).
const LIST_FIELDS =
  'names.common,codes.alpha_2,codes.alpha_3,capitals,region,continents,population,currencies,flag.emoji';
const PAGE_SIZE = 100; // maximo por pedido en el plan gratuito
const listCache = new Map<string, Promise<Country[]>>();

// Trae todas las paginas de un listado y las ordena por nombre.
async function getCountryList(
  path: string,
  extra: Record<string, string> = {},
): Promise<Country[]> {
  const result: Country[] = [];
  for (let offset = 0; ; offset = result.length) {
    const params = new URLSearchParams({
      ...extra,
      limit: String(PAGE_SIZE),
      offset: String(offset),
      response_fields: LIST_FIELDS,
    });
    const { objects, more } = await getPage<Country>(
      COUNTRIES_BASE_URL,
      `${path}?${params.toString()}`,
    );
    result.push(...objects);
    if (!objects.length || !(more ?? objects.length === PAGE_SIZE)) break;
  }
  return result
    .filter((country) => country.codes?.alpha_2)
    .sort((a, b) => (a.names?.common ?? '').localeCompare(b.names?.common ?? '', 'es'));
}

// Guarda en memoria cada listado para no repetir consultas (1000 por mes en el plan gratuito).
function cachedList(key: string, load: () => Promise<Country[]>): Promise<Country[]> {
  const saved = listCache.get(key);
  if (saved) return saved;
  const request = load().catch((error: unknown) => {
    listCache.delete(key);
    throw error;
  });
  listCache.set(key, request);
  return request;
}

// Listado inicial: GET /countries/v5
export function getCountries(): Promise<Country[]> {
  return cachedList('all', () => getCountryList(''));
}

// Busqueda por capital: GET /countries/v5/capitals?q={texto}
export function searchCountriesByCapital(text: string): Promise<Country[]> {
  const query = capitalApiQuery(text);
  return cachedList(`capital:${query.toLowerCase()}`, () =>
    getCountryList('/capitals', { q: query }),
  );
}

// Filtro por continente: GET /countries/v5/region/{continente}
export function getCountriesByContinent(region: string): Promise<Country[]> {
  return cachedList(`region:${region}`, () =>
    getCountryList(`/region/${encodeURIComponent(region)}`),
  );
}

export function capitalApiQuery(text: string): string {
  const query = text.trim();
  const aliases = new Map([
    ['tokio', 'Tokyo'],
    ['pekin', 'Beijing'],
    ['londres', 'London'],
    ['el cairo', 'Cairo'],
    ['moscu', 'Moscow'],
  ]);
  const normalized = query
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  return aliases.get(normalized) ?? query;
}

export async function searchByCapital(query: string, signal?: AbortSignal): Promise<Country[]> {
  const params = new URLSearchParams({
    q: capitalApiQuery(query),
    limit: '25',
    response_fields: LIST_FIELDS,
  });
  return getObjects<Country>(COUNTRIES_BASE_URL, `/capitals?${params.toString()}`, signal);
}

export async function getCountryByAlpha2(code: string): Promise<Country> {
  const countries = await getObjects<Country>(
    COUNTRIES_BASE_URL,
    `/codes.alpha_2/${encodeURIComponent(code.toUpperCase())}`,
  );
  const country = countries[0];
  if (!country) throw new Error('No encontramos ese país. Vuelve al listado e inténtalo otra vez.');
  return country;
}

export async function getBorderCountries(code: string, borderCodes: string[]): Promise<Country[]> {
  const allCountries = listCache.get('all');
  if (allCountries) {
    const countries = await allCountries.catch(() => []);
    const neighbors = countries.filter(
      (country) => country.codes?.alpha_3 && borderCodes.includes(country.codes.alpha_3),
    );
    if (neighbors.length === borderCodes.length) return neighbors;
  }

  const iso3 = code.toUpperCase();
  return cachedList(`borders:${iso3}`, () =>
    getCountryList(`/borders/${encodeURIComponent(iso3)}`),
  );
}

export async function getUsdRate(currencyCode: string): Promise<CurrencyRate> {
  const code = currencyCode.toUpperCase();
  const rates = await getObjects<CurrencyRate>(
    CURRENCIES_BASE_URL,
    `/rates/${encodeURIComponent(code)}`,
  );
  const rate = rates[0];
  if (!rate || typeof rate.rates?.USD !== 'number') {
    throw new Error(`No hay una tasa disponible de ${code} a USD.`);
  }
  return rate;
}

export async function convertToUsd(
  currencyCode: string,
  amount: number,
): Promise<CurrencyConversion> {
  const code = currencyCode.toUpperCase();
  const params = new URLSearchParams({ from: code, to: 'USD', amount: String(amount) });
  const conversions = await getObjects<CurrencyConversion>(
    CURRENCIES_BASE_URL,
    `/convert?${params.toString()}`,
  );
  const conversion = conversions[0];
  if (!conversion || typeof conversion.result !== 'number') {
    throw new Error('La API no devolvió un resultado de conversión. Inténtalo de nuevo.');
  }
  return conversion;
}

export function toUserMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado. Inténtalo otra vez.';
}
