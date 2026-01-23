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
    return roles.includes(user.role.toUpperCase());
  };

  const canAccess = (check: PermissionCheck): boolean => {
    if (!user) return false;

    // 1. Tenancy Isolation: If a tenantId is provided, the user MUST belong to it or be a Global Admin
    if (check.tenantId && user.role !== 'ADMIN') {
      // In a real app, user would have a list of agencyIds: user.agencies.includes(check.tenantId)
      // For now, we simulate this check. 
      // If user has a tenantId attribute, we check equality.
      if ((user as any).tenantId && (user as any).tenantId !== check.tenantId) {
        return false;
      }
    }
    
    // 2. Role-based Permission Mapping
    const permissions: Record<string, string[]> = {
      ADMIN: ['*'],
      DEVELOPER: ['read:*', 'write:*', 'execute:*'],
      USER: ['read:own', 'write:own', 'execute:own', 'read:public'],
      GUEST: ['read:public'],
    };

    const userPermissions = permissions[user.role.toUpperCase()] || [];
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
    isAdmin: user?.role.toUpperCase() === 'ADMIN',
    isDeveloper: user?.role.toUpperCase() === 'DEVELOPER',
    userRole: user?.role.toUpperCase(),
    // Helper to filter items by tenancy
    filterByTenancy: <T extends { tenantId?: string }>(items: T[]): T[] => {
      if (user?.role.toUpperCase() === 'ADMIN') return items;
      return items.filter(item => !item.tenantId || item.tenantId === (user as any).tenantId);
    }
  };
};