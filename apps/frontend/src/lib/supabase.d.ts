/**
 * Simple Auth System for Railway Backend
 * This replaces Supabase authentication with a simple JWT-based auth system
 */
export interface User {
    id: string;
    email: string;
    user_metadata?: {
        name?: string;
        role?: string;
    };
    created_at?: string;
}
export interface Session {
    access_token: string;
    refresh_token?: string;
    user: User;
}
export interface AuthResponse {
    success: boolean;
    data?: {
        session: Session | null;
        user: User | null;
    };
    error?: string;
}
/**
 * Simple auth helpers that work with Railway backend
 */
export declare const authHelpers: {
    /**
     * Sign in with email and password
     */
    signIn(email: string, password: string): Promise<AuthResponse>;
    /**
     * Sign up with email and password
     */
    signUp(email: string, password: string, metadata?: any): Promise<AuthResponse>;
    /**
     * Sign out
     */
    signOut(): Promise<AuthResponse>;
    /**
     * Get current user
     */
    getCurrentUser(): Promise<User | null>;
    /**
     * Get current session
     */
    getCurrentSession(): Promise<Session | null>;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): Promise<boolean>;
    /**
     * Get access token
     */
    getAccessToken(): Promise<string | null>;
};
/**
 * Mock supabase client for compatibility
 * Only implements the minimal auth functionality needed
 */
export declare const supabase: {
    auth: {
        onAuthStateChange(callback: (event: string, session: Session | null) => void): {
            data: {
                subscription: {
                    unsubscribe: () => void;
                };
            };
        };
    };
};
