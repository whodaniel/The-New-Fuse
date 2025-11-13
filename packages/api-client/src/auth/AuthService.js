/**
 * Authentication service for managing user authentication
 */
export class AuthService {
    apiClient;
    /**
     * Create a new authentication service
     * @param apiClient API client
     */
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    /**
     * Login a user
     * @param credentials User login credentials
     * @returns Promise resolving to the authentication response
     */
    async login(credentials) {
        const response = await this.apiClient.post('/auth/login', credentials);
        return response;
    }
    /**
     * Register a new user
     * @param data User registration data
     * @returns Promise resolving to the authentication response
     */
    async register(data) {
        const response = await this.apiClient.post('/auth/register', data);
        return response;
    }
    /**
     * Logout the current user
     * @returns Promise resolving when the user is logged out
     */
    async logout() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await this.apiClient.post('/auth/logout', { refreshToken });
            }
        }
        catch (error) {
            console.error('Error during logout:', error);
        }
        finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    }
    /**
     * Refresh the access token
     * @returns Promise resolving to the new authentication response
     */
    async refreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        const response = await this.apiClient.post('/auth/refresh', { refreshToken });
        return response;
    }
    /**
     * Get the current user
     * @returns Promise resolving to the current user data
     */
    async getCurrentUser() {
        return this.apiClient.get('/auth/me');
    }
    /**
     * Check if the user is authenticated
     * @returns Promise resolving to true if the user is authenticated
     */
    async isAuthenticated() {
        const accessToken = localStorage.getItem('accessToken');
        return !!accessToken;
    }
}
//# sourceMappingURL=AuthService.js.map