import { useAuth } from '@/providers/AuthProvider';

export interface PermissionCheck {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'execute' | 'admin';
  tenantId?: string;
}

export const useAuthorization = () => {
  const { user } = useAuth();

  // Specific override for the Super Admin / Master Admin
  const isBizSynthMasterAdmin = user?.email?.toLowerCase() === 'owner@example.com';

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;

    // Override for BizSynth Super Admin
    if (
      isBizSynthMasterAdmin &&
      roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r.toUpperCase()))
    ) {
      return true;
    }

    // Check if user.roles array includes any of the required roles
    // Support both single 'role' field and 'roles' array
    if (Array.isArray((user as any).roles) && (user as any).roles.length > 0) {
      return roles.some((role) =>
        (user as any).roles.map((r: string) => r.toUpperCase()).includes(role.toUpperCase())
      );
    }

    // Fallback to single role check
    if (user.role) {
      return roles.map((r) => r.toUpperCase()).includes(user.role.toUpperCase());
    }

    return false;
  };

  const getEffectiveRoles = (): string[] => {
    if (!user) return [];

    let baseRoles: string[] = [];
    if (Array.isArray((user as any).roles)) {
      baseRoles = (user as any).roles.map((r: string) => r.toUpperCase());
    } else if (user.role) {
      baseRoles = [user.role.toUpperCase()];
    }

    // Inject SUPER_ADMIN for the master email if not present
    if (isBizSynthMasterAdmin && !baseRoles.includes('SUPER_ADMIN')) {
      return ['SUPER_ADMIN', ...baseRoles];
    }

    return baseRoles;
  };

  const canAccess = (check: PermissionCheck): boolean => {
    if (!user) return false;

    // 1. SUPER_ADMIN has access to everything
    // This now catches the bizsynth override via hasRole
    if (hasRole(['SUPER_ADMIN'])) return true;

    // 2. Tenancy Isolation: If a tenantId is provided, the user MUST belong to it
    if (check.tenantId) {
      // Agency admins can only access their own agency
      if (hasRole(['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER'])) {
        if ((user as any).agencyId !== check.tenantId) {
          return false;
        }
      } else if (!hasRole(['ADMIN'])) {
        // Regular users - check their tenantId
        if ((user as any).tenantId && (user as any).tenantId !== check.tenantId) {
          return false;
        }
      }
    }

    // 3. Role-based Permission Mapping
    const permissions: Record<string, string[]> = {
      SUPER_ADMIN: ['*'],
      ADMIN: ['*'], // Legacy support
      AGENCY_OWNER: ['admin:agency', 'read:*', 'write:*', 'execute:agency'],
      AGENCY_ADMIN: ['admin:agency', 'read:*', 'write:agency', 'execute:agency'],
      AGENCY_MANAGER: ['read:*', 'write:agency', 'execute:agency'],
      AGENT_OPERATOR: ['read:agents', 'write:agents', 'execute:agents'],
      DEVELOPER: ['read:*', 'write:*', 'execute:*'],
      USER: ['read:own', 'write:own', 'execute:own', 'read:public'],
      GUEST: ['read:public'],
    };

    // Get user's permissions based on their role(s)
    let userPermissions: string[] = [];
    const effectiveRoles = getEffectiveRoles();

    effectiveRoles.forEach((role: string) => {
      const rolePerms = permissions[role] || [];
      userPermissions = [...userPermissions, ...rolePerms];
    });

    const requiredPermission = `${check.action}:${check.resource}`;

    return (
      userPermissions.includes('*') ||
      userPermissions.includes(`${check.action}:*`) ||
      userPermissions.includes(`*:${check.resource}`) ||
      userPermissions.includes(requiredPermission)
    );
  };

  const effectiveRoles = getEffectiveRoles();

  return {
    hasRole,
    canAccess,
    // Master admin checks
    isSuperAdmin: isBizSynthMasterAdmin || hasRole(['SUPER_ADMIN']),
    // Agency admin checks
    isAgencyOwner: hasRole(['AGENCY_OWNER']),
    isAgencyAdmin: hasRole(['AGENCY_ADMIN', 'AGENCY_MANAGER']),
    isAnyAgencyAdmin: hasRole(['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER']),
    // Legacy checks
    isAdmin: hasRole(['SUPER_ADMIN', 'ADMIN']),
    isDeveloper: hasRole(['DEVELOPER']),
    // User info
    userRole: isBizSynthMasterAdmin ? 'SUPER_ADMIN' : user?.role?.toUpperCase() || undefined,
    userRoles: effectiveRoles,
    // Helper to filter items by tenancy
    filterByTenancy: <T extends { tenantId?: string; agencyId?: string }>(items: T[]): T[] => {
      if (hasRole(['SUPER_ADMIN', 'ADMIN'])) return items;

      if (hasRole(['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER'])) {
        return items.filter((item) => !item.agencyId || item.agencyId === (user as any).agencyId);
      }

      return items.filter((item) => !item.tenantId || item.tenantId === (user as any).tenantId);
    },
  };
};
