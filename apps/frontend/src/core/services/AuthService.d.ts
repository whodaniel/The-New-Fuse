export declare class AuthService {
    constructor();
    static getInstance(): any;
    login(credentials: any): Promise<{
        success: boolean;
        data: import("../../lib/supabase").Session | null;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    logout(): Promise<{
        success: boolean;
        data: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    register(credentials: any): Promise<{
        success: boolean;
        data: import("../../lib/supabase").Session | null;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    refreshToken(): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: unknown;
        };
        data?: undefined;
    }>;
    fetchAndSetUserProfile(): Promise<void>;
    isAuthenticated(): Promise<boolean>;
    getCurrentUser(): any;
    setTokens(tokens: any): void;
    clearTokens(): void;
    getAccessToken(): Promise<string | null>;
    getRefreshToken(): string | null;
    subscribeToAuthState(callback: any): any;
}
