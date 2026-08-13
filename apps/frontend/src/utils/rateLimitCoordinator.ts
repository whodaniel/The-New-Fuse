/**
 * Coordinates client-side pause after HTTP 429 so polling doesn't keep
 * hammering a shared IP/user rate-limit budget (and starving chat/AI).
 */

const DEFAULT_HOLD_MS = 15_000;
const MAX_HOLD_MS = 120_000;

let blockedUntil = 0;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // ignore subscriber errors
    }
  }
}

export function getRateLimitBlockedUntil(): number {
  return blockedUntil;
}

export function isRateLimitBlocked(now = Date.now()): boolean {
  return now < blockedUntil;
}

export function getRateLimitRetryAfterMs(now = Date.now()): number {
  return Math.max(0, blockedUntil - now);
}

export function subscribeRateLimitBlock(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function noteRateLimitResponse(response: Response, now = Date.now()): void {
  if (response.status !== 429) return;

  const retryAfterHeader = response.headers.get('Retry-After');
  let holdMs = DEFAULT_HOLD_MS;

  if (retryAfterHeader) {
    const asSeconds = Number(retryAfterHeader);
    if (Number.isFinite(asSeconds) && asSeconds > 0) {
      holdMs = Math.min(MAX_HOLD_MS, Math.max(1_000, Math.ceil(asSeconds * 1000)));
    } else {
      const asDate = Date.parse(retryAfterHeader);
      if (Number.isFinite(asDate)) {
        holdMs = Math.min(MAX_HOLD_MS, Math.max(1_000, asDate - now));
      }
    }
  }

  const nextBlockedUntil = now + holdMs;
  if (nextBlockedUntil > blockedUntil) {
    blockedUntil = nextBlockedUntil;
    notify();
  }
}

export function clearRateLimitBlock(): void {
  if (blockedUntil === 0) return;
  blockedUntil = 0;
  notify();
}

/** Dynamic refetchInterval helper for react-query polls. */
export function rateLimitAwareInterval(baseMs: number): number | false {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return false;
  }
  if (isRateLimitBlocked()) {
    return false;
  }
  return baseMs;
}

export class RateLimitedError extends Error {
  status = 429;
  retryAfterMs: number;

  constructor(message = 'Rate limit exceeded. Please try again later.', retryAfterMs = 0) {
    super(message);
    this.name = 'RateLimitedError';
    this.retryAfterMs = retryAfterMs;
  }
}
