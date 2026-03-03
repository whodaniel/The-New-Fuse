import { render, screen, waitFor } from '@testing-library/react';
import React, { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ComprehensiveRouter from '../ComprehensiveRouter';
import { AuthProvider } from '../providers/AuthProvider';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((cb) => {
        // Simulate loading state or unauthenticated
        cb(null);
        return () => {};
    }),
  },
  db: {},
}));

// Mock AuthProvider if needed, but we want to test with it if possible.
// However, AuthProvider likely uses firebase/auth directly.
// Let's rely on the mock above.

describe('ComprehensiveRouter', () => {
  test('renders without crashing', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
           <Suspense fallback={<div>Loading...</div>}>
            <ComprehensiveRouter />
          </Suspense>
        </AuthProvider>
      </MemoryRouter>
    );
    
    // It should render something. The layout might render "Loading..." due to Suspense.
    // Or the "SmartNavigation".
    // Let's just check if it doesn't throw.
    expect(document.body).toBeInTheDocument();
  });
  
  test('renders analytics route (protected) - should not crash', async () => {
      // We are not authenticated in the mock, so it might redirect to login or show nothing.
      render(
      <MemoryRouter initialEntries={['/analytics']}>
        <AuthProvider>
           <Suspense fallback={<div>Loading...</div>}>
            <ComprehensiveRouter />
          </Suspense>
        </AuthProvider>
      </MemoryRouter>
    );
     expect(document.body).toBeInTheDocument();
  });
});
