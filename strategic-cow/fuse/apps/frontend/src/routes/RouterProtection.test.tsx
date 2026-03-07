import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import ComprehensiveRouter from '../ComprehensiveRouter';

// Mock hooks
const mockUseAuth = vi.fn();
const mockUseAuthorization = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../hooks/useAuthorization', () => ({
  useAuthorization: () => mockUseAuthorization(),
}));

// Mock specific pages to verify if they are rendered
vi.mock('@/pages/auth/Login', () => ({ default: () => <div data-testid="login-page">Login Page</div> }));
vi.mock('@/pages/auth/Register', () => ({ default: () => <div>Register Page</div> }));
vi.mock('@/pages/Unauthorized', () => ({ default: () => <div data-testid="unauthorized-page">Unauthorized Page</div> }));
vi.mock('@/pages/AllPages', () => ({ default: () => <div>All Pages</div> }));
vi.mock('@/pages/BuildInfo', () => ({ default: () => <div>Build Info</div> }));
vi.mock('@/pages/Debug', () => ({ default: () => <div>Debug</div> }));
vi.mock('@/pages/DebugRouting', () => ({ default: () => <div>Debug Routing</div> }));
vi.mock('@/pages/Test', () => ({ default: () => <div>Test</div> }));
vi.mock('@/components/Dashboard', () => ({ Dashboard: () => <div data-testid="page-dashboard">Dashboard</div> }));
vi.mock('@/pages/workspace/Settings', () => ({ default: () => <div data-testid="page-workspace-settings">Workspace Settings</div> }));
vi.mock('@/pages/workflow-pages/Builder', () => ({ default: () => <div data-testid="page-workflow-builder">Workflow Builder</div> }));
vi.mock('@/pages/Agents/UnifiedAgentCreator', () => ({ default: () => <div data-testid="page-agent-creator">Agent Creator</div> }));
vi.mock('@/pages/Tasks/New', () => ({ default: () => <div data-testid="page-task-new">New Task</div> }));
vi.mock('@/pages/settings/API', () => ({ default: () => <div data-testid="page-settings-api">Settings API</div> }));
vi.mock('@/pages/Admin/Agents/skills', () => ({ default: () => <div data-testid="page-admin-skills">Admin Skills</div> }));

// Mock legacy redirects
vi.mock('../config/legacyRedirects', () => ({
  LEGACY_REDIRECTS: [],
}));

// Mock Lazy components that we don't care about specifically but need to render to avoid errors
vi.mock('../layouts/PremiumLayout', () => ({ default: ({ children }: any) => <div data-testid="premium-layout">{children}</div> }));
vi.mock('../layouts/PublicLayout', () => ({ default: ({ children }: any) => <div data-testid="public-layout">{children}</div> }));
vi.mock('../components/SmartNavigation', () => ({ default: () => <div data-testid="smart-nav">Smart Nav</div> }));


describe('Router Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (path: string, isAuthenticated = false, roles: string[] = []) => {
    mockUseAuth.mockReturnValue({
      isAuthenticated,
      isLoading: false,
      user: isAuthenticated ? { id: '1', role: roles[0] || 'USER' } : null,
    });

    mockUseAuthorization.mockReturnValue({
      hasRole: (requiredRoles: string[]) => {
          if (!isAuthenticated) return false;
          if (roles.includes('SUPER_ADMIN')) return true;
          return requiredRoles.some(r => roles.includes(r));
      },
      canAccess: () => true,
    });

    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
           {/* Add explicit login route to catch redirects if they happen */}
            <Route path="/auth/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/unauthorized" element={<div data-testid="unauthorized-page">Unauthorized Page</div>} />
            <Route path="*" element={<ComprehensiveRouter />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('Dashboard: DOES NOT render for unauthenticated user', async () => {
    setup('/dashboard', false);
    // Should NOT find dashboard page.
    // We expect a redirect or just not rendering.
    // If it renders, then protection failed.
    await expect(screen.findByTestId('page-dashboard', {}, { timeout: 500 })).rejects.toThrow();
  });

  it('Dashboard: Renders for authenticated user', async () => {
    setup('/dashboard', true, ['USER']);
    expect(await screen.findByTestId('page-dashboard')).toBeInTheDocument();
  });

  // Suspected unprotected routes - We verify that they ARE accessible unauthenticated (failing security)
  // or verifying that they SHOULD be protected.

  it('Workspace Settings: Protected check', async () => {
     setup('/workspace/settings', false);
     // If this passes (finds element), it means route is unprotected!
     // We expect this to FAIL if the route was properly protected.
     // So validation: If we find it, it's a security hole.
     const isUnprotected = await screen.findByTestId('page-workspace-settings', {}, { timeout: 500 })
        .then(() => true)
        .catch(() => false);

     if (isUnprotected) {
         throw new Error('SECURITY FAIL: /workspace/settings is accessible without auth');
     }
  });

  it('Workflow Builder: Protected check', async () => {
     setup('/workflows/builder', false);
     const isUnprotected = await screen.findByTestId('page-workflow-builder', {}, { timeout: 500 })
        .then(() => true)
        .catch(() => false);

     if (isUnprotected) {
         throw new Error('SECURITY FAIL: /workflows/builder is accessible without auth');
     }
  });

  it('Agent Creator: Protected check', async () => {
     setup('/agents/new', false);
     const isUnprotected = await screen.findByTestId('page-agent-creator', {}, { timeout: 500 })
        .then(() => true)
        .catch(() => false);

     if (isUnprotected) {
         throw new Error('SECURITY FAIL: /agents/new is accessible without auth');
     }
  });

  it('New Task: Protected check', async () => {
     setup('/tasks/new', false);
     const isUnprotected = await screen.findByTestId('page-task-new', {}, { timeout: 500 })
        .then(() => true)
        .catch(() => false);

     if (isUnprotected) {
         throw new Error('SECURITY FAIL: /tasks/new is accessible without auth');
     }
  });

  it('Settings API: Protected check', async () => {
     setup('/settings/api', false);
     const isUnprotected = await screen.findByTestId('page-settings-api', {}, { timeout: 500 })
        .then(() => true)
        .catch(() => false);

     if (isUnprotected) {
         throw new Error('SECURITY FAIL: /settings/api is accessible without auth');
     }
  });

  it('Admin Skills: Protected check (USER role)', async () => {
    setup('/admin/agents/skills', true, ['USER']);
    const isUnprotected = await screen.findByTestId('page-admin-skills', {}, { timeout: 500 })
        .then(() => true)
        .catch(() => false);

     if (isUnprotected) {
         throw new Error('SECURITY FAIL: /admin/agents/skills is accessible by USER');
     }
  });
});
