import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AUTH_TIMEOUT_MS, AuthTransientError } from './authRequest';
import {
  getAccessToken,
  getAuthTokenCandidates,
  persistTokens,
  silentRefreshAccessToken,
} from './authSession';
const provider = vi.hoisted(() => ({ refreshSession: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ hasSupabaseConfig: true, supabase: { auth: provider } }));
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.mocked(fetch).mockReset();
  provider.refreshSession.mockReset();
  persistTokens({ accessToken: 'tnf-saved' });
  provider.refreshSession.mockResolvedValue({
    data: { session: { access_token: 'provider-only' } },
    error: null,
  });
});
afterEach(() => vi.useRealTimers());
it('never adopts the Supabase credential when the backend exchange fails', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json({}, 503));
  await expect(silentRefreshAccessToken()).rejects.toBeInstanceOf(AuthTransientError);
  expect(getAccessToken()).toBe('tnf-saved');
  expect(await getAuthTokenCandidates()).toEqual(['tnf-saved']);
});
it('adopts only the backend-exchanged token', async () => {
  vi.mocked(fetch)
    .mockResolvedValueOnce(json({}, 401))
    .mockResolvedValueOnce(json({ data: { accessToken: 'tnf-fresh' } }));
  await expect(silentRefreshAccessToken()).resolves.toBe('tnf-fresh');
  expect(getAccessToken()).toBe('tnf-fresh');
});
it('bounds a stuck provider and prevents a late exchange from starting', async () => {
  vi.useFakeTimers();
  let finish!: (data: unknown) => void;
  provider.refreshSession.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  vi.mocked(fetch).mockResolvedValueOnce(json({}, 401));
  const result = Promise.allSettled([silentRefreshAccessToken()]);
  await vi.advanceTimersByTimeAsync(AUTH_TIMEOUT_MS);
  expect((await result)[0].status).toBe('rejected');
  finish({ data: { session: { access_token: 'late-provider' } }, error: null });
  await vi.advanceTimersByTimeAsync(0);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(getAccessToken()).toBe('tnf-saved');
});
