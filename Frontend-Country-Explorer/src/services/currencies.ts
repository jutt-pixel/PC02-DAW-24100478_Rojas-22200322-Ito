// Servicio de monedas: tasa de cambio y conversion de montos.

import { apiGet, CURRENCIES_BASE } from './http';

interface RawRates {
  base?: string;
  as_of?: number;
  rates?: Record<string, number>;
}

interface RawConversion {
  rate?: number;
  result?: number;
  as_of?: number;
}

export interface RateResult {
  base: string;
  rate: number | null;
}

// Tasa de cambio: GET /currencies/v1/rates/{codigoMoneda}
// Devuelve cuantos USD vale una unidad de la moneda consultada.
export async function getRateToUsd(currencyCode: string): Promise<RateResult> {
  const code = currencyCode.toUpperCase();
  if (code === 'USD') {
    return { base: 'USD', rate: 1 };
  }
  const data = await apiGet(CURRENCIES_BASE + '/rates/' + encodeURIComponent(code));
  const first = (data.objects ?? [])[0] as RawRates | undefined;
  const usd = first?.rates?.USD;
  return { base: first?.base ?? code, rate: typeof usd === 'number' ? usd : null };
}

// Conversion: GET /currencies/v1/convert?from={origen}&to={destino}&amount={monto}
export async function convertAmount(
  from: string,
  to: string,
  amount: number,
): Promise<number | null> {
  const url =
    CURRENCIES_BASE +
    '/convert?from=' +
    encodeURIComponent(from) +
    '&to=' +
    encodeURIComponent(to) +
    '&amount=' +
    encodeURIComponent(String(amount));
  // La conversion no se guarda en cache: depende del monto ingresado.
  const data = await apiGet(url, { useCache: false });
  const first = (data.objects ?? [])[0] as RawConversion | undefined;
  return typeof first?.result === 'number' ? first.result : null;
}
