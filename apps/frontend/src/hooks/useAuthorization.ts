import { useAuth } from '@/providers/AuthProvider';
import React from 'react';

export interface PermissionCheck {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'execute' | 'admin';
  tenantId?: string;
}

const normalizeRole = (role: string | undefined | null): string => {
  if (!role) return '';

  const normalized = role
    .trim()
    .replace(/^role[:_\s-]*/i, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  const aliases: Record<string, string> = {
    SUPERADMIN: 'SUPER_ADMIN',
    SUPER_ADMINISTRATOR: 'SUPER_ADMIN',
    SUPER_USER: 'SUPER_ADMIN',
    AGENCYADMIN: 'AGENCY_ADMIN',
    AGENCYOWNER: 'AGENCY_OWNER',
    AGENCYMANAGER: 'AGENCY_MANAGER',
    AGENTOPERATOR: 'AGENT_OPERATOR',
  };

  return aliases[normalized] || normalized;
};

const normalizeRoles = (roles: Array<string | undefined | null>): string[] => {
  return Array.from(new Set(roles.map(normalizeRole).filter(Boolean)));
};

const MASTER_SUPER_ADMIN_EMAILS = (
  import.meta.env.VITE_MASTER_SUPER_ADMIN_EMAILS || 'owner@example.com'
)
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

export const useAuthorization = () => {
  const { user } = useAuth();

  // Specific override for the Super Admin / Master Admin
  const isBizSynthMasterAdmin = MASTER_SUPER_ADMIN_EMAILS.includes(
    (user?.email || '').toLowerCase()
  );

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    const requiredRoles = normalizeRoles(roles);

    // Override for BizSynth Super Admin
    if (isBizSynthMasterAdmin && requiredRoles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r))) {
      return true;
    }

    // Check if user.roles array includes any of the required roles
    // Support both single 'role' field and 'roles' array
    if (Array.isArray((user as any).roles) && (user as any).roles.length > 0) {
      const userRoles = normalizeRoles((user as any).roles);
      return requiredRoles.some((role) => userRoles.includes(role));
    }

    // Fallback to single role check
    if (user.role) {
      return requiredRoles.includes(normalizeRole(user.role));
    }

    return false;
  };

  const getEffectiveRoles = (): string[] => {
    if (!user) return [];

    let baseRoles: string[] = [];
    if (Array.isArray((user as any).roles)) {
      baseRoles = normalizeRoles((user as any).roles);
    } else if (user.role) {
      baseRoles = normalizeRoles([user.role]);
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

  const effectiveRoles = React.useMemo(() => getEffectiveRoles(), [user, isBizSynthMasterAdmin]);

  return {
    hasRole,
    canAccess,
    // Master admin checks
    isSuperAdmin: isBizSynthMasterAdmin || hasRole(['SUPER_ADMIN']),
    isBizSynthMasterAdmin,
    // Agency admin checks
    isAgencyOwner: hasRole(['AGENCY_OWNER']),
    isAgencyAdmin: hasRole(['AGENCY_ADMIN', 'AGENCY_MANAGER']),
    isAnyAgencyAdmin: hasRole(['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER']),
    // Legacy checks
    isAdmin: hasRole(['SUPER_ADMIN', 'ADMIN']),
    isDeveloper: hasRole(['DEVELOPER']),
    // User info
    userRole: isBizSynthMasterAdmin ? 'SUPER_ADMIN' : normalizeRole(user?.role) || undefined,
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
