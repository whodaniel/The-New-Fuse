import {
  getAccessToken,
  getAuthTokenCandidates as sessionTokenCandidates,
  silentRefreshAccessToken,
} from '@/services/authSession';
import { API_BASE } from '@/config/api';
import {
  isRateLimitBlocked,
  noteRateLimitResponse,
  RateLimitedError,
  getRateLimitRetryAfterMs,
} from '@/utils/rateLimitCoordinator';

const AUTH_TOKEN_KEYS = ['auth_token', 'authToken', 'accessToken', 'token', 'AUTH_TOKEN'] as const;

/** Read the app-issued JWT from browser storage (preferred for TNF API routes). */
export function getStoredAuthToken(): string | null {
  return getAccessToken();
}

/**
 * Resolve bearer token candidates in priority order.
 * App JWT is tried before Supabase session tokens to avoid 401 desync on timeline and ledger routes.
 */
export async function getAuthTokenCandidates(): Promise<string[]> {
  return sessionTokenCandidates();
}

/**
 * Resolve a potentially relative /api/... URL to the configured canonical API base.
 *
 * Problem: `authFetch('/api/billing/membership/me')` is correct in development (Vite
 * dev server proxies /api → localhost API) but broken in production where the
 * Cloudflare Pages /api proxy is non-functional. In production, requests must be
 * sent to the absolute VITE_API_URL configured in api-base.ts.
 *
 * Solution: if the input is a plain string that starts with /api, we rewrite it to
 * `${API_BASE}${rest}` where:
 *   - In dev:  API_BASE = '/api' → result is '/api/foo'              (unchanged, Vite proxies it)
 *   - In prod: API_BASE = 'https://api.thenewfuse.com/api' → absolute URL, bypasses CF proxy
 *
 * Inputs that are already absolute URLs, URL objects, or don't start with /api are
 * passed through unchanged — this function is intentionally narrow in scope.
 */
export function resolveApiUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input !== 'string') return input;

  // Already absolute — nothing to do
  if (input.startsWith('http://') || input.startsWith('https://')) return input;

  // Only rewrite paths that start with exactly /api followed by / or ? or end-of-string
  const afterPrefix = input.slice('/api'.length);
  if (
    !input.startsWith('/api') ||
    (afterPrefix.length > 0 && afterPrefix[0] !== '/' && afterPrefix[0] !== '?')
  ) {
    return input;
  }

  // API_BASE already ends with /api (e.g. '/api' or 'https://…/api')
  // Strip the leading /api from the input to avoid doubling it
  return `${API_BASE}${afterPrefix}`;
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
  if (isRateLimitBlocked()) {
    const retryAfterMs = getRateLimitRetryAfterMs();
    throw new RateLimitedError(
      `Rate limit exceeded. Please retry in ${Math.ceil(retryAfterMs / 1000)}s.`,
      retryAfterMs
    );
  }

  // Transparently rewrite relative /api/... paths to the canonical absolute API origin.
  // This is the single authoritative resolution point so every caller — including the
  // ~70 existing callsites that pass bare /api/... strings — becomes production-safe
  // without needing per-callsite changes.
  const resolvedInput = resolveApiUrl(input);

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

    const response = await fetch(resolvedInput, {
      ...init,
      headers: attemptHeaders,
      credentials: init?.credentials ?? 'include',
    });
    lastResponse = response;

    if (response.status === 429) {
      noteRateLimitResponse(response);
      return response;
    }

    const canRetryToken = i < authOptions.length - 1;
    if ((response.status === 401 || response.status === 403) && canRetryToken) {
      continue;
    }

    // Silent refresh once, then retry original request with new bearer.
    if (response.status === 401 || response.status === 403) {
      const refreshed = await silentRefreshAccessToken();
      if (refreshed) {
        const retryHeaders = { ...attemptHeaders, Authorization: `Bearer ${refreshed}` };
        const retryResponse = await fetch(resolvedInput, {
          ...init,
          headers: retryHeaders,
          credentials: init?.credentials ?? 'include',
        });
        if (retryResponse.status === 429) {
          noteRateLimitResponse(retryResponse);
        }
        return retryResponse;
      }
    }

    return response;
  }

  return (
    lastResponse ??
    fetch(resolvedInput, { ...init, headers, credentials: init?.credentials ?? 'include' })
  );
}

// Re-export for callers that imported storage keys historically
export { AUTH_TOKEN_KEYS };
