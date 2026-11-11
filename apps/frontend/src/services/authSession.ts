/**
 * Central auth session manager for TNF frontend.
 * - Persists access + refresh tokens
 * - Silent refresh with single-flight mutex
 * - Session validation against /api/auth/session and /api/auth/me
 */

import { API_BASE, API_ENDPOINTS } from '@/config/api';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { AuthTransientError, authRequest, withAuthDeadline } from './authRequest';

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

export type JwtUserClaims = {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
};

function decodeBase64Url(segment: string): string | null {
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLength);
    if (typeof atob === 'function') {
      return atob(padded);
    }
    return null;
  } catch {
    return null;
  }
}

export function parseJwtPayload(token: string | null | undefined): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return null;
  try {
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string | null | undefined): boolean | null {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000 <= Date.now();
}

/** True when the bearer is a Supabase Auth JWT (not a TNF app JWT). */
export function isSupabaseAccessToken(token: string | null | undefined): boolean {
  const payload = parseJwtPayload(token);
  if (!payload) return false;
  const iss = String(payload.iss ?? '');
  // Real Supabase access tokens always carry an iss host under supabase.co.
  // Do not key only on role=authenticated — offline/test JWTs use that too.
  if (/supabase/i.test(iss)) return true;
  const role = String(payload.role ?? '').toLowerCase();
  const aud = String(payload.aud ?? '').toLowerCase();
  return (
    role === 'authenticated' &&
    aud === 'authenticated' &&
    !Array.isArray(payload.roles) &&
    typeof payload.username !== 'string' &&
    (typeof payload.session_id === 'string' || typeof payload.aal === 'string')
  );
}

/**
 * True when the bearer is usable as a TNF platform token (not a Supabase
 * session JWT). Opaque non-JWT strings are allowed for legacy/test tokens.
 */
export function isAppAccessToken(token: string | null | undefined): boolean {
  if (!token || isJwtExpired(token) === true) return false;
  if (isSupabaseAccessToken(token)) return false;
  const payload = parseJwtPayload(token);
  // Non-JWT opaque tokens (unit tests / legacy) are treated as app tokens.
  if (!payload) return true;
  return (
    typeof payload.sub === 'string' ||
    typeof payload.id === 'string' ||
    Array.isArray(payload.roles) ||
    Array.isArray(payload.permissions) ||
    typeof payload.username === 'string'
  );
}

export function extractJwtUser(token: string | null | undefined): JwtUserClaims | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
    return null;
  }
  const userMeta =
    payload.user_metadata && typeof payload.user_metadata === 'object'
      ? (payload.user_metadata as Record<string, unknown>)
      : {};
  const appMeta =
    payload.app_metadata && typeof payload.app_metadata === 'object'
      ? (payload.app_metadata as Record<string, unknown>)
      : {};
  const id = String(payload.sub ?? payload.id ?? userMeta.sub ?? '').trim();
  if (!id) return null;
  const email = String(payload.email ?? userMeta.email ?? '').trim();
  const name = String(
    payload.name ?? userMeta.full_name ?? userMeta.name ?? (email || 'User')
  ).trim();
  const rawRole = String(appMeta.role ?? userMeta.role ?? payload.role ?? 'USER').trim();
  const normalizedRole =
    rawRole.toLowerCase() === 'authenticated' || rawRole.toLowerCase() === 'anon' || !rawRole
      ? 'USER'
      : rawRole;
  const roles = Array.isArray(payload.roles)
    ? payload.roles.map((r) => String(r))
    : Array.isArray(appMeta.roles)
      ? appMeta.roles.map((r) => String(r))
      : [normalizedRole];
  return {
    id,
    email,
    name,
    role: normalizedRole,
    roles,
  };
}

async function resolveFallbackSessionUser(
  accessToken: string | null
): Promise<AuthSessionSnapshot['user']> {
  if (hasSupabaseConfig && supabase) {
    try {
      const { data } = await withAuthDeadline(() => supabase!.auth.getSession());
      const supaUser = data?.session?.user;
      if (supaUser?.id) {
        const userMeta = (supaUser.user_metadata ?? {}) as Record<string, unknown>;
        const appMeta = (supaUser.app_metadata ?? {}) as Record<string, unknown>;
        const rawRole = String(appMeta.role ?? userMeta.role ?? supaUser.role ?? 'USER');
        const role =
          rawRole.toLowerCase() === 'authenticated' || rawRole.toLowerCase() === 'anon'
            ? 'USER'
            : rawRole;
        return {
          id: String(supaUser.id),
          email: supaUser.email,
          name: String(userMeta.full_name ?? userMeta.name ?? supaUser.email ?? 'User'),
          role,
        };
      }
    } catch {
      /* fall through to JWT claims */
    }
  }
  const jwtUser = extractJwtUser(accessToken);
  if (jwtUser) {
    return {
      id: jwtUser.id,
      email: jwtUser.email || undefined,
      name: jwtUser.name,
      role: jwtUser.role,
    };
  }
  return null;
}

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

