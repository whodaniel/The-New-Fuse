import { render, screen, waitFor } from '@testing-library/react';
import React, { Suspense } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ComprehensiveRouter from '../ComprehensiveRouter';
import { AuthProvider } from '../hooks/useAuth';
import * as firebaseAuth from 'firebase/auth';

// Mock firebase/auth correctly
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    GoogleAuthProvider: vi.fn(),
  };
});

// Mock the local firebase lib
vi.mock('../lib/firebase', () => ({
  auth: {},
  db: {},
  googleProvider: {},
  signInWithPopup: vi.fn(),
}));

// Helper component to display current location
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
};

describe('Route Protection and Redirection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default behavior: user is NOT authenticated
    vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((auth, callback) => {
      // Simulate unauthenticated state immediately
      // @ts-ignore
      callback(null); 
      // return unsubscribe function
      return () => {};
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('redirects unauthenticated user from /analytics to /auth/login', async () => {
    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <ComprehensiveRouter />
            {/* Note: ComprehensiveRouter renders Routes, so LocationDisplay outside might not show correct path if router logic uses internal navigation 
                that MemoryRouter doesn't reflect? No, MemoryRouter holds the history state. 
                However, ComprehensiveRouter might use a different Router? No, it uses Routes, so it must be inside a Router.
                We wrap it in MemoryRouter here.
            */}
             <LocationDisplay />
          </Suspense>
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial render might show loading or the protected route briefly
    // Wait for redirection to /auth/login
    await waitFor(() => {
      // Check location
      expect(screen.getByTestId('location-display')).toHaveTextContent('/auth/login');
    });
  });
});
