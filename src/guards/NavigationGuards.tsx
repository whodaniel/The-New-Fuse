import React, { FC } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

export const AuthGuard: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const RoleGuard: FC<{ 
  children: React.ReactNode;
  requiredRoles: string[];
}> = ({ children, requiredRoles }) => {
  const { hasPermission } = usePermissions();
  
  if (!requiredRoles.some(role => hasPermission(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export const ModuleGuard: FC<{
  children: React.ReactNode;
  moduleName: string;
}> = ({ children, moduleName }) => {
  const { hasModuleAccess } = usePermissions();

  if (!hasModuleAccess(moduleName)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};