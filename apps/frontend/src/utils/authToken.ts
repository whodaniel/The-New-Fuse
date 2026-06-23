import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const AUTH_TOKEN_KEYS = ['auth_token', 'authToken', 'accessToken', 'token', 'AUTH_TOKEN'] as const;

/** Read the app-issued JWT from browser storage (preferred for TNF API routes). */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  for (const key of AUTH_TOKEN_KEYS) {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal?.trim()) return fromLocal.trim();

    const fromSession = sessionStorage.getItem(key);
    if (fromSession?.trim()) return fromSession.trim();
  }

  return null;
}

/**
 * Resolve bearer token candidates in priority order.
 * App JWT is tried before Supabase session tokens to avoid 401 desync on timeline and ledger routes.
 */
export async function getAuthTokenCandidates(): Promise<string[]> {
  const tokens: string[] = [];
  const storedToken = getStoredAuthToken();
  if (storedToken) tokens.push(storedToken);

  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session?.access_token) {
        tokens.push(data.session.access_token);
      }
    } catch {
      // Fall through — caller handles unauthenticated responses.
    }
  }

  return Array.from(new Set(tokens));
}

export async function buildAuthHeaders(
  baseHeaders: HeadersInit = {}
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (baseHeaders instanceof Headers) {
    baseHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(baseHeaders)) {
    for (const [key, value] of baseHeaders) headers[key] = value;
  } else if (baseHeaders) {
    Object.assign(headers, baseHeaders);
  }

  if (!headers.Authorization) {
    const candidates = await getAuthTokenCandidates();
    if (candidates[0]) {
      headers.Authorization = `Bearer ${candidates[0]}`;
    }
  }

  return headers;
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = await buildAuthHeaders(init?.headers);
  const tokenCandidates = await getAuthTokenCandidates();
  const authOptions = tokenCandidates.length > 0 ? tokenCandidates : [null];

  let lastResponse: Response | null = null;
  for (let i = 0; i < authOptions.length; i += 1) {
    const token = authOptions[i];
    const attemptHeaders = { ...headers };
    if (token) {
      attemptHeaders.Authorization = `Bearer ${token}`;
    } else {
      delete attemptHeaders.Authorization;
    }

    const response = await fetch(input, {
      ...init,
      headers: attemptHeaders,
      credentials: init?.credentials ?? 'include',
    });
    lastResponse = response;

    const canRetry = i < authOptions.length - 1;
    if ((response.status === 401 || response.status === 403) && canRetry) {
      continue;
    }
    return response;
  }

  return (
    lastResponse ?? fetch(input, { ...init, headers, credentials: init?.credentials ?? 'include' })
  );
}
