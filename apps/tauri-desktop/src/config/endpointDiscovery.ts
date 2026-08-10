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

/**
 * REST liveness probe — use /health (not /api/agents).
 *
 * Hitting /api/agents during discovery burned the shared rate-limit budget
 * (StrictMode double-bootstrap × 4 candidates → easy 429s, then agent CRUD failed).
 * Relay vs API is already separated by different candidate ports; reject payloads
 * that advertise as a federation relay so a relay-on-API-port can't spoof us.
 */
export async function probeRestApiUrl(apiUrl: string, timeoutMs = 2500): Promise<boolean> {
  const base = apiUrl.replace(/\/$/, '');
  for (const path of ['/health', '/api/health']) {
    try {
      const res = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        if (res.status === 404) continue;
        return false;
      }
      try {
        const data = (await res.json()) as Record<string, unknown>;
        if (data?.relay === 'running') return false;
      } catch {
        // Non-JSON 200 is acceptable for simple health endpoints.
      }
      return true;
    } catch {
      // try next path
    }
  }
  return false;
}

let discoveryCache: { at: number; result: DiscoveredLocalEndpoints } | null = null;
const DISCOVERY_TTL_MS = 10_000;

/** Test / ops helper — drop the in-memory discovery memo. */
export function clearDiscoveryCache(): void {
  discoveryCache = null;
}

/**
 * Probe localhost for a running relay and REST API.
 * Used when environment is "local" so the desktop can connect even when
 * services bind to non-default ports (e.g. relay on :3007 instead of :3000).
 */
export async function discoverLocalEndpoints(): Promise<DiscoveredLocalEndpoints> {
  if (discoveryCache && Date.now() - discoveryCache.at < DISCOVERY_TTL_MS) {
    return discoveryCache.result;
  }

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

  const result: DiscoveredLocalEndpoints = {
    relayUrl,
    apiUrl,
    wsUrl: apiUrl ? deriveWsUrlFromApi(apiUrl) : null,
  };
  discoveryCache = { at: Date.now(), result };
  return result;
}
