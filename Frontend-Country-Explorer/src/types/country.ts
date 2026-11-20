// Tipos que usa la interfaz (ya normalizados a partir de la respuesta de la API).

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface Country {
  code: string; // ISO alpha-2
  code3: string; // ISO alpha-3
  name: string;
  officialName: string;
  capital: string;
  capitals: string[];
  population: number | null;
  region: string;
  continent: string;
  currencies: Currency[];
  area: number | null;
  languages: string[];
  timezones: string[];
  callingCodes: string[];
  domains: string[];
  drivingSide: string;
  borders: string[]; // codigos alpha-3
}

export interface BorderCountry {
  code3: string;
  code: string;
  name: string;
}

export interface ContinentOption {
  label: string;
  value: string;
}
