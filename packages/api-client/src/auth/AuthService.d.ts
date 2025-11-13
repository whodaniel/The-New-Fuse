import { ApiClient } from '../client/ApiClient';
/**
 * User login credentials
 */
export interface LoginCredentials {
    /**
     * User email
     */
    email: string;
    /**
     * User password
     */
    password: string;
}
/**
 * User registration data
 */
export interface RegisterData {
    /**
     * User email
     */
    email: string;
    /**
     * User password
     */
    password: string;
    /**
     * User name
     */
    name: string;
}
/**
 * Authentication response
 */
export interface AuthResponse {
    /**
     * Access token
     */
    accessToken: string;
    /**
     * Refresh token
     */
    refreshToken: string;
    /**
     * User data
     */
    user: {
        id: string;
        email: string;
        name: string;
    };
}
/**
 * Authentication service for managing user authentication
 */
export declare class AuthService {
    private apiClient;
    /**
     * Create a new authentication service
     * @param apiClient API client
     */
    constructor(apiClient: ApiClient);
    /**
     * Login a user
     * @param credentials User login credentials
     * @returns Promise resolving to the authentication response
     */
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    /**
     * Register a new user
     * @param data User registration data
     * @returns Promise resolving to the authentication response
     */
    register(data: RegisterData): Promise<AuthResponse>;
    /**
     * Logout the current user
     * @returns Promise resolving when the user is logged out
     */
    logout(): Promise<void>;
    /**
     * Refresh the access token
     * @returns Promise resolving to the new authentication response
     */
    refreshToken(): Promise<AuthResponse>;
    /**
     * Get the current user
     * @returns Promise resolving to the current user data
     */
    getCurrentUser(): Promise<AuthResponse['user']>;
    /**
     * Check if the user is authenticated
     * @returns Promise resolving to true if the user is authenticated
     */
    isAuthenticated(): Promise<boolean>;
}
//# sourceMappingURL=AuthService.d.ts.map