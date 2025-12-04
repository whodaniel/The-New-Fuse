import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import Loading from '../Loading';
var PublicRoute = function () {
    var _a, _b;
    var _c = useAuth(), isAuthenticated = _c.isAuthenticated, isLoading = _c.isLoading;
    var location = useLocation();
    if (isLoading) {
        return _jsx(Loading, {});
    }
    // Check if there's a redirect path in the location state
    var from = ((_b = (_a = location.state) === null || _a === void 0 ? void 0 : _a.from) === null || _b === void 0 ? void 0 : _b.pathname) || '/dashboard';
    if (isAuthenticated) {
        // Redirect authenticated users to the dashboard or the page they were trying to access
        return _jsx(Navigate, { to: from, replace: true });
    }
    return _jsx(Outlet, {});
};
export default PublicRoute;
