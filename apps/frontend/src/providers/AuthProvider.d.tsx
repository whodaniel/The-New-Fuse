import React, { ReactNode } from 'react';
import { User } from '@/types/user';
interface AuthContextType {
    user: User | null;
    authToken: string | null;
    loading: boolean;
    setToken: (token: string) => void;
    updateUser: (newUser: User, token?: string) => void;
    unsetUser: () => void;
    sendVerificationEmail: () => Promise<void>;
    enable2FA: () => Promise<string>;
    disable2FA: () => Promise<void>;
}
interface AuthProviderProps {
    children: ReactNode;
}
export declare function AuthProvider({ children }: AuthProviderProps): React.JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
