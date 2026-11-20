const COUNTRIES_BASE_URL = 'https://api.restcountries.com/countries/v5';
const CURRENCIES_BASE_URL = 'https://api.restcountries.com/currencies/v1';

export interface CountryCurrency {
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
  population?: number | null;
  area?: { kilometers?: number | null } | null;
  languages?: Array<{ name?: string | null; native?: string | null }> | null;
  timezones?: string[] | null;
  calling_codes?: string[] | null;
  tlds?: string[] | null;
  cars?: { driving_side?: string | null } | null;
  borders?: string[] | null;
  currencies?: Record<string, CountryCurrency> | null;
  flag?: { svg?: string | null; png?: string | null; emoji?: string | null } | null;
}

interface ApiError {
  message?: string;
  code?: string;
}

interface ApiEnvelope<T> {
  data?: {
    objects?: T[];
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

const apiKey = import.meta.env.VITE_RESTCOUNTRIES_API_KEY?.trim();
const countryByAlpha3Cache = new Map<string, Promise<Country | null>>();

function apiMessage(body: ApiEnvelope<unknown> | null, status: number): string {
  const message = body?.errors?.[0]?.message;

  if (status === 401) {
    return 'La API key no es válida. Revisa VITE_RESTCOUNTRIES_API_KEY.';
  }

  if (status === 403) {
    return 'La cuenta alcanzó su límite mensual o está bloqueada. Revisa tu plan de RestCountries.';
  }

  return message || `No se pudo consultar RestCountries (HTTP ${status}).`;
}

async function getObjects<T>(baseUrl: string, path = ''): Promise<T[]> {
  if (!apiKey) {
    throw new Error(
      'Falta configurar la API key. Copia .env.example a .env y define VITE_RESTCOUNTRIES_API_KEY.',
    );
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch {
    throw new Error(
      'No se pudo conectar con RestCountries. Comprueba tu conexión y que localhost esté permitido en los orígenes de tu API key.',
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

  return objects;
}

export async function getCountries(): Promise<Country[]> {
  const params = new URLSearchParams({
    limit: '24',
    response_fields:
      'names.common,codes.alpha_2,codes.alpha_3,capitals,region,population,currencies,flag.emoji',
  });
  return getObjects<Country>(COUNTRIES_BASE_URL, `?${params.toString()}`);
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

export async function getCountryByAlpha3(code: string): Promise<Country | null> {
  const normalizedCode = code.toUpperCase();
  const cached = countryByAlpha3Cache.get(normalizedCode);
  if (cached) return cached;

  const request = getObjects<Country>(
    COUNTRIES_BASE_URL,
    `/codes.alpha_3/${encodeURIComponent(normalizedCode)}`,
  )
    .then((countries) => countries[0] ?? null)
    .catch(() => null);

  countryByAlpha3Cache.set(normalizedCode, request);
  return request;
}

export async function getUsdRate(currencyCode: string): Promise<CurrencyRate> {
  const code = currencyCode.toUpperCase();
  if (code === 'USD') return { base: 'USD', as_of: Date.now() / 1000, rates: { USD: 1 } };

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
  if (code === 'USD') {
    return {
      from: { code: 'USD', name: 'United States dollar', symbol: '$' },
      to: { code: 'USD', name: 'United States dollar', symbol: '$' },
      amount,
      rate: 1,
      result: amount,
      as_of: Date.now() / 1000,
    };
  }

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
