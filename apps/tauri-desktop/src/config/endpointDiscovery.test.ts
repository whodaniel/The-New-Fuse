import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearDiscoveryCache,
  discoverLocalEndpoints,
  isRelayHealthPayload,
  probeRestApiUrl,
} from './endpointDiscovery';

describe('endpointDiscovery', () => {
  afterEach(() => {
    clearDiscoveryCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('recognizes relay health payloads', () => {
    expect(isRelayHealthPayload({ status: 'ok', relay: 'running', agents: 0 })).toBe(true);
    expect(isRelayHealthPayload({ status: 'ok', agents: 2, channels: 1 })).toBe(true);
  });

  it('rejects generic websocket gateway health', () => {
    expect(isRelayHealthPayload({ status: 'ok', connectedClients: 0 })).toBe(false);
  });

  it('rejects malformed payloads', () => {
    expect(isRelayHealthPayload(null)).toBe(false);
    expect(isRelayHealthPayload({ status: 'error' })).toBe(false);
  });

  it('probes REST API via health paths ahead of /api/agents', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      // Prefer exact bare /health — avoid `/api/v1/health`.endsWith('/health') false positive.
      if (url === 'http://127.0.0.1:3001/health') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(probeRestApiUrl('http://127.0.0.1:3001')).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3001/health',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/api/agents'))).toBe(false);
  });

  it('rejects relay-shaped health on API candidate ports', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ status: 'ok', relay: 'running' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
      )
    );
    await expect(probeRestApiUrl('http://127.0.0.1:3001')).resolves.toBe(false);
  });

  it('rejects websocket-gateway health shaped payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ status: 'ok', connectedClients: 3 }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
      )
    );
    await expect(probeRestApiUrl('http://127.0.0.1:3001')).resolves.toBe(false);
  });

  it('prefers /api/v1/health before other candidates', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/v1/health')) {
        return new Response(JSON.stringify({ status: 'healthy', service: 'tnf-api' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw new Error(`unexpected probe ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(probeRestApiUrl('http://127.0.0.1:3001')).resolves.toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://127.0.0.1:3001/api/v1/health');
  });

  it('accepts auth-walled /api/agents capability when health is absent', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/health')) return new Response('missing', { status: 404 });
      if (url.includes('/api/agents') && init?.method === 'HEAD') {
        return new Response(null, { status: 401 });
      }
      return new Response('nope', { status: 500 });
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(probeRestApiUrl('http://127.0.0.1:3001')).resolves.toBe(true);
  });

  it('caches discoverLocalEndpoints within TTL', async () => {
    const fetchMock = vi.fn(async () => new Response('fail', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    const first = await discoverLocalEndpoints();
    const second = await discoverLocalEndpoints();
    expect(second).toEqual(first);
    // First discovery probes relays + APIs; second hit must use cache (no extra traffic).
    const callsAfterFirst = fetchMock.mock.calls.length;
    await discoverLocalEndpoints();
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });
});
