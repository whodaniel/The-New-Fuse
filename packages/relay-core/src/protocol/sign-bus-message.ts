/**
 * Sign A2A / TNF bus payloads with the canonical scripts/lib/tnf-message-auth.cjs
 * implementation so broker/relay publishes verify on RedisAgentClient receivers.
 *
 * Fail-open to unsigned JSON only when signing itself throws — warn-mode bus
 * still accepts unsigned; enforce mode will reject at the consumer.
 */
import { createRequire } from 'node:module';
import path from 'node:path';

type MessageAuth = {
  isSignedEnvelope: (value: unknown) => boolean;
  signEnvelope: (
    header: { agent_id: string },
    payload: { type: string; channel?: string; data: unknown }
  ) => { header: object; payload: object; signature: string };
};

let cached: MessageAuth | null = null;

function resolveMessageAuth(): MessageAuth | null {
  if (cached) return cached;
  const require = createRequire(__filename);
  const candidates = [
    path.resolve(__dirname, '../../../../scripts/lib/tnf-message-auth.cjs'),
    path.resolve(process.cwd(), 'scripts/lib/tnf-message-auth.cjs'),
    path.resolve(process.cwd(), '../../scripts/lib/tnf-message-auth.cjs'),
  ];
  for (const candidate of candidates) {
    try {
      cached = require(candidate) as MessageAuth;
      return cached;
    } catch {
      /* try next */
    }
  }
  return null;
}

function looksLikeBusEnvelope(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return Boolean(o.type || o.payload || o.from || o.to);
}

/**
 * Return a JSON string suitable for Redis publish. TNF envelopes are signed;
 * already-signed packets and non-envelope telemetry pass through.
 */
export function stringifySignedBusMessage(
  agentId: string,
  channel: string,
  message: unknown,
  typeHint?: string
): string {
  const auth = resolveMessageAuth();
  let obj: unknown = message;
  if (typeof message === 'string') {
    try {
      obj = JSON.parse(message);
    } catch {
      return message;
    }
  }

  if (!auth || !looksLikeBusEnvelope(obj) || auth.isSignedEnvelope(obj)) {
    return typeof message === 'string' ? message : JSON.stringify(message ?? null);
  }

  const type =
    typeHint ||
    (typeof (obj as { type?: unknown }).type === 'string'
      ? String((obj as { type: string }).type)
      : 'event');

  try {
    const signed = auth.signEnvelope({ agent_id: agentId }, { type, channel, data: obj });
    return JSON.stringify(signed);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[sign-bus-message] signing failed; publishing unsigned (${reason})`);
    return typeof message === 'string' ? message : JSON.stringify(obj);
  }
}
