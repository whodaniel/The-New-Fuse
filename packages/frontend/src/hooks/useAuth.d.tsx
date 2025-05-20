interface User {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
}
interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export declare function useAuth(): {
    login: (credentials: LoginCredentials) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    error: string | null;
};
export {};
