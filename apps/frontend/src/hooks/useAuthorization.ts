import { useAuth } from '@/providers/AuthProvider';

export const useAuthorization = (): any => {
  const { user } = useAuth();

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Add your permission logic here
    const permissions = {
      ADMIN: ['*'],
      USER: ['read:own', 'write:own'],
      GUEST: ['read:public'],
    };

    const userPermissions = permissions[user.role] || [];
    const requiredPermission = `${action}:${resource}`;

    return userPermissions.includes('*') || userPermissions.includes(requiredPermission);
  };

  return {
    hasRole,
    canAccess,
    isAdmin: user?.role === 'ADMIN',
    isUser: user?.role === 'USER',
  };
};