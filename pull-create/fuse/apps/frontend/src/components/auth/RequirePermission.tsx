import React from 'react';
import { Navigate } from 'react-router-dom';
import { PermissionCheck, useAuthorization } from '../../hooks/useAuthorization';
import { useAuth } from '../../providers/AuthProvider';

interface RequirePermissionProps {
  /**
   * List of roles that are allowed to access this route
   * User must have at least ONE of these roles
   */
  roles?: string[];

  /**
   * Specific permission check (resource + action + optional tenantId)
   */
  permissions?: PermissionCheck;

  /**
   * Content to render if permission is granted
   */
  children: React.ReactNode;

  /**
   * Path to redirect to if permission is denied
   * @default '/unauthorized'
   */
  fallback?: string;

  /**
   * Require ALL roles instead of ANY role
   * @default false
   */
  requireAll?: boolean;
}

/**
 * RequirePermission Component
 *
 * Guards routes and components based on user roles and permissions.
 * Redirects to fallback route if access is denied.
 *
 * @example
 * // Require SUPER_ADMIN role
 * <RequirePermission roles={['SUPER_ADMIN']}>
 *   <AdminDashboard />
 * </RequirePermission>
 *
 * @example
 * // Require either AGENCY_OWNER or AGENCY_ADMIN
 * <RequirePermission roles={['AGENCY_OWNER', 'AGENCY_ADMIN']}>
 *   <AgencySettings />
 * </RequirePermission>
 *
 * @example
 * // Require specific permission
 * <RequirePermission
 *   permissions={{ resource: 'users', action: 'admin', tenantId: 'agency-123' }}
 * >
 *   <UserManagement />
 * </RequirePermission>
 *
 * @example
 * // Custom fallback
 * <RequirePermission roles={['SUPER_ADMIN']} fallback="/dashboard">
 *   <SystemSettings />
 * </RequirePermission>
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({
  roles,
  permissions,
  children,
  fallback = '/unauthorized',
  requireAll = false,
}) => {
  const { isLoading } = useAuth();
  const { hasRole, canAccess } = useAuthorization();

  // Avoid false 401 redirects while auth state is still hydrating.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check role-based access
  if (roles) {
    const hasAccess = requireAll ? roles.every((role) => hasRole([role])) : hasRole(roles);

    if (!hasAccess) {
      return <Navigate to={fallback} replace />;
    }
  }

  // Check permission-based access
  if (permissions && !canAccess(permissions)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default RequirePermission;
