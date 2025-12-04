import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import Loading from '../Loading';
var ProtectedRoute = function () {
    var _a = useAuth(), isAuthenticated = _a.isAuthenticated, isLoading = _a.isLoading;
    var location = useLocation();
    if (isLoading) {
        return _jsx(Loading, {});
    }
    if (!isAuthenticated) {
        // Redirect to login page with the return url
        return _jsx(Navigate, { to: "/auth/login", state: { from: location }, replace: true });
    }
    return _jsx(Outlet, {});
};
export default ProtectedRoute;
