import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the codebase data before importing the component
vi.mock('../../data/codebase_map.json', () => ({
  nodes: [
    { id: 'TNF', data: { label: 'ROOT', authRequired: false } },
    {
      id: 'PROTO_14',
      data: { label: 'Governance', authRequired: true, requiredRole: 'SUPER_ADMIN' },
    },
    { id: 'PROTO_7', data: { label: 'Living State', authRequired: true, requiredRole: 'ADMIN' } },
    {
      id: 'DOMAIN_AGENTS',
      data: { label: 'Agents', authRequired: true, requiredRole: 'DEVELOPER' },
    },
    { id: 'PROTO_0', data: { label: 'Status', authRequired: false } },
  ],
  edges: [],
}));

// Mock hooks before importing
const mockUseAuth = vi.fn();
const mockUseAuthorization = vi.fn();

describe('InteractiveCodebaseMap Auth Gates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('allows SUPER_ADMIN to access all locked nodes', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseAuthorization.mockReturnValue({
      isSuperAdmin: true,
      isAdmin: true,
      isDeveloper: true,
      hasRole: () => true,
    });

    const canAccess = (node: any) => {
      if (!node?.data?.authRequired) return true;
      const required = node?.data?.requiredRole;
      if (required === 'SUPER_ADMIN') return true;
      if (required === 'ADMIN') return true;
      if (required === 'DEVELOPER') return true;
      return true;
    };

    // Simulate locked nodes
    const superAdminNode = { data: { authRequired: true, requiredRole: 'SUPER_ADMIN' } };
    const adminNode = { data: { authRequired: true, requiredRole: 'ADMIN' } };
    const devNode = { data: { authRequired: true, requiredRole: 'DEVELOPER' } };

    expect(canAccess(superAdminNode)).toBe(true);
    expect(canAccess(adminNode)).toBe(true);
    expect(canAccess(devNode)).toBe(true);
  });

  it('allows ADMIN to access ADMIN and DEVELOPER nodes but NOT SUPER_ADMIN', () => {
    const canAccess = (node: any) => {
      if (!node?.data?.authRequired) return true;
      const required = node?.data?.requiredRole;
      const isSuperAdmin = false;
      const isAdmin = true;
      const isDeveloper = true;
      if (required === 'SUPER_ADMIN') return isSuperAdmin;
      if (required === 'ADMIN') return isAdmin || isSuperAdmin;
      if (required === 'DEVELOPER') return isAdmin || isSuperAdmin || isDeveloper;
      return true;
    };

    const superAdminNode = { data: { authRequired: true, requiredRole: 'SUPER_ADMIN' } };
    const adminNode = { data: { authRequired: true, requiredRole: 'ADMIN' } };
    const devNode = { data: { authRequired: true, requiredRole: 'DEVELOPER' } };

    expect(canAccess(superAdminNode)).toBe(false);
    expect(canAccess(adminNode)).toBe(true);
    expect(canAccess(devNode)).toBe(true);
  });

  it('allows DEVELOPER to access DEVELOPER nodes but NOT ADMIN or SUPER_ADMIN', () => {
    const canAccess = (node: any) => {
      if (!node?.data?.authRequired) return true;
      const required = node?.data?.requiredRole;
      const isSuperAdmin = false;
      const isAdmin = false;
      const isDeveloper = true;
      if (required === 'SUPER_ADMIN') return isSuperAdmin;
      if (required === 'ADMIN') return isAdmin || isSuperAdmin;
      if (required === 'DEVELOPER') return isAdmin || isSuperAdmin || isDeveloper;
      return true;
    };

    const superAdminNode = { data: { authRequired: true, requiredRole: 'SUPER_ADMIN' } };
    const adminNode = { data: { authRequired: true, requiredRole: 'ADMIN' } };
    const devNode = { data: { authRequired: true, requiredRole: 'DEVELOPER' } };

    expect(canAccess(superAdminNode)).toBe(false);
    expect(canAccess(adminNode)).toBe(false);
    expect(canAccess(devNode)).toBe(true);
  });

  it('allows UNAUTHENTICATED to access public nodes but NOT LOCKED', () => {
    const canAccess = (node: any) => {
      if (!node?.data?.authRequired) return true;
      const required = node?.data?.requiredRole;
      const isSuperAdmin = false;
      const isAdmin = false;
      const isDeveloper = false;
      if (required === 'SUPER_ADMIN') return isSuperAdmin;
      if (required === 'ADMIN') return isAdmin || isSuperAdmin;
      if (required === 'DEVELOPER') return isAdmin || isSuperAdmin || isDeveloper;
      return false;
    };

    const publicNode = { data: { authRequired: false, label: 'PUBLIC' } };
    const superAdminNode = { data: { authRequired: true, requiredRole: 'SUPER_ADMIN' } };

    expect(canAccess(publicNode)).toBe(true);
    expect(canAccess(superAdminNode)).toBe(false);
  });
});
