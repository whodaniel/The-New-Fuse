import { relayHealthUrl } from '@the-new-fuse/shared/federation/protocol';
import { deriveWsUrlFromApi } from './endpoints';

/** Common local relay WebSocket URLs (inspect order: most likely dev ports first). */
export const LOCAL_RELAY_CANDIDATES = [
  'ws://127.0.0.1:3007/ws',
  'ws://127.0.0.1:3000/ws',
  'ws://127.0.0.1:3010/ws',
] as const;

/** Common local REST API base URLs. */
export const LOCAL_API_CANDIDATES = [
  'http://127.0.0.1:3001',
  'http://localhost:3001',
  'http://127.0.0.1:3005',
  'http://localhost:3005',
] as const;

export interface DiscoveredLocalEndpoints {
  relayUrl: string | null;
  apiUrl: string | null;
  wsUrl: string | null;
}

/** True when the health payload looks like a federation relay (not a generic WS gateway). */
export function isRelayHealthPayload(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return record.status === 'ok' && (record.relay === 'running' || 'agents' in record);
}

export async function probeRelayUrl(relayUrl: string, timeoutMs = 2500): Promise<boolean> {
  try {
    const res = await fetch(relayHealthUrl(relayUrl), {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return isRelayHealthPayload(data);
  } catch {
    return false;
  }
}

/** REST API must expose agent CRUD — /health alone is not enough (WS gateways also return ok). */
export async function probeRestApiUrl(apiUrl: string, timeoutMs = 2500): Promise<boolean> {
  const base = apiUrl.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/api/agents`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Probe localhost for a running relay and REST API.
 * Used when environment is "local" so the desktop can connect even when
 * services bind to non-default ports (e.g. relay on :3007 instead of :3000).
 */
export async function discoverLocalEndpoints(): Promise<DiscoveredLocalEndpoints> {
  let relayUrl: string | null = null;
  for (const candidate of LOCAL_RELAY_CANDIDATES) {
    if (await probeRelayUrl(candidate)) {
      relayUrl = candidate;
      break;
    }
  }

  let apiUrl: string | null = null;
  for (const candidate of LOCAL_API_CANDIDATES) {
    if (await probeRestApiUrl(candidate)) {
      apiUrl = candidate;
      break;
    }
  }

  return {
    relayUrl,
    apiUrl,
    wsUrl: apiUrl ? deriveWsUrlFromApi(apiUrl) : null,
  };
}
