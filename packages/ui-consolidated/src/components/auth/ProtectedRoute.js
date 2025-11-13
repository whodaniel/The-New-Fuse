import React from 'react';
import { useAuthContext } from '../../providers/AuthProvider';
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
export function ProtectedRoute({ children, fallback = null, showLoading = true, loadingComponent = <div>Loading...</div>, }) {
    const { isAuthenticated, isLoading } = useAuthContext();
    if (isLoading && showLoading) {
        return <>{loadingComponent}</>;
    }
    return <>{isAuthenticated ? children : fallback}</>;
}
//# sourceMappingURL=ProtectedRoute.js.map