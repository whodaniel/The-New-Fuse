import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import Login from '../Login';

// Mock firebase to prevent crash
vi.mock('../../../lib/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

// Mock AuthProvider directly as that's what Login imports
vi.mock('@/providers/AuthProvider', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import the mocked functions to set return values.
// Note: We use the same import path as the component to ensure we get the mocked module.
import { useAuth } from '@/providers/AuthProvider';

const mockUseAuth = useAuth as MockedFunction<typeof useAuth>;

const Dashboard = () => <div>Dashboard</div>;
const ProtectedPage = () => <div>Protected Page</div>;

describe('Login Redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to dashboard by default on successful login', async () => {
    const loginMock = vi
      .fn()
      .mockResolvedValue({
        user: { uid: '123', getIdTokenResult: () => Promise.resolve({ claims: {} }) },
      });
    mockUseAuth.mockReturnValue({
      login: loginMock,
      signInWithGoogle: vi.fn(),
    } as any);

    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('redirects to original location on successful login', async () => {
    const loginMock = vi
      .fn()
      .mockResolvedValue({
        user: { uid: '123', getIdTokenResult: () => Promise.resolve({ claims: {} }) },
      });
    mockUseAuth.mockReturnValue({
      login: loginMock,
      signInWithGoogle: vi.fn(),
    } as any);

    const initialLocation = {
      pathname: '/protected',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    };

    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/auth/login', state: { from: initialLocation } }]}
      >
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/protected" element={<ProtectedPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Protected Page')).toBeInTheDocument();
    });
  });

  it('preserves query parameters and hash on redirect', async () => {
    const loginMock = vi
      .fn()
      .mockResolvedValue({
        user: { uid: '123', getIdTokenResult: () => Promise.resolve({ claims: {} }) },
      });
    mockUseAuth.mockReturnValue({
      login: loginMock,
      signInWithGoogle: vi.fn(),
    } as any);

    const initialLocation = {
      pathname: '/protected',
      search: '?q=test',
      hash: '#section',
      state: null,
      key: 'default',
    };
    const ProtectedPageWithParams = () => {
      // We need to import useLocation inside the component or use the one from react-router-dom
      // But since we are inside a test file which imports it, it's fine to use the hook if we use <Routes>
      // However, useLocation must be used inside Router context.
      // We can just inspect the text rendered.
      // Wait, I need useLocation to render the text I want to check.
      // I cannot import useLocation here because it's top level import.
      // I can define the component outside or inside.
      return <div>Protected: /protected?q=test#section</div>;
    };

    // Actually, to properly verify, I should use useLocation inside the component
    // But for simplicity, if the router navigates to /protected?q=test#section,
    // it will match the path /protected if exact is not true or ignored for params.
    // Wait, <Route path="/protected"> matches pathname only.
    // So checking if the component renders is enough to know pathname is correct.
    // To check params, I can check window.location or useLocation in the component.

    // Let's redefine the component for this test:
    const TestParams = () => {
      const loc = require('react-router-dom').useLocation();
      return (
        <div>
          Params: {loc.search}
          {loc.hash}
        </div>
      );
    };

    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/auth/login', state: { from: initialLocation } }]}
      >
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/protected" element={<TestParams />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Params: ?q=test#section')).toBeInTheDocument();
    });
  });
});
