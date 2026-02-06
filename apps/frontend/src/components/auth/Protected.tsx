import React from 'react';
import { PermissionCheck, useAuthorization } from '../../hooks/useAuthorization';

interface ProtectedProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  permission?: PermissionCheck;
  roles?: string[];
  tenantId?: string;
}

/**
 * Protected component for declarative privilege & tenancy enforcement.
 * Usage:
 * <Protected permission={{ resource: 'agents', action: 'write', tenantId: 'agency-1' }}>
 *   <button>Configure Agent</button>
 * </Protected>
 */
export const Protected: React.FC<ProtectedProps> = ({
  children,
  fallback = null,
  permission,
  roles,
  tenantId,
}) => {
  const { canAccess, hasRole } = useAuthorization();

  let isAllowed = true;

  if (permission) {
    // If tenantId is passed directly to Protected, it overrides the one in permission
    const check = tenantId ? { ...permission, tenantId } : permission;
    isAllowed = canAccess(check);
  }

  if (isAllowed && roles) {
    isAllowed = hasRole(roles);
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default Protected;
