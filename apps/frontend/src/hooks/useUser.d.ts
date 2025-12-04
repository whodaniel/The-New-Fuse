interface User {
    uid: string;
    email?: string;
    username?: string;
    role?: string;
    profileImage?: string;
    settings?: {
        [key: string]: any;
    };
}
interface UseUserReturn {
    user: User | null;
    setUser: (user: User | null) => void;
    clearUser: () => void;
    isAuthenticated: boolean;
}
export default function useUser(): UseUserReturn;
export {};
