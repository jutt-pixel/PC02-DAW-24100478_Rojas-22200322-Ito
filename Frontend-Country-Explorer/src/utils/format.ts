// Funciones de formato usadas en tarjetas y detalle.

// 34000000 -> "34.0 M", 950000 -> "950.0 K"
export function formatPopulation(value: number | null): string {
  if (value === null) return 'Sin dato';
  if (value >= 1e9) return (value / 1e9).toFixed(1) + ' B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + ' M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + ' K';
  return String(value);
}

// 1285216 -> "1 285 216 km2"
export function formatArea(value: number | null): string {
  if (value === null) return 'Sin dato';
  const text = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return text + ' km\u00B2';
}

export function formatNumber(value: number | null, decimals = 2): string {
  if (value === null || Number.isNaN(value)) return '-';
  return value.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Una tasa muy chica necesita mas decimales para no verse como 0.00
export function formatRate(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '-';
  if (value >= 1) return formatNumber(value, 2);
  if (value >= 0.01) return formatNumber(value, 4);
  return formatNumber(value, 6);
}

export function drivingSideLabel(side: string): string {
  if (side === 'right') return 'Derecha';
  if (side === 'left') return 'Izquierda';
  return 'Sin dato';
}

// Bandera desde flagcdn con el codigo ISO alpha-2 en minusculas.
export function flagUrl(code: string, width = 320): string {
  if (!code) return '';
  return 'https://flagcdn.com/w' + width + '/' + code.toLowerCase() + '.png';
}

export function joinList(items: string[], empty = 'Sin dato'): string {
  return items.length ? items.join(', ') : empty;
}
