import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
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
export function ProtectedRoute({ children, fallback = null, showLoading = true, loadingComponent = _jsx("div", { children: "Loading..." }), }) {
    const { isAuthenticated, isLoading } = useAuthContext();
    if (isLoading && showLoading) {
        return _jsx(_Fragment, { children: loadingComponent });
    }
    return _jsx(_Fragment, { children: isAuthenticated ? children : fallback });
}
