type RelayJson = Record<string, unknown> | unknown[] | null;

/**
 * Reachability cache.
 *
 * This used to gate on page origin — a hosted page was assumed never able to reach loopback, so
 * local AI sources were dropped before they were ever attempted. With CSP widened and the relay
 * answering the Private Network Access preflight, a hosted page *can* reach it on Chromium
 * browsers. Safari and Firefox still refuse https: -> http://localhost, and the relay is often
 * simply not running, so we attempt the request and remember the answer: an unavailable relay
 * costs one failed fetch per TTL rather than one per call.
 */
const NEGATIVE_TTL_MS = 30_000;

type ReachabilityEntry = { reachable: boolean; checkedAt: number };

const reachability = new Map<string, ReachabilityEntry>();

function normalizeBase(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

/**
 * Shared secret for relays started with RELAY_AUTH_TOKEN. Held in a module variable rather than
 * read from storage on every call so this module stays independent of where the setting lives.
 */
let authToken = '';

export function setRelayAuthToken(token: string): void {
  authToken = (token || '').trim();
}

function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

function shouldSkip(baseUrl: string): boolean {
  const entry = reachability.get(baseUrl);
  if (!entry || entry.reachable) return false;
  return Date.now() - entry.checkedAt < NEGATIVE_TTL_MS;
}

function record(baseUrl: string, reachable: boolean): void {
  reachability.set(baseUrl, { reachable, checkedAt: Date.now() });
}

/**
 * Last known reachability for a relay base URL. `null` means "not attempted yet" — distinct from a
 * known-offline `false`, so callers can tell "still checking" apart from "cannot reach it".
 */
export function getRelayReachability(baseUrl: string): boolean | null {
  const entry = reachability.get(normalizeBase(baseUrl));
  return entry ? entry.reachable : null;
}

/** Clear cached results so the next call re-probes (used by the manual Refresh control). */
export function resetRelayReachability(baseUrl?: string): void {
  if (baseUrl) {
    reachability.delete(normalizeBase(baseUrl));
    return;
  }
  reachability.clear();
}

async function relayRequest(
  baseUrl: string,
  path: string,
  init?: RequestInit
): Promise<Response | null> {
  const base = normalizeBase(baseUrl || '');
  if (!base) return null;
  if (shouldSkip(base)) return null;

  try {
    const response = await globalThis.fetch(`${base}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers as Record<string, string> | undefined) },
    });
    // A reachable relay returning 401/404/500 is still reachable — only transport failure counts.
    record(base, true);
    return response;
  } catch {
    // Thrown by CSP refusal, mixed-content blocking, PNA denial, or a relay that isn't running.
    record(base, false);
    return null;
  }
}

export async function relayGetJson<T extends RelayJson>(
  baseUrl: string,
  path: string,
  fallback: T
): Promise<T> {
  const response = await relayRequest(baseUrl, path);
  if (!response?.ok) return fallback;
  return (await response.json()) as T;
}

export async function relayGetOptionalJson<T extends RelayJson>(
  baseUrl: string,
  path: string
): Promise<T | null> {
  const response = await relayRequest(baseUrl, path);
  if (!response?.ok) return null;
  return (await response.json()) as T;
}

export async function relayPostJson<T extends RelayJson>(
  baseUrl: string,
  path: string,
  body: unknown
): Promise<T | null> {
  const response = await relayRequest(baseUrl, path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!response?.ok) return null;
  return (await response.json().catch(() => null)) as T | null;
}
