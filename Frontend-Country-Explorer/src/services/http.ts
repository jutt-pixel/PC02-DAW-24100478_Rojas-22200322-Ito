// Cliente HTTP comun para las dos APIs de RestCountries.
// La clave se lee de una variable de entorno y nunca se escribe en el codigo.

const API_KEY: string = import.meta.env.QCLI_RESTCOUNTRIES_KEY ?? '';
const API_ROOT: string = import.meta.env.QCLI_API_ROOT ?? 'https://api.restcountries.com';

export const COUNTRIES_BASE = API_ROOT + '/countries/v5';
export const CURRENCIES_BASE = API_ROOT + '/currencies/v1';

// Formato de la respuesta de la API v5: todo viene dentro de "data".
export interface ApiData {
  objects?: unknown[];
  meta?: { total?: number };
}

interface ApiErrorItem {
  message?: string;
  code?: string;
}

interface ApiBody {
  data?: ApiData;
  errors?: ApiErrorItem[];
}

// Cache en memoria: evita repetir pedidos (el plan gratuito tiene 1000 por mes).
const cache = new Map<string, { time: number; data: ApiData }>();
const CACHE_MS = 10 * 60 * 1000;

export function hasApiKey(): boolean {
  return API_KEY.trim().length > 0;
}

// Error propio para poder mostrar un mensaje claro segun el caso.
export class ApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function messageFor(
  status: number,
  apiMessage: string | undefined,
  code: string | undefined,
): string {
  if (code === 'general.origin_not_allowed') {
    return 'La clave no permite consultas desde este sitio. Agrega "localhost" en los orígenes permitidos (CORS) de la clave, en restcountries.com/api-keys.';
  }
  if (status === 401 || status === 403) {
    return 'La clave de la API no es válida o no fue configurada.';
  }
  if (status === 404) {
    return 'No se encontraron datos para esta consulta.';
  }
  if (status === 429) {
    return 'Se alcanzó el límite de consultas de la API. Intenta de nuevo más tarde.';
  }
  if (status >= 500) {
    return 'El servicio de RestCountries no está disponible en este momento.';
  }
  return apiMessage || 'Ocurrió un error al consultar la API.';
}

// Convierte cualquier error en un texto para mostrar al usuario.
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

// Hace un GET y devuelve el contenido de "data".
export async function apiGet(url: string, options: { useCache?: boolean } = {}): Promise<ApiData> {
  const useCache = options.useCache ?? true;

  if (!hasApiKey()) {
    throw new ApiError(
      'Falta configurar la clave de la API (QCLI_RESTCOUNTRIES_KEY).',
      0,
      'missing_key',
    );
  }

  if (useCache) {
    const saved = cache.get(url);
    if (saved && Date.now() - saved.time < CACHE_MS) {
      return saved.data;
    }
    cache.delete(url);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: 'Bearer ' + API_KEY },
    });
  } catch {
    throw new ApiError('No hay conexión con el servidor. Revisa tu internet.', 0, 'network');
  }

  let body: ApiBody | null;
  try {
    body = (await response.json()) as ApiBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const first = body?.errors?.[0];
    throw new ApiError(
      messageFor(response.status, first?.message, first?.code),
      response.status,
      first?.code ?? null,
    );
  }

  const data: ApiData = body?.data ?? {};
  if (useCache) {
    cache.set(url, { time: Date.now(), data });
  }
  return data;
}
