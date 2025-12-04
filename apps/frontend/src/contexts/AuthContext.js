import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
var AuthContext = createContext(null);
export function AuthProvider(_a) {
    var children = _a.children;
    var auth = useFirebaseAuth();
    return (_jsx(AuthContext.Provider, { value: auth, children: children }));
}
export function useAuth() {
    var context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export default AuthContext;
