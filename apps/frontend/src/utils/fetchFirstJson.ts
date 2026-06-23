import { authFetch } from '@/utils/authToken';

export type FetchFirstJsonResult<T = unknown> = {
  data: T;
  source: string;
  usedAlternate: boolean;
};

/**
 * Try multiple API path aliases with authenticated fetch and return the first successful JSON payload.
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
      const data = (await response.json().catch(() => ({}))) as T;
      return { data, source: path, usedAlternate: index > 0 };
    } catch {
      // Try next alias.
    }
  }

  return null;
}
