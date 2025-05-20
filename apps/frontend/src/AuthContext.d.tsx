import React from 'react';
import { User } from 'firebase/auth';
interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    user: User | null;
    setToken: (token: string | null) => void;
}
declare const AuthContext: React.Context<AuthContextType>;
export declare const AuthProvider: React.React.FC<{
    children: React.ReactNode;
}>;
export declare const useAuth: () => AuthContextType;
export default AuthContext;
