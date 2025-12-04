export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    error: string | null;
}
/**
 * Auth provider component
 */
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Hook for accessing the auth context
 */
export declare function useAuth(): AuthContextType;
export {};
