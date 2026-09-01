import { afterEach, describe, expect, it, vi } from 'vitest';
import { authFetch } from '@/utils/authToken';
import { fetchFirstJson } from './fetchFirstJson';

vi.mock('@/utils/authToken', () => ({
  authFetch: vi.fn(),
}));

const mockedAuthFetch = vi.mocked(authFetch);

const response = (
  body: string,
  options: { status?: number; contentType?: string | null } = {}
): Response => {
  const headers = new Headers();
  if (options.contentType !== null) {
    headers.set('content-type', options.contentType ?? 'application/json');
  }

  // Construct from encoded bytes, not a string: WHATWG/undici auto-stamps
  // `Content-Type: text/plain;charset=UTF-8` on string bodies, which would make
  // a "no content-type" response impossible to express. Byte bodies leave the
  // header exactly as this helper intends it. Observable behavior (status,
  // headers that are set, json()) is unchanged for every other case.
  return new Response(new TextEncoder().encode(body), {
    status: options.status ?? 200,
    headers,
  });
};

afterEach(() => {
  mockedAuthFetch.mockReset();
});

describe('fetchFirstJson', () => {
  it('returns the first successful JSON response', async () => {
    mockedAuthFetch.mockResolvedValueOnce(response('{"agents":[{"id":"a1"}]}'));

    await expect(fetchFirstJson(['/api/agents', '/agents'])).resolves.toEqual({
      data: { agents: [{ id: 'a1' }] },
      source: '/api/agents',
      usedAlternate: false,
    });
    expect(mockedAuthFetch).toHaveBeenCalledTimes(1);
  });

  it('continues to the next alias after a non-success status', async () => {
    mockedAuthFetch
      .mockResolvedValueOnce(response('{"error":"missing"}', { status: 404 }))
      .mockResolvedValueOnce(response('{"status":"ok"}'));

    await expect(fetchFirstJson(['/api/orchestrator/health', '/orchestrator/health'])).resolves.toEqual({
      data: { status: 'ok' },
      source: '/orchestrator/health',
      usedAlternate: true,
    });
  });

  it('does not treat an HTTP 200 SPA HTML fallback as JSON success', async () => {
    mockedAuthFetch
      .mockResolvedValueOnce(
        response('<!doctype html><html><body>SPA fallback</body></html>', {
          contentType: 'text/html; charset=utf-8',
        })
      )
      .mockResolvedValueOnce(response('{"agents":[{"id":"live-agent"}]}'));

    await expect(fetchFirstJson(['/orchestrator/agents', '/api/orchestrator/agents'])).resolves.toEqual({
      data: { agents: [{ id: 'live-agent' }] },
      source: '/api/orchestrator/agents',
      usedAlternate: true,
    });
    expect(mockedAuthFetch).toHaveBeenCalledTimes(2);
  });

  it('continues after malformed JSON even when the response advertises JSON', async () => {
    mockedAuthFetch
      .mockResolvedValueOnce(response('{not-json', { contentType: 'application/json' }))
      .mockResolvedValueOnce(response('{"value":42}', { contentType: 'application/problem+json' }));

    await expect(fetchFirstJson(['/broken', '/fallback'])).resolves.toEqual({
      data: { value: 42 },
      source: '/fallback',
      usedAlternate: true,
    });
  });

  it('still accepts parseable JSON when a response omits content-type', async () => {
    mockedAuthFetch.mockResolvedValueOnce(response('{"value":"legacy"}', { contentType: null }));

    await expect(fetchFirstJson(['/legacy-json'])).resolves.toEqual({
      data: { value: 'legacy' },
      source: '/legacy-json',
      usedAlternate: false,
    });
  });

  it('returns null when every alias fails JSON validation', async () => {
    mockedAuthFetch
      .mockResolvedValueOnce(response('<html>nope</html>', { contentType: 'text/html' }))
      .mockResolvedValueOnce(response('still-not-json', { contentType: 'application/json' }));

    await expect(fetchFirstJson(['/first', '/second'])).resolves.toBeNull();
  });
});
