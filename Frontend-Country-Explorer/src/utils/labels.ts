// Nombres en espanol para los continentes que devuelve la API.

import type { Country } from '@/types/country';

const CONTINENT_NAMES: Record<string, string> = {
  Africa: 'África',
  Antarctica: 'Antártida',
  Antarctic: 'Antártida',
  Asia: 'Asia',
  Europe: 'Europa',
  Oceania: 'Oceanía',
  Americas: 'América',
  'North America': 'Norteamérica',
  'South America': 'Sudamérica',
};

export function continentLabel(country: Country): string {
  const value = country.continent || country.region;
  return CONTINENT_NAMES[value] ?? (value || 'Sin dato');
}
