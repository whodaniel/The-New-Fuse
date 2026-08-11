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
      if (url.endsWith('/health')) {
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
