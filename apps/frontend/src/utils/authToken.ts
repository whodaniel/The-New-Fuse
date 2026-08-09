import {
  getAccessToken,
  getAuthTokenCandidates as sessionTokenCandidates,
  silentRefreshAccessToken,
} from '@/services/authSession';
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
        const retryResponse = await fetch(input, {
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
    lastResponse ?? fetch(input, { ...init, headers, credentials: init?.credentials ?? 'include' })
  );
}

// Re-export for callers that imported storage keys historically
export { AUTH_TOKEN_KEYS };
