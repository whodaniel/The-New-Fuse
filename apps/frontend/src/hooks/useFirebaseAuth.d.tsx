import { User } from 'firebase/auth';
import { AuthenticationError } from '../../../types/error.tsx'; // Import AuthenticationError

// Local AuthError interface removed

export declare function useFirebaseAuth(): {
    user: User | null;
    loading: boolean;
    error: AuthenticationError | null; // Use AuthenticationError
    signIn: (email: string, password: string) => Promise<User>;
    signInWithGoogle: () => Promise<User>;
    signUp: (email: string, password: string) => Promise<User>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
};
