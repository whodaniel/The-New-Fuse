import { relayHealthUrl } from '../lib/sharedFederation';
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

/** True when a health JSON body looks like the Nest REST API (not relay / WS gateway). */
export function isRestApiHealthPayload(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  if (isRelayHealthPayload(data)) return false;
  // WS gateway health often reports connection counters without REST service identity.
  if ('connectedClients' in record && !('service' in record) && !('name' in record)) {
    return false;
  }
  return (
    record.status === 'ok' ||
    record.status === 'healthy' ||
    record.ok === true ||
    typeof record.service === 'string' ||
    typeof record.name === 'string'
  );
}

/**
 * REST API must expose Nest/REST surfaces — bare `/health` on a WS gateway is not enough.
 * Prefer cheap `/api/v1/health` (and cousins), reject relay/gateway-shaped payloads, then
 * fall back to a capability probe that tolerates auth walls without listing all agents.
 */
export async function probeRestApiUrl(apiUrl: string, timeoutMs = 2500): Promise<boolean> {
  const base = apiUrl.replace(/\/$/, '');
  let sawRelayHealth = false;
  let sawNonRestHealthJson = false;

  for (const path of ['/api/v1/health', '/api/health', '/health']) {
    try {
      const res = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 404) continue;
      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (isRelayHealthPayload(data)) {
          sawRelayHealth = true;
          continue;
        }
        if (isRestApiHealthPayload(data)) return true;
        // Explicit REST health path with non-relay / non-gateway JSON is acceptable.
        if (
          path.startsWith('/api/') &&
          !isRelayHealthPayload(data) &&
          !(typeof data === 'object' && data !== null && 'connectedClients' in data)
        ) {
          return true;
        }
        // Parsed health JSON that is neither relay nor REST (e.g. WS gateway).
        sawNonRestHealthJson = true;
        continue;
      }

      // Non-JSON 200 on an `/api/*` health path is still REST evidence.
      if (path.startsWith('/api/')) return true;
    } catch {
      continue;
    }
  }

  // Definitive relay / non-REST health on this host → do not trust a stray capability surface.
  if (sawRelayHealth || sawNonRestHealthJson) return false;

  // Capability proof without dumping the agent roster (avoids prior /api/agents rate-limit thrash).
  try {
    const res = await fetch(`${base}/api/agents?limit=1`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok || res.status === 401 || res.status === 403 || res.status === 405) {
      return true;
    }
    // Some servers reject HEAD — retry cheap GET and accept auth walls as "surface exists".
    if (res.status === 404 || res.status === 501) {
      const getRes = await fetch(`${base}/api/agents?limit=1`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      return getRes.ok || getRes.status === 401 || getRes.status === 403;
    }
  } catch {
    // fall through
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
