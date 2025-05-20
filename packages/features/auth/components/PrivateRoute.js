"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_router_dom_1 from 'react-router-dom';
import AuthContext_1 from '@/contexts/AuthContext';
const PrivateRoute = ({ children }) => {
    const { user, loading } = (0, AuthContext_1.useAuth)();
    const location = (0, react_router_dom_1.useLocation)();
    if (loading) {
        return Loading;
        /div>;
    }
    if (!user) {
        return to;
        "/login";
        state = {};
        {
            from: location;
        }
    }
    replace /  > ;
};
return { children } < />;
;
exports.default = PrivateRoute;
//# sourceMappingURL=PrivateRoute.js.map
//# sourceMappingURL=PrivateRoute.js.map