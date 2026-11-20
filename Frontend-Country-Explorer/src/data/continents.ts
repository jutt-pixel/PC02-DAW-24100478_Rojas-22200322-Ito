export const continentOptions = [
  { label: 'Todos los continentes', value: '' },
  { label: 'África', value: 'Africa' },
  { label: 'América', value: 'Americas' },
  { label: 'Asia', value: 'Asia' },
  { label: 'Europa', value: 'Europe' },
  { label: 'Oceanía', value: 'Oceania' },
  { label: 'Antártida', value: 'Antarctic' },
];

const continentNames = new Map(continentOptions.map(({ label, value }) => [value, label]));
continentNames.set('North America', 'Norteamérica');
continentNames.set('South America', 'Sudamérica');
continentNames.set('Antarctica', 'Antártida');

export function continentName(value: string): string {
  return continentNames.get(value) ?? value;
}

export function formatContinents(continents?: string[] | null, region?: string | null): string {
  if (continents?.length) return continents.map(continentName).join(' · ');
  return region ? continentName(region) : 'Continente no disponible';
}
