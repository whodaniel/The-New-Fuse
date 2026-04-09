export function toPercentString(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0%";
  return `${Math.round(num * 100)}%`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

export function roundToDecimalPlaces(num: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.round(num * factor) / factor;
}