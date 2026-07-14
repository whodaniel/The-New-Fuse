export type TnfDesktopEnvironment = 'local' | 'sandbox' | 'production' | 'custom';

export interface EndpointSet {
  api: string;
  ws: string;
  relay: string;
}

export const LOCAL_ENDPOINTS: EndpointSet = {
  api: 'http://localhost:3001',
  ws: 'ws://localhost:3001/ws',
  // Default relay port; local bootstrap probes 3007/3010 if 3000 is down.
  relay: 'ws://127.0.0.1:3000/ws',
};

export const SANDBOX_ENDPOINTS: EndpointSet = {
  api: 'https://api-gateway-241337102384.us-central1.run.app',
  ws: 'wss://api-gateway-241337102384.us-central1.run.app/ws',
  relay: 'wss://api-gateway-241337102384.us-central1.run.app/ws',
};

export const PRODUCTION_ENDPOINTS: EndpointSet = {
  api: 'https://thenewfuse.com/api',
  ws: 'wss://thenewfuse.com/ws',
  relay: 'wss://thenewfuse.com/ws',
};

export const ENV_ENDPOINTS: Record<Exclude<TnfDesktopEnvironment, 'custom'>, EndpointSet> = {
  local: LOCAL_ENDPOINTS,
  sandbox: SANDBOX_ENDPOINTS,
  production: PRODUCTION_ENDPOINTS,
};

export function normalizeWebSocketUrl(url: string): string {
  const trimmed = String(url || '').trim();
  if (!trimmed) {
    return SANDBOX_ENDPOINTS.ws;
  }

  if (trimmed.startsWith('http://')) {
    return `ws://${trimmed.slice('http://'.length)}`;
  }

  if (trimmed.startsWith('https://')) {
    return `wss://${trimmed.slice('https://'.length)}`;
  }

  return trimmed;
}

export function ensureWsPath(url: string, wsPath = '/ws'): string {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = wsPath;
      return parsed.toString().replace(/\/$/, '');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function deriveWsUrlFromApi(apiUrl: string): string {
  const normalizedApi = String(apiUrl || '')
    .trim()
    .replace(/\/$/, '');
  if (!normalizedApi) {
    return SANDBOX_ENDPOINTS.ws;
  }

  if (normalizedApi.startsWith('ws://') || normalizedApi.startsWith('wss://')) {
    return ensureWsPath(normalizedApi, '/ws');
  }

  const withoutApiSuffix = normalizedApi.endsWith('/api')
    ? normalizedApi.slice(0, -'/api'.length)
    : normalizedApi;
  return ensureWsPath(normalizeWebSocketUrl(withoutApiSuffix), '/ws');
}

export function getDefaultEnvironment(): Exclude<TnfDesktopEnvironment, 'custom'> {
  const raw = String(import.meta.env.VITE_DEFAULT_ENV || '')
    .trim()
    .toLowerCase();
  if (raw === 'local' || raw === 'production' || raw === 'sandbox') {
    return raw;
  }
  return 'sandbox';
}

export function resolveApiBaseUrl(): string {
  return String(import.meta.env.VITE_API_URL || SANDBOX_ENDPOINTS.api);
}

export function resolveWebSocketUrl(): string {
  const raw = String(import.meta.env.VITE_WS_URL || import.meta.env.VITE_RELAY_URL || '');
  if (!raw) {
    return SANDBOX_ENDPOINTS.ws;
  }
  return ensureWsPath(normalizeWebSocketUrl(raw), '/ws');
}

export function resolveRelayUrl(): string {
  return resolveWebSocketUrl();
}

export function resolveEnvironmentEndpoints(
  environment: TnfDesktopEnvironment,
  customApiUrl = ''
): EndpointSet {
  if (environment === 'custom') {
    const api = String(customApiUrl || '').trim() || SANDBOX_ENDPOINTS.api;
    const ws = deriveWsUrlFromApi(api);
    return { api, ws, relay: LOCAL_ENDPOINTS.relay };
  }

  return ENV_ENDPOINTS[environment];
}

export function resolveRelayUrlForEnvironment(
  environment: TnfDesktopEnvironment,
  customApiUrl = ''
): string {
  return resolveEnvironmentEndpoints(environment, customApiUrl).relay;
}
