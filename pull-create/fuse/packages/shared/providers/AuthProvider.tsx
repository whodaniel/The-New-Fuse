export {}
exports.useAuth = exports.AuthProvider = void 0;
import react_1 from 'react';
const AuthContext = (0, react_1.createContext)(undefined);
const AuthProvider = ({ children }): any => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        checkAuth();
    }, []);
    const checkAuth = async (): Promise<void> {) => {
        try {
            setLoading(false);
        }
        catch (err) {
            setError('Authentication check failed');
            setLoading(false);
        }
    };
    const login = async (): Promise<void> {email, password) => {
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
    const logout = async (): Promise<void> {) => {
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
    const signup = async (): Promise<void> {email, password, name) => {
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
    return (<AuthContext.Provider value={{
            user,
            loading,
            error,
            login,
            logout,
            signup,
        }}>
      {children}
    </AuthContext.Provider>);
};
exports.AuthProvider = AuthProvider;
const useAuth = (): any => {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
exports.default = exports.AuthProvider;
export {};
//# sourceMappingURL=AuthProvider.js.map