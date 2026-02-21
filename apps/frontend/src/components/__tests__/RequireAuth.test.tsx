import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, MockedFunction } from 'vitest';
import { RequireAuth } from '../RequireAuth';
import { useAuth } from '../../hooks/useAuth';

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as MockedFunction<typeof useAuth>;

const TestComponent = () => <div>Protected Content</div>;
const Login = () => {
  const location = useLocation();
  return <div data-testid="login-page">Login Page (From: {location.state?.from?.pathname})</div>;
};

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@example.com', name: 'Test', role: 'user' } as any,
      login: vi.fn(),
      register: vi.fn(),
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      error: null,
    } as any);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <TestComponent />
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login with state when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      error: null,
    } as any);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <TestComponent />
              </RequireAuth>
            }
          />
          <Route path="/auth/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    expect(screen.getByText('Login Page (From: /protected)')).toBeInTheDocument();
  });

  it('shows loading state when loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      error: null,
    } as any);

    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <RequireAuth>
                <TestComponent />
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Check for spinner (implementation detail: it has animate-spin class)
    expect(container.getElementsByClassName('animate-spin').length).toBe(1);
  });
});
