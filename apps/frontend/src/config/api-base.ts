const rawConfiguredApiUrl = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '');

const apiSuffixPattern = /\/api(?:\/v\d+)?$/i;

function withApiSuffix(value: string): string {
  if (!value) return '';
  if (apiSuffixPattern.test(value)) {
    return value.replace(/\/api\/v\d+$/i, '/api');
  }
  return `${value}/api`;
}

export const API_BASE = withApiSuffix(rawConfiguredApiUrl) || '/api';
export const API_V1_BASE = `${API_BASE}/v1`;

export function joinApiPath(base: string, path: string): string {
  const normalizedBase = String(base || '')
    .trim()
    .replace(/\/+$/, '');
  const normalizedPath = String(path || '')
    .trim()
    .replace(/^\/+/, '');
  if (!normalizedPath) return normalizedBase || '/';
  if (!normalizedBase) return `/${normalizedPath}`;
  return `${normalizedBase}/${normalizedPath}`;
}
