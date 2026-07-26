/**
 * Central auth session manager for TNF frontend.
 * - Persists access + refresh tokens
 * - Silent refresh with single-flight mutex
 * - Session validation against /api/auth/session and /api/auth/me
 */

import { API_ENDPOINTS } from '@/config/api';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const ACCESS_KEYS = ['auth_token', 'authToken', 'accessToken', 'token', 'AUTH_TOKEN'] as const;
const REFRESH_KEYS = ['refresh_token', 'refreshToken', 'REFRESH_TOKEN'] as const;
const SESSION_META_KEY = 'tnf.auth.session.v1';

export type AuthConnectionState =
  | 'unknown'
  | 'checking'
  | 'authenticated'
  | 'expired'
  | 'unauthenticated'
  | 'offline';

export type AuthSessionSnapshot = {
  state: AuthConnectionState;
  user: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
  } | null;
  checkedAt: number | null;
  lastError: string | null;
};

type TokenBundle = {
  accessToken: string;
  refreshToken?: string | null;
};

type Listener = (snapshot: AuthSessionSnapshot) => void;

let refreshInFlight: Promise<string | null> | null = null;
let snapshot: AuthSessionSnapshot = {
  state: 'unknown',
  user: null,
  checkedAt: null,
  lastError: null,
};
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch {
      /* ignore listener errors */
    }
  }
}

function setSnapshot(partial: Partial<AuthSessionSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  try {
    sessionStorage.setItem(
      SESSION_META_KEY,
      JSON.stringify({
        state: snapshot.state,
        user: snapshot.user,
        checkedAt: snapshot.checkedAt,
      })
    );
  } catch {
    /* ignore */
  }
  emit();
}

function readFirst(keys: readonly string[], stores: Storage[]): string | null {
  for (const store of stores) {
    for (const key of keys) {
      try {
        const value = store.getItem(key);
        if (value?.trim()) return value.trim();
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

function writeAll(keys: readonly string[], value: string | null) {
  for (const key of keys) {
    try {
      if (value) {
        localStorage.setItem(key, value);
        // Keep primary key mirrored in sessionStorage for tab-scoped recovery.
        if (key === keys[0]) sessionStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return readFirst(ACCESS_KEYS, [localStorage, sessionStorage]);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return readFirst(REFRESH_KEYS, [localStorage, sessionStorage]);
}

export function persistTokens(bundle: TokenBundle): void {
  writeAll(ACCESS_KEYS, bundle.accessToken);
  if (bundle.refreshToken !== undefined) {
    writeAll(REFRESH_KEYS, bundle.refreshToken);
  }
}

export function clearTokens(): void {
  writeAll(ACCESS_KEYS, null);
  writeAll(REFRESH_KEYS, null);
  setSnapshot({
    state: 'unauthenticated',
    user: null,
    checkedAt: Date.now(),
    lastError: null,
  });
}

export function getAuthSessionSnapshot(): AuthSessionSnapshot {
  return snapshot;
}

export function subscribeAuthSession(listener: Listener): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => listeners.delete(listener);
}

function resolveApiUrl(path: string): string {
  const base = String(import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) return normalizedPath;
  if (normalizedPath.startsWith('/api/') && base.endsWith('/api')) {
    return `${base}${normalizedPath.slice(4)}`;
  }
  return `${base}${normalizedPath}`;
}

async function postRefresh(refreshToken: string | null): Promise<TokenBundle | null> {
  const url = resolveApiUrl(API_ENDPOINTS.AUTH.REFRESH.replace(/^.*\/api/, '/api'));
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(refreshToken ? { refreshToken, refresh_token: refreshToken } : {}),
    });
    if (!res.ok) return null;
    const raw = await res.json();
    const payload = raw?.data ?? raw;
    const accessToken = payload?.accessToken || payload?.access_token || payload?.token || null;
    if (!accessToken) return null;
    return {
      accessToken: String(accessToken),
      refreshToken: payload?.refreshToken || payload?.refresh_token || refreshToken || null,
    };
  } catch {
    return null;
  }
}

async function refreshViaSupabase(): Promise<string | null> {
  if (!hasSupabaseConfig || !supabase) return null;
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session?.access_token) return null;
    // Exchange for app JWT when possible
    const exchangeUrl = resolveApiUrl(
      API_ENDPOINTS.AUTH.SUPABASE_EXCHANGE.replace(/^.*\/api/, '/api')
    );
    const res = await fetch(exchangeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ accessToken: data.session.access_token }),
    });
    if (res.ok) {
      const raw = await res.json();
      const payload = raw?.data ?? raw;
      const appToken = payload?.accessToken || payload?.access_token || payload?.token;
      if (appToken) {
        persistTokens({
          accessToken: String(appToken),
          refreshToken: payload?.refreshToken || payload?.refresh_token || getRefreshToken(),
        });
        return String(appToken);
      }
    }
    // Fall back to using Supabase access token directly
    persistTokens({ accessToken: data.session.access_token });
    return data.session.access_token;
  } catch {
    return null;
  }
}

