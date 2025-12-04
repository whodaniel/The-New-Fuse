import { useContext } from 'react';
import AuthContext from '../AuthContext';
export function useAuth() {
    var context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return {
        isAuthenticated: context.isAuthenticated,
        isLoading: !context.isInitialized,
        authToken: context.token,
        user: context.user,
        unsetUser: function () { return context.setToken(null); }
    };
}
