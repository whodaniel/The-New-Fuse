import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import RequireAuth from '../components/RequireAuth';
import { AUTH_TIMEOUT_MS } from '../services/authRequest';
import { getAccessToken, persistTokens } from '../services/authSession';
import { AuthProvider } from './useAuth';
vi.mock('../lib/supabase', () => ({ hasSupabaseConfig: false, supabase: null }));
vi.mock('../services/userSessionFactors', () => ({ bootstrapUserSessionFactors: vi.fn() }));
const mount = () =>
  render(
    <MemoryRouter initialEntries={['/timeline']}>
      <AuthProvider>
        <RequireAuth>
          <div>Verified workspace</div>
        </RequireAuth>
      </AuthProvider>
    </MemoryRouter>
  );
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.mocked(fetch).mockReset();
});
afterEach(() => vi.useRealTimers());
it.each([429, 500, 503])(
  'keeps the credential and blocks workspace for HTTP %s, then retries',
  async (status) => {
    persistTokens({ accessToken: 'saved' });
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status }));
    mount();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(getAccessToken()).toBe('saved');
    expect(screen.queryByText('Verified workspace')).not.toBeInTheDocument();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'u1', email: 'user@example.test' }))
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry connection' }));
    expect(await screen.findByText('Verified workspace')).toBeInTheDocument();
  }
);
it('exits bootstrap on timeout without removing the credential or mounting queries', async () => {
  vi.useFakeTimers();
  persistTokens({ accessToken: 'saved' });
  vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));
  mount();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTH_TIMEOUT_MS);
  });
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(getAccessToken()).toBe('saved');
  expect(screen.queryByText('Verified workspace')).not.toBeInTheDocument();
});
it('clears a confirmed rejected credential and preserves the destination', async () => {
  persistTokens({ accessToken: 'rejected' });
  vi.mocked(fetch)
    .mockResolvedValueOnce(new Response('{}', { status: 401 }))
    .mockResolvedValueOnce(new Response('{}', { status: 401 }));
  mount();
  await waitFor(() => expect(getAccessToken()).toBeNull());
  await waitFor(() => expect(sessionStorage.getItem('tnf.auth.next')).toBe('/timeline'));
});

it('recovers an expired access token through cookie refresh before redirecting', async () => {
  persistTokens({ accessToken: 'expired' });
  vi.mocked(fetch)
    .mockResolvedValueOnce(new Response('{}', { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'refreshed' })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'u1', email: 'user@example.test' })));
  mount();
  expect(await screen.findByText('Verified workspace')).toBeInTheDocument();
  expect(getAccessToken()).toBe('refreshed');
  expect(fetch).toHaveBeenCalledTimes(3);
});

it('falls back to valid JWT claims and renders workspace when /api/auth/me returns 503 (no local harness running)', async () => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: 'user-jwt-1',
      email: 'jwt@example.test',
      user_metadata: { full_name: 'JWT User' },
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  const jwt = `${header}.${payload}.sig`;
  persistTokens({ accessToken: jwt });
  vi.mocked(fetch).mockResolvedValueOnce(new Response('Service Unavailable', { status: 503 }));
  mount();
  expect(await screen.findByText('Verified workspace')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(getAccessToken()).toBe(jwt);
});

it('clears an expired JWT when /api/auth/me and /api/auth/refresh return 401/503 instead of trapping on 503 screen', async () => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: 'user-jwt-expired',
      email: 'expired@example.test',
      exp: Math.floor(Date.now() / 1000) - 3600,
    })
  );
  const expiredJwt = `${header}.${payload}.sig`;
  persistTokens({ accessToken: expiredJwt });
  vi.mocked(fetch)
    .mockResolvedValueOnce(new Response('Service Unavailable', { status: 503 }))
    .mockResolvedValueOnce(new Response('{}', { status: 401 }));
  mount();
  await waitFor(() => expect(getAccessToken()).toBeNull());
  expect(screen.queryByText('Unable to verify your session')).not.toBeInTheDocument();
});