/**
 * Single-flight silent refresh. Returns a fresh access token or null.
 */
export async function silentRefreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    const bundle = await postRefresh(refreshToken);
    if (bundle?.accessToken) {
      persistTokens(bundle);
      return bundle.accessToken;
    }
    return refreshViaSupabase();
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function getAuthTokenCandidates(): Promise<string[]> {
  const tokens: string[] = [];
  const access = getAccessToken();
  if (access) tokens.push(access);

  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session?.access_token) {
        tokens.push(data.session.access_token);
      }
    } catch {
      /* ignore */
    }
  }
  return Array.from(new Set(tokens));
}

/**
 * Validate session against API. Updates connection snapshot for UI chips.
 */
export async function validateAuthSession(): Promise<AuthSessionSnapshot> {
  setSnapshot({ state: 'checking', lastError: null });

  const token = getAccessToken();
  if (!token) {
    // Try silent refresh before declaring unauthenticated
    const refreshed = await silentRefreshAccessToken();
    if (!refreshed) {
      setSnapshot({
        state: 'unauthenticated',
        user: null,
        checkedAt: Date.now(),
        lastError: null,
      });
      return snapshot;
    }
  }

  const access = getAccessToken();
  if (!access) {
    setSnapshot({
      state: 'unauthenticated',
      user: null,
      checkedAt: Date.now(),
      lastError: null,
    });
    return snapshot;
  }

  try {
    const sessionUrl = resolveApiUrl('/api/auth/session');
    const res = await fetch(sessionUrl, {
      headers: { Authorization: `Bearer ${access}` },
      credentials: 'include',
    });

    if (res.status === 401 || res.status === 403) {
      const next = await silentRefreshAccessToken();
      if (!next) {
        setSnapshot({
          state: 'expired',
          user: null,
          checkedAt: Date.now(),
          lastError: 'Session expired',
        });
        return snapshot;
      }
      return validateAuthSession();
    }

    if (!res.ok) {
      setSnapshot({
        state: 'offline',
        checkedAt: Date.now(),
        lastError: `Session check failed (${res.status})`,
      });
      return snapshot;
    }

    const raw = await res.json();
    const payload = raw?.data ?? raw;
    if (payload?.authenticated && payload?.user) {
      setSnapshot({
        state: 'authenticated',
        user: {
          id: String(payload.user.id || ''),
          email: payload.user.email,
          name: payload.user.name || payload.user.username,
          role: payload.user.role,
        },
        checkedAt: Date.now(),
        lastError: null,
      });
      return snapshot;
    }

    setSnapshot({
      state: 'unauthenticated',
      user: null,
      checkedAt: Date.now(),
      lastError: null,
    });
    return snapshot;
  } catch (error) {
    setSnapshot({
      state: 'offline',
      checkedAt: Date.now(),
      lastError: error instanceof Error ? error.message : 'Network error',
    });
    return snapshot;
  }
}

/** Persist tokens from any auth API payload shape. */
export function persistAuthPayload(
  payload: Record<string, unknown> | null | undefined
): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = (payload.data as Record<string, unknown> | undefined) || payload;
  const access =
    (data.accessToken as string | undefined) ||
    (data.access_token as string | undefined) ||
    (data.token as string | undefined) ||
    null;
  if (!access) return null;
  const refresh =
    (data.refreshToken as string | undefined) || (data.refresh_token as string | undefined) || null;
  persistTokens({ accessToken: access, refreshToken: refresh });
  return access;
}

export function consumeDeepLinkNext(defaultPath = '/dashboard'): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('next') || params.get('redirect') || params.get('returnTo');
    if (fromQuery?.startsWith('/') && !fromQuery.startsWith('//')) {
      return fromQuery;
    }
    const stored = sessionStorage.getItem('tnf.auth.next');
    sessionStorage.removeItem('tnf.auth.next');
    if (stored?.startsWith('/') && !stored.startsWith('//')) return stored;
  } catch {
    /* ignore */
  }
  return defaultPath;
}

export function stashDeepLinkNext(path: string | null | undefined): void {
  if (!path?.startsWith('/') || path.startsWith('//')) return;
  try {
    sessionStorage.setItem('tnf.auth.next', path);
  } catch {
    /* ignore */
  }
}
