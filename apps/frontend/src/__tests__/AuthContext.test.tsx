/* global describe, beforeEach, it, expect, localStorage, screen */
import '@testing-library/jest-dom/extend-expect';

import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext.js';
import { auth } from '../lib/firebase.js';
import { User } from 'firebase/auth';
import { vi } from 'vitest';

// Mock Firebase auth
vi.mock('../lib/firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    currentUser: null
  }
}));

// Mock component to test useAuth hook
const TestComponent = () => {
  const { isAuthenticated, token, user, isInitialized } = useAuth();
  if (!isInitialized) {
    return <div role="status" className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>;
  }
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="token">{token || 'no-token'}</div>
      <div data-testid="user">{user ? 'user-exists' : 'no-user'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with not authenticated state', async () => {
    const mockAuthStateChanged = vi.fn((callback) => {
      act(() => {
        callback(null);
      });
      return () => {};
    });
    (auth.onAuthStateChanged as any) = mockAuthStateChanged;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    })
  });

  it('should update state when user authenticates', async () => {
    const mockUser = { getIdToken: () => Promise.resolve('test-token') } as User;
    const mockAuthStateChanged = vi.fn((callback) => {
      act(() => {
        callback(mockUser);
      });
      return () => {};
    });

    (auth.onAuthStateChanged as any) = mockAuthStateChanged;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('token')).toHaveTextContent('test-token');
      expect(screen.getByTestId('user')).toHaveTextContent('user-exists');
    });

    expect(localStorage.getItem('auth_token')).toBe('test-token');
  });

  it('should handle user logout', async () => {
    const mockAuthStateChanged = vi.fn((callback) => {
      act(() => {
        callback(null);
      });
      return () => {};
    });

    (auth.onAuthStateChanged as any) = mockAuthStateChanged;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('should show loading state before initialization', async () => {
    let authCallback: ((user: User | null) => void) | null = null;
    const mockAuthStateChanged = vi.fn((callback) => {
      authCallback = callback;
      return () => {};
    });
    (auth.onAuthStateChanged as any) = mockAuthStateChanged;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Verify that loading state is removed after initialization
    if (authCallback) {
      act(() => {
        authCallback(null);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    }
  });

  it('should cleanup auth listener on unmount', () => {
    const unsubscribe = vi.fn();
    const mockAuthStateChanged = vi.fn(() => unsubscribe);
    (auth.onAuthStateChanged as any) = mockAuthStateChanged;

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});