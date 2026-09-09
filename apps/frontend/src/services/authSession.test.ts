import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_TIMEOUT_MS, AuthTransientError, authRequest } from './authRequest';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  persistTokens,
  silentRefreshAccessToken,
  validateAuthSession,
} from './authSession';
vi.mock('@/lib/supabase', () => ({ hasSupabaseConfig: false, supabase: null }));
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearTokens();
  vi.mocked(fetch).mockReset();
});
afterEach(() => {
  vi.useRealTimers();
});
describe('session recovery', () => {
  it('shares refresh and supports an HttpOnly cookie without a stored refresh token', async () => {
    vi.mocked(fetch).mockResolvedValue(json({ data: { accessToken: 'fresh' } }));
    expect(await Promise.all([silentRefreshAccessToken(), silentRefreshAccessToken()])).toEqual([
      'fresh',
      'fresh',
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ credentials: 'include', body: '{}' });
  });
  it.each([403, 429, 500, 503])('keeps credentials after refresh HTTP %s', async (status) => {
    persistTokens({ accessToken: 'saved', refreshToken: 'refresh' });
    vi.mocked(fetch).mockResolvedValue(json({}, status));
    await expect(silentRefreshAccessToken()).rejects.toBeInstanceOf(AuthTransientError);
    expect(getAccessToken()).toBe('saved');
    expect(getRefreshToken()).toBe('refresh');
  });
  it('keeps credentials on network errors and malformed success', async () => {
    persistTokens({ accessToken: 'saved' });
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(json({ accessToken: {} }));
    await expect(silentRefreshAccessToken()).rejects.toBeInstanceOf(AuthTransientError);
    await expect(silentRefreshAccessToken()).rejects.toBeInstanceOf(AuthTransientError);
    expect(getAccessToken()).toBe('saved');
  });
  it('settles waiters, releases the flight, and ignores late credentials after timeout', async () => {
    vi.useFakeTimers();
    persistTokens({ accessToken: 'saved' });
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const waiting = Promise.allSettled([silentRefreshAccessToken(), silentRefreshAccessToken()]);
    await vi.advanceTimersByTimeAsync(AUTH_TIMEOUT_MS);
    expect((await waiting).every((result) => result.status === 'rejected')).toBe(true);
    finish(json({ accessToken: 'late' }));
    await vi.advanceTimersByTimeAsync(0);
    expect(getAccessToken()).toBe('saved');
    vi.mocked(fetch).mockResolvedValueOnce(json({ accessToken: 'recovered' }));
    await expect(silentRefreshAccessToken()).resolves.toBe('recovered');
  });
  it('bounds response body reads', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValue(new Response(new ReadableStream({ start() {} })));
    const result = Promise.allSettled([authRequest('/api/auth/me')]);
    await vi.advanceTimersByTimeAsync(AUTH_TIMEOUT_MS);
    expect((await result)[0].status).toBe('rejected');
  });
  it('does not send an access token as a refresh credential', async () => {
    persistTokens({ accessToken: 'same', refreshToken: 'same' });
    vi.mocked(fetch).mockResolvedValue(json({}, 401));
    await expect(silentRefreshAccessToken()).resolves.toBeNull();
    expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBe('{}');
  });
  it('stops after one refresh when the new token is rejected', async () => {
    persistTokens({ accessToken: 'old' });
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ accessToken: 'fresh' }))
      .mockResolvedValueOnce(json({}, 401));
    expect((await validateAuthSession()).state).toBe('expired');
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('reports unavailable refresh as offline instead of expired', async () => {
    persistTokens({ accessToken: 'saved' });
    vi.mocked(fetch).mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json({}, 503));
    expect((await validateAuthSession()).state).toBe('offline');
    expect(getAccessToken()).toBe('saved');
  });
});
