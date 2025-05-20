interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
interface RegisterData {
    name: string;
    email: string;
    password: string;
}
declare const useAuth: () => {
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    register: (data: RegisterData) => Promise<boolean>;
    checkAuth: () => Promise<void>;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
};
export { useAuth, type User, type AuthState, type RegisterData };