function readSupabaseStoredToken(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const sessionObj = parsed?.currentSession ?? parsed?.session ?? parsed;
      const accessToken =
        typeof sessionObj?.access_token === 'string' && sessionObj.access_token.trim()
          ? sessionObj.access_token.trim()
          : null;
      const refreshToken =
        typeof sessionObj?.refresh_token === 'string' && sessionObj.refresh_token.trim()
          ? sessionObj.refresh_token.trim()
          : null;
      if (accessToken && isJwtExpired(accessToken) !== true) {
        return { accessToken, refreshToken };
      }
    }
  } catch {
    /* ignore storage parse errors */
  }
  return { accessToken: null, refreshToken: null };
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const direct = readFirst(ACCESS_KEYS, [localStorage, sessionStorage]);
  // Never treat a Supabase session JWT as the TNF app bearer — timeline/ledger
  // JwtAuthGuard verifies against JWT_SECRET and rejects provider tokens with 401.
  if (direct && isAppAccessToken(direct)) return direct;
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = readFirst(REFRESH_KEYS, [localStorage, sessionStorage]);
  if (!token) return null;
  // Avoid sending a Supabase refresh token to /auth/refresh.
  if (token === getAccessToken()) return null;
  if (isSupabaseAccessToken(token)) return null;
  return token;
}

export function persistTokens(bundle: TokenBundle): void {
  // Refuse to persist provider tokens into app auth_token slots.
  if (bundle.accessToken && isSupabaseAccessToken(bundle.accessToken)) {
    return;
  }
  writeAll(ACCESS_KEYS, bundle.accessToken);
  if (bundle.refreshToken !== undefined) {
    writeAll(REFRESH_KEYS, bundle.refreshToken);
  }
}

export function clearTokens(): void {
  writeAll(ACCESS_KEYS, null);
  writeAll(REFRESH_KEYS, null);
  if (typeof window !== 'undefined') {
    for (const store of [localStorage, sessionStorage]) {
      try {
        const toRemove: string[] = [];
        for (let i = 0; i < store.length; i += 1) {
          const key = store.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            toRemove.push(key);
          }
        }
        for (const key of toRemove) {
          store.removeItem(key);
        }
      } catch {
        /* ignore storage cleanup errors */
      }
    }
  }
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
  const base = String(API_BASE).trim().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) return normalizedPath;
  if (normalizedPath.startsWith('/api/') && base.endsWith('/api')) {
    return `${base}${normalizedPath.slice(4)}`;
  }
  return `${base}${normalizedPath}`;
}

async function postRefresh(
  refreshToken: string | null,
  signal: AbortSignal
): Promise<TokenBundle | null> {
  const url = resolveApiUrl(API_ENDPOINTS.AUTH.REFRESH.replace(/^.*\/api/, '/api'));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    signal,
    body: JSON.stringify(refreshToken ? { refreshToken, refresh_token: refreshToken } : {}),
  });
  // A missing cookie or rejected refresh credential may use the Supabase exchange.
  if (res.status === 400 || res.status === 401) return null;
  if (!res.ok)
    throw new AuthTransientError(`Session refresh unavailable (${res.status})`, res.status);
  const raw = await res.json();
  const payload = raw?.data ?? raw;
  const accessToken = payload?.accessToken || payload?.access_token || payload?.token;
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new AuthTransientError('Session refresh returned an invalid response');
  }
  return {
    accessToken,
    refreshToken: payload?.refreshToken || payload?.refresh_token || refreshToken || null,
  };
}

