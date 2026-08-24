import { authFetch } from '@/utils/authToken';

export type FetchFirstJsonResult<T = unknown> = {
  data: T;
  source: string;
  usedAlternate: boolean;
};

const isJsonContentType = (contentType: string | null): boolean => {
  if (!contentType) return true;
  const normalized = contentType.toLowerCase();
  return normalized.includes('application/json') || normalized.includes('+json');
};

/**
 * Try multiple API path aliases with authenticated fetch and return the first successful JSON payload.
 *
 * A successful HTTP status is not sufficient: SPA fallbacks commonly return HTML with 200. Explicit
 * non-JSON content types and JSON parse failures are treated as alias misses so the next candidate can
 * be tried instead of silently converting the response into an empty object.
 */
export async function fetchFirstJson<T = unknown>(
  paths: string[],
  options?: { validateStatus?: (status: number) => boolean }
): Promise<FetchFirstJsonResult<T> | null> {
  const validate = options?.validateStatus ?? ((status: number) => status >= 200 && status < 300);

  for (const [index, path] of paths.entries()) {
    try {
      const response = await authFetch(path, {
        headers: { Accept: 'application/json' },
      });
      if (!validate(response.status)) continue;
      if (!isJsonContentType(response.headers.get('content-type'))) continue;

      let data: T;
      try {
        data = (await response.json()) as T;
      } catch {
        continue;
      }

      return { data, source: path, usedAlternate: index > 0 };
    } catch {
      // Try next alias.
    }
  }

  return null;
}
