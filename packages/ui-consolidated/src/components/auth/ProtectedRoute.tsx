import React from 'react';
import { useAuthContext } from '../../providers/AuthProvider.js';

/**
 * Protected route props
 */
export interface ProtectedRouteProps {
  /**
   * Component to render if authenticated
   */
  children: React.ReactNode;
  /**
   * Component to render if not authenticated
   */
  fallback?: React.ReactNode;
  /**
   * Whether to show a loading state while checking authentication
   * @default true
   */
  showLoading?: boolean;
  /**
   * Loading component to show while checking authentication
   */
  loadingComponent?: React.ReactNode;
}

/**
 * Protected route component
 * @param props Protected route props
 * @returns Protected route component
 * 
 * @example
 * // Basic usage
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // With custom fallback
 * <ProtectedRoute fallback={<Navigate to="/login" />}>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // With custom loading component
 * <ProtectedRoute loadingComponent={<LoadingSpinner />}>
 *   <Dashboard />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  fallback = null,
  showLoading = true,
  loadingComponent = <div>Loading...</div>,
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuthContext();
  
  if (isLoading && showLoading) {
    return <>{loadingComponent}</>;
  }
  
  return <>{isAuthenticated ? children : fallback}</>;
}