async function refreshViaSupabase(signal: AbortSignal): Promise<string | null> {
  if (!hasSupabaseConfig || !supabase) return null;
  const { data, error } = await supabase.auth.refreshSession();
  signal.throwIfAborted();
  if (error) {
    if (error.status === 400 || error.status === 401) return null;
    throw new AuthTransientError('Session provider is temporarily unavailable');
  }
  const supaAccess = data.session?.access_token;
  const supaRefresh = data.session?.refresh_token || null;
  if (!supaAccess) return null;
  try {
    const res = await fetch(
      resolveApiUrl(API_ENDPOINTS.AUTH.SUPABASE_EXCHANGE.replace(/^.*\/api/, '/api')),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal,
        body: JSON.stringify({ accessToken: supaAccess }),
      }
    );
    if (res.status === 401) return null;
    if (!res.ok) {
      // Do not persist/return the raw Supabase bearer — JwtAuthGuard on
      // timeline/ledger rejects it and leaves the SPA looking authenticated.
      throw new AuthTransientError(
        `Session exchange unavailable (${res.status})`,
        res.status
      );
    }
    const raw = await res.json();
    const payload = raw?.data ?? raw;
    const token = payload?.accessToken || payload?.access_token || payload?.token;
    if (typeof token !== 'string' || !token.trim()) {
      throw new AuthTransientError('Session exchange returned an invalid response');
    }
    signal.throwIfAborted();
    persistTokens({
      accessToken: token,
      refreshToken: payload?.refreshToken || payload?.refresh_token || supaRefresh,
    });
    return token;
  } catch (err) {
    signal.throwIfAborted();
    if (err instanceof AuthTransientError) throw err;
    throw new AuthTransientError('Unable to refresh session via identity provider.');
  }
}

/**
 * Single-flight silent refresh. Returns a fresh access token or null.
 */
export async function silentRefreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = withAuthDeadline(async (signal) => {
    const refreshToken = getRefreshToken();
    const bundle = await postRefresh(refreshToken, signal);
    signal.throwIfAborted();
    if (bundle?.accessToken && isAppAccessToken(bundle.accessToken)) {
      persistTokens(bundle);
      return bundle.accessToken;
    }
    const exchanged = await refreshViaSupabase(signal);
    return exchanged && isAppAccessToken(exchanged) ? exchanged : null;
  })
    .catch((error) => {
      throw error instanceof AuthTransientError
        ? error
        : new AuthTransientError('Unable to refresh session. Please retry.');
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

/**
 * Ensure a TNF app JWT is available for protected API routes (timeline/ledger).
 * Exchanges the active Supabase session when the app bearer is missing/stale.
 */
export async function ensureAppAccessToken(): Promise<string | null> {
  const current = getAccessToken();
  if (current && isAppAccessToken(current)) return current;
  try {
    const refreshed = await silentRefreshAccessToken();
    if (refreshed && isAppAccessToken(refreshed)) return refreshed;
  } catch {
    /* fall through */
  }
  return getAccessToken();
}

export async function getAuthTokenCandidates(): Promise<string[]> {
  const tokens: string[] = [];
  const access = getAccessToken();
  if (access) tokens.push(access);

  if (tokens.length === 0 && hasSupabaseConfig && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const supaToken = data?.session?.access_token?.trim();
      if (supaToken) {
        // Return Supabase as a candidate for exchange/refresh paths, but do not
        // write it into auth_token keys — timeline/ledger guards reject it.
        tokens.push(supaToken);
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
export async function validateAuthSession(allowRefresh = true): Promise<AuthSessionSnapshot> {
  setSnapshot({ state: 'checking', lastError: null });

  try {
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

    const sessionUrl = resolveApiUrl('/api/auth/session');
    const res = await authRequest(sessionUrl, {
      headers: { Authorization: `Bearer ${access}` },
      credentials: 'include',
    });

    if (res.status === 401) {
      const next = allowRefresh ? await silentRefreshAccessToken() : null;
      if (!next) {
        setSnapshot({
          state: 'expired',
          user: null,
          checkedAt: Date.now(),
          lastError: 'Session expired',
        });
        return snapshot;
      }
      return validateAuthSession(false);
    }

    if (!res.ok) {
      const fallbackUser = await resolveFallbackSessionUser(access);
      if (fallbackUser) {
        setSnapshot({
          state: 'authenticated',
          user: fallbackUser,
          checkedAt: Date.now(),
          lastError: null,
        });
        return snapshot;
      }
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
    const fallbackUser = await resolveFallbackSessionUser(getAccessToken());
    if (fallbackUser) {
      setSnapshot({
        state: 'authenticated',
        user: fallbackUser,
        checkedAt: Date.now(),
        lastError: null,
      });
      return snapshot;
    }
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
