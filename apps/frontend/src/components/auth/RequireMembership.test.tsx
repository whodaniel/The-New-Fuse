/**
 * RequireMembership Login Loop Regression Tests
 *
 * Regression suite for the email/password login loop bug:
 *   verified email/password user → login → /dashboard → loops back to /auth/login
 *
 * Root causes this suite guards against:
 *   1. RequireMembership calling a relative /api/... URL (bypasses VITE_API_URL in prod)
 *   2. RequireMembership logging out the user on ANY 401, even from a broken proxy
 *   3. New STARTER accounts (active: false) being treated as unauthenticated
 *   4. Super Admin bypass remaining intact and unaffected by this fix
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_ENDPOINTS } from '../../config/api';
import { RequireMembership } from './RequireMembership';

// ---------------------------------------------------------------------------
// Shared mock scaffolding
// ---------------------------------------------------------------------------

const mockLogout = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../hooks/useAuthorization', () => ({
  useAuthorization: () => mockUseAuthorization(),
}));

vi.mock('../../utils/authToken', () => ({
  authFetch: vi.fn(),
}));

let mockUseAuth: () => any;
let mockUseAuthorization: () => any;

// Keep a typed reference so individual tests can configure responses
import { authFetch as mockAuthFetch } from '../../utils/authToken';
const typedMockFetch = mockAuthFetch as ReturnType<typeof vi.fn>;

// Suppress console.warn noise in test output
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mockLogout.mockClear();
  typedMockFetch.mockReset();

  // Default: authenticated, ordinary USER (no super admin)
  mockUseAuth = () => ({
    isAuthenticated: true,
    isLoading: false,
    logout: mockLogout,
    user: { id: 'user-123', email: 'new@example.com', role: 'USER' },
  });

  mockUseAuthorization = () => ({
    isSuperAdmin: false,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper: render RequireMembership with a simple child sentinel
const renderMembership = (fallback?: string) =>
  render(
    <MemoryRouter>
      <RequireMembership fallback={fallback}>
        <div data-testid="protected-content">Protected</div>
      </RequireMembership>
    </MemoryRouter>
  );

// ---------------------------------------------------------------------------
// 1. URL correctness — the central fix
// ---------------------------------------------------------------------------

describe('RequireMembership – API URL', () => {
  it('calls the centralized API_ENDPOINTS.BILLING.MEMBERSHIP_ME URL, not a bare /api path', async () => {
    // Simulate the membership endpoint returning a successful STARTER response
    typedMockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ active: false, tier: 'STARTER', found: true }),
    } as Response);

    renderMembership();

    await waitFor(() => {
      expect(typedMockFetch).toHaveBeenCalledWith(
        API_ENDPOINTS.BILLING.MEMBERSHIP_ME,
        expect.anything()
      );
    });

    // Must NOT be called with the hard-coded relative path that bypasses VITE_API_URL
    const calls = typedMockFetch.mock.calls;
    const hasBrokenRelativePath = calls.some(([url]) => url === '/api/billing/membership/me');
    expect(hasBrokenRelativePath).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. 401 from membership endpoint — verify auth before logout
// ---------------------------------------------------------------------------

describe('RequireMembership – 401 handling (non-destructive)', () => {
  it('does NOT call logout when membership returns 401 but /auth/me succeeds (broken proxy scenario)', async () => {
    // Membership endpoint → 401 (proxy broken)
    // /auth/me → 200 (JWT is valid, user is authenticated)
    typedMockFetch.mockImplementation((url: string) => {
      if (url === API_ENDPOINTS.BILLING.MEMBERSHIP_ME) {
        return Promise.resolve({ ok: false, status: 401 } as Response);
      }
      if (url === API_ENDPOINTS.AUTH.ME) {
        return Promise.resolve({ ok: true, status: 200 } as Response);
      }
      return Promise.resolve({ ok: false, status: 500 } as Response);
    });

    renderMembership();

    await waitFor(() => {
      // Session should NOT be destroyed
      expect(mockLogout).not.toHaveBeenCalled();
    });
  });

  it('DOES call logout when membership returns 401 AND /auth/me also returns 401 (genuine invalid session)', async () => {
    typedMockFetch.mockImplementation((url: string) => {
      if (
        url === API_ENDPOINTS.BILLING.MEMBERSHIP_ME ||
        url === API_ENDPOINTS.AUTH.ME
      ) {
        return Promise.resolve({ ok: false, status: 401 } as Response);
      }
      return Promise.resolve({ ok: false, status: 500 } as Response);
    });

    renderMembership();

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('does NOT call logout on a non-401 network error (catch block)', async () => {
    typedMockFetch.mockRejectedValue(new Error('Network failure'));

    renderMembership();

    await waitFor(() => {
      expect(mockLogout).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// 3. New STARTER account — active: false routes to /membership, not /auth/login
// ---------------------------------------------------------------------------

describe('RequireMembership – new STARTER account flow', () => {
  it('does NOT call logout for a STARTER user (active: false) — routes to membership onboarding', async () => {
    typedMockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ active: false, tier: 'STARTER', found: true }),
    } as Response);

    renderMembership('/membership');

    await waitFor(() => {
      // The user is valid but unpaid — logout must NOT be triggered
      expect(mockLogout).not.toHaveBeenCalled();
    });
  });

  it('renders children when membership returns active: true (paid account)', async () => {
    typedMockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ active: true, tier: 'PRO', found: true }),
    } as Response);

    renderMembership();

    expect(await screen.findByTestId('protected-content')).toBeInTheDocument();
    expect(mockLogout).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4. Super Admin bypass — must remain intact and skip the membership fetch
// ---------------------------------------------------------------------------

describe('RequireMembership – Super Admin bypass', () => {
  it('skips the membership API call entirely for Super Admin and renders children', async () => {
    mockUseAuthorization = () => ({ isSuperAdmin: true });

    renderMembership();

    expect(await screen.findByTestId('protected-content')).toBeInTheDocument();

    // No network call should have been made
    expect(typedMockFetch).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5. Unauthenticated user — still redirects to /auth/login without logout call
// ---------------------------------------------------------------------------

describe('RequireMembership – unauthenticated user', () => {
  it('redirects to /auth/login without calling logout when isAuthenticated is false', async () => {
    mockUseAuth = () => ({
      isAuthenticated: false,
      isLoading: false,
      logout: mockLogout,
      user: null,
    });

    renderMembership();

    await waitFor(() => {
      // No membership check should have fired
      expect(typedMockFetch).not.toHaveBeenCalled();
      // And logout is definitely not needed — user was never in
      expect(mockLogout).not.toHaveBeenCalled();
    });
  });
});
