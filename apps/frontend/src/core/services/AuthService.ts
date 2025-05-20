import { StateManager } from '../../domain/core/stateManager.js';
import { LoggingService } from '../../services/logging.js';
const API_BASE_URL = '/api';
export class AuthService {
    constructor() {
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
    }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    async login(credentials) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            if (!response.ok) {
                throw new Error('Login failed');
            }
            const tokens = await response.json();
            this.setTokens(tokens);
            await this.fetchAndSetUserProfile();
            this.eventBus.emit('auth_login', { email: credentials.email }, 'AuthService');
            return { success: true, data: tokens };
        }
        catch (error) {
            this.logger.error('Login failed', error);
            return {
                success: false,
                error: {
                    code: 'LOGIN_FAILED',
                    message: 'Failed to login',
                    details: error
                }
            };
        }
    }
    async logout() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });
            if (!response.ok) {
                throw new Error('Logout failed');
            }
            this.clearTokens();
            this.stateManager.setState(['auth', 'user'], null);
            this.eventBus.emit('auth_logout', null, 'AuthService');
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Logout failed', error);
            return {
                success: false,
                error: {
                    code: 'LOGOUT_FAILED',
                    message: 'Failed to logout',
                    details: error
                }
            };
        }
    }
    async register(credentials) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            if (!response.ok) {
                throw new Error('Registration failed');
            }
            const tokens = await response.json();
            this.setTokens(tokens);
            await this.fetchAndSetUserProfile();
            this.eventBus.emit('auth_register', { email: credentials.email }, 'AuthService');
            return { success: true, data: tokens };
        }
        catch (error) {
            this.logger.error('Registration failed', error);
            return {
                success: false,
                error: {
                    code: 'REGISTRATION_FAILED',
                    message: 'Failed to register',
                    details: error
                }
            };
        }
    }
    async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });
            if (!response.ok) {
                throw new Error('Token refresh failed');
            }
            const tokens = await response.json();
            this.setTokens(tokens);
            return { success: true, data: tokens };
        }
        catch (error) {
            this.logger.error('Token refresh failed', error);
            return {
                success: false,
                error: {
                    code: 'TOKEN_REFRESH_FAILED',
                    message: 'Failed to refresh token',
                    details: error
                }
            };
        }
    }
    async fetchAndSetUserProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            const profile = await response.json();
            this.stateManager.setState(['auth', 'user'], profile);
        }
        catch (error) {
            this.logger.error('Failed to fetch user profile', error);
            throw error;
        }
    }
    isAuthenticated() {
        return !!this.getAccessToken();
    }
    getCurrentUser() {
        return this.stateManager.getState(['auth', 'user']);
    }
    setTokens(tokens) {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
    getAccessToken() {
        return localStorage.getItem('accessToken');
    }
    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    }
    subscribeToAuthState(callback) {
        return this.stateManager.subscribe(['auth', 'user'], callback);
    }
}
//# sourceMappingURL=AuthService.js.map