// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RequireAuth from '../components/RequireAuth';
import RequirePermission from '../components/auth/RequirePermission';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useAuthorization hook so RequirePermission uses our mocked logic
const mockUseAuthorization = {
  hasRole: vi.fn(),
  canAccess: vi.fn(),
};
vi.mock('../hooks/useAuthorization', () => ({
  useAuthorization: () => mockUseAuthorization,
}));

// Mock simple components
const ProtectedComponent = () => <div>Protected Content</div>;
const PublicComponent = () => <div>Public Content</div>;
const LoginComponent = () => <div>Login Page</div>;
const UnauthorizedComponent = () => <div>Unauthorized Page</div>;

describe('Navigation Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RequireAuth', () => {
    it('redirects to login when unauthenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/auth/login" element={<LoginComponent />} />
            <Route
              path="/protected"
              element={
                <RequireAuth>
                  <ProtectedComponent />
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', email: 'test@example.com' },
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <RequireAuth>
                  <ProtectedComponent />
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders loading state when loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false, // Doesn't matter if true or false while loading
        isLoading: true,
        user: null,
      });

      const { container } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <RequireAuth>
                  <ProtectedComponent />
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Check for spinner or loading indicator
      // The implementation uses a div with 'animate-spin' class
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects to custom path when provided', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/custom-login" element={<div>Custom Login</div>} />
            <Route
              path="/protected"
              element={
                <RequireAuth redirectTo="/custom-login">
                  <ProtectedComponent />
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Custom Login')).toBeInTheDocument();
    });
  });

  describe('RequirePermission', () => {
    it('redirects to unauthorized when user lacks role', () => {
      mockUseAuthorization.hasRole.mockReturnValue(false);
      mockUseAuthorization.canAccess.mockReturnValue(false);

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/unauthorized" element={<UnauthorizedComponent />} />
            <Route
              path="/admin"
              element={
                <RequirePermission roles={['ADMIN']}>
                  <ProtectedComponent />
                </RequirePermission>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(mockUseAuthorization.hasRole).toHaveBeenCalledWith(['ADMIN']);
    });

    it('renders children when user has role', () => {
      mockUseAuthorization.hasRole.mockReturnValue(true);

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <RequirePermission roles={['ADMIN']}>
                  <ProtectedComponent />
                </RequirePermission>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockUseAuthorization.hasRole).toHaveBeenCalledWith(['ADMIN']);
    });

    it('handles requireAll prop correctly (mocked hasRole call)', () => {
      // Setup mock to return true only if 'ADMIN' is checked
      mockUseAuthorization.hasRole.mockImplementation((roles) => {
        // simplified logic for test
        return roles.includes('ADMIN');
      });

      // requireAll=true calls hasRole for EACH role individually
      // So if roles=['ADMIN', 'SUPER_ADMIN'], it calls hasRole(['ADMIN']) and hasRole(['SUPER_ADMIN'])

      // We want to test that it fails if one is missing.
      // Let's say user has 'ADMIN' but not 'SUPER_ADMIN'.
      mockUseAuthorization.hasRole.mockImplementation((roleArg) => {
        return roleArg[0] === 'ADMIN'; // User only has ADMIN
      });

      render(
        <MemoryRouter initialEntries={['/super-protected']}>
          <Routes>
            <Route path="/unauthorized" element={<UnauthorizedComponent />} />
            <Route
              path="/super-protected"
              element={
                <RequirePermission roles={['ADMIN', 'SUPER_ADMIN']} requireAll={true}>
                  <ProtectedComponent />
                </RequirePermission>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect because user lacks SUPER_ADMIN
      expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();

      // Verify calls
      expect(mockUseAuthorization.hasRole).toHaveBeenCalledWith(['ADMIN']);
      expect(mockUseAuthorization.hasRole).toHaveBeenCalledWith(['SUPER_ADMIN']);
    });

    it('redirects to custom fallback', () => {
      mockUseAuthorization.hasRole.mockReturnValue(false);

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/custom-unauthorized" element={<div>Custom Unauthorized</div>} />
            <Route
              path="/admin"
              element={
                <RequirePermission roles={['ADMIN']} fallback="/custom-unauthorized">
                  <ProtectedComponent />
                </RequirePermission>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Custom Unauthorized')).toBeInTheDocument();
    });

    it('redirects when permissions check fails', () => {
      mockUseAuthorization.canAccess.mockReturnValue(false);

      const permissions = { resource: 'users', action: 'write' as const };

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/unauthorized" element={<UnauthorizedComponent />} />
            <Route
              path="/admin"
              element={
                <RequirePermission permissions={permissions}>
                  <ProtectedComponent />
                </RequirePermission>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
      expect(mockUseAuthorization.canAccess).toHaveBeenCalledWith(permissions);
    });

    it('renders when permissions check passes', () => {
      mockUseAuthorization.canAccess.mockReturnValue(true);

      const permissions = { resource: 'users', action: 'write' as const };

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <RequirePermission permissions={permissions}>
                  <ProtectedComponent />
                </RequirePermission>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockUseAuthorization.canAccess).toHaveBeenCalledWith(permissions);
    });
  });
});
