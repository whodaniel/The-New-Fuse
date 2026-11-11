// Always prefer the configured absolute API origin in production builds —
// including *.pages.dev preview/production aliases. Forcing relative `/api`
// on pages.dev routed auth exchange/refresh through the Pages Functions proxy,
// which is flaky and left the SPA "logged in" on a Supabase bearer that
// JwtAuthGuard rejects for timeline/ledger routes.
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
