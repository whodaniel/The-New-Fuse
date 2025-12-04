import { ReactNode } from 'react';
import { User } from 'firebase/auth';
interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: {
        code: string;
        message: string;
    } | null;
    signIn: (email: string, password: string) => Promise<User>;
    signInWithGoogle: () => Promise<User>;
    signUp: (email: string, password: string) => Promise<User>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
}
declare const AuthContext: import("react").Context<AuthContextType | null>;
interface AuthProviderProps {
    children: ReactNode;
}
export declare function AuthProvider({ children }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextType;
export default AuthContext;
