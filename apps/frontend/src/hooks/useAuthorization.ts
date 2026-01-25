import { useAuth } from '@/providers/AuthProvider';

export interface PermissionCheck {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'execute' | 'admin';
  tenantId?: string;
}

export const useAuthorization = () => {
  const { user } = useAuth();

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;

    // Check if user.roles array includes any of the required roles
    // Support both single 'role' field and 'roles' array
    if (Array.isArray((user as any).roles)) {
      return roles.some((role) =>
        (user as any).roles.map((r: string) => r.toUpperCase()).includes(role.toUpperCase())
      );
    }

    // Fallback to single role check
    return roles.map((r) => r.toUpperCase()).includes(user.role.toUpperCase());
  };

  const canAccess = (check: PermissionCheck): boolean => {
    if (!user) return false;

    // 1. SUPER_ADMIN has access to everything
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
    if (Array.isArray((user as any).roles)) {
      (user as any).roles.forEach((role: string) => {
        const rolePerms = permissions[role.toUpperCase()] || [];
        userPermissions = [...userPermissions, ...rolePerms];
      });
    } else {
      userPermissions = permissions[user.role.toUpperCase()] || [];
    }

    const requiredPermission = `${check.action}:${check.resource}`;

    return (
      userPermissions.includes('*') ||
      userPermissions.includes(`${check.action}:*`) ||
      userPermissions.includes(`*:${check.resource}`) ||
      userPermissions.includes(requiredPermission)
    );
  };

  return {
    hasRole,
    canAccess,
    // Master admin checks
    isSuperAdmin: hasRole(['SUPER_ADMIN']),
    // Agency admin checks
    isAgencyOwner: hasRole(['AGENCY_OWNER']),
    isAgencyAdmin: hasRole(['AGENCY_ADMIN', 'AGENCY_MANAGER']),
    isAnyAgencyAdmin: hasRole(['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER']),
    // Legacy checks
    isAdmin: hasRole(['SUPER_ADMIN', 'ADMIN']),
    isDeveloper: hasRole(['DEVELOPER']),
    // User info
    userRole: user?.role.toUpperCase(),
    userRoles: Array.isArray((user as any).roles)
      ? (user as any).roles.map((r: string) => r.toUpperCase())
      : [user?.role.toUpperCase()],
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
