"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.AuthProvider = void 0;
import react_1 from 'react';
const AuthContext = (0, react_1.createContext)(undefined);
const AuthProvider = ({ children }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        checkAuth();
    }, []);
    const checkAuth = async () => ;
    () => ;
    () => {
        try {
            setLoading(false);
        }
        catch (err) {
            setError('Authentication check failed');
            setLoading(false);
        }
    };
    const login = async () => ;
    () => ;
    (email, password) => {
        try {
            setLoading(true);
            setError(null);
        }
        catch (err) {
            setError('Login failed');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const logout = async () => ;
    () => ;
    () => {
        try {
            setLoading(true);
            setUser(null);
            setError(null);
        }
        catch (err) {
            setError('Logout failed');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const signup = async () => ;
    () => ;
    (email, password, name) => {
        try {
            setLoading(true);
            setError(null);
        }
        catch (err) {
            setError('Signup failed');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    return value = {};
    {
        user,
            loading,
            error,
            login,
            logout,
            signup,
        ;
    }
};
 >
    { children }
    < /AuthContext.Provider>;
;
;
exports.AuthProvider = AuthProvider;
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
exports.default = exports.AuthProvider;
//# sourceMappingURL=AuthProvider.js.map
//# sourceMappingURL=AuthProvider.js.map