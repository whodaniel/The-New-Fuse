import type { RelayAuthError } from '../services/operatorSynergy/types';

/**
 * Turns the relay's raw REGISTRATION_ERROR payload (e.g.
 * `{"error":"Authentication required. Set JWT_SECRET or RELAY_ALLOW_ANONYMOUS=1","code":"AUTH_REQUIRED"}`,
 * see packages/relay-core/src/standalone-relay.ts) into one line an operator
 * can act on, instead of every "federation stuck" surface inventing its own
 * vague "still connecting…" copy or leaving the JSON to be found only in the
 * activity log.
 *
 * `RELAY_ALLOW_ANONYMOUS`/`JWT_SECRET` are read once at relay process start
 * (packages/relay-core/src/standalone-relay.ts), so this is a restart-required
 * fix, not something the desktop app can flip live — the hint says so.
 */
export function relayAuthHint(snapshot: {
  relayAuthError: RelayAuthError | null;
}): string | null {
  const err = snapshot.relayAuthError;
  if (!err) return null;
  if (err.code === 'AUTH_REQUIRED') {
    return `${err.message} — set it in the relay's environment, then restart the relay process (env vars are read once at startup).`;
  }
  return err.message;
}

export default relayAuthHint;
