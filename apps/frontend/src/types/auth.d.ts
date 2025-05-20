export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    emailVerified: boolean;
}
export interface AuthContextType {
    user: User | null;
    authToken: string | null;
    loading: boolean;
    setToken: (token: string) => void;
    updateUser: (user: User) => void;
    unsetUser: () => void;
}
