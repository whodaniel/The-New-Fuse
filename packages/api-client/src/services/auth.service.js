import { BaseService } from './BaseService';
/**
 * Authentication service for user management
 */
export class AuthService extends BaseService {
    /**
     * Create a new authentication service
     * @param api API client instance
     */
    constructor(api) {
        super(api, '/auth');
    }
    /**
     * Login with email and password
     * @param email User email
     * @param password User password
     * @returns Promise with login response containing auth tokens and user data
     */
    async login(email, password) {
        this.validateRequired({ email, password }, ['email', 'password']);
        return this.post('/login', { email, password });
    }
    /**
     * Register a new user
     * @param name User name
     * @param email User email
     * @param password User password
     * @returns Promise with registration response containing auth tokens and user data
     */
    async register(name, email, password) {
        this.validateRequired({ name, email, password }, ['name', 'email', 'password']);
        return this.post('/register', { name, email, password });
    }
    /**
     * Logout the current user
     * @returns Promise with logout response
     */
    async logout() {
        return this.post('/logout');
    }
    /**
     * Request a password reset
     * @param email User email
     * @returns Promise with password reset response
     */
    async forgotPassword(email) {
        this.validateRequired({ email }, ['email']);
        return this.post('/forgot-password', { email });
    }
    /**
     * Reset password with token
     * @param token Reset token
     * @param password New password
     * @returns Promise with password reset response
     */
    async resetPassword(token, password) {
        this.validateRequired({ token, password }, ['token', 'password']);
        return this.post('/reset-password', { token, password });
    }
    /**
     * Verify email with token
     * @param token Verification token
     * @returns Promise with email verification response
     */
    async verifyEmail(token) {
        this.validateRequired({ token }, ['token']);
        return this.post('/verify-email', { token });
    }
    /**
     * Refresh the authentication token
     * @returns Promise with new token
     */
    async refreshToken() {
        const response = await this.post('/refresh-token');
        return response.token || '';
    }
    /**
     * Get the current user
     * @returns Promise with current user data
     */
    async getCurrentUser() {
        return this.get('/me');
    }
}
/**
 * Create a new authentication service
 * @param api API client instance
 * @returns Authentication service instance
 *
 * @example
 * ```typescript
 * import { createApiClient, createAuthService } from '@the-new-fuse/api-client';
 *
 * // Create a new API client
 * const api = createApiClient({
 *   baseURL: 'https://api.example.com',
 * });
 *
 * // Create auth service
 * const authService = createAuthService(api);
 *
 * // Login
 * const authResponse = await authService.login('user@example.com', 'password');
 * console.log(`Logged in as ${authResponse.user.name}`);
 * ```
 */
export function createAuthService(api) {
    return new AuthService(api);
}
