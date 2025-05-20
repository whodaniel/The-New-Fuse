import { User } from 'firebase/auth';
export interface AuthError {
    code: string;
    message: string;
}
export declare function useFirebaseAuth(): {
    user: User | null;
    loading: boolean;
    error: AuthError | null;
    signIn: (email: string, password: string) => Promise<User>;
    signInWithGoogle: () => Promise<User>;
    signUp: (email: string, password: string) => Promise<User>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
};
