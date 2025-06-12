/**
 * Authentication manager for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
// Create an auth-specific logger
const authLogger = new Logger({
    name: 'AuthManager',
    level: 'info',
    saveToStorage: true
});
/**
 * Authentication manager
 */
export class AuthManager {
    /**
     * Create a new AuthManager
     * @param relayUrl - Relay server URL
     */
    constructor(relayUrl) {
        this.token = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.refreshTimeout = null;
        this.authState = 'disconnected';
        this.relayUrl = relayUrl;
        authLogger.info(`AuthManager initialized with relay URL: ${relayUrl}`);
    }
    /**
     * Initialize authentication
     */
    async initialize() {
        await this.loadTokens();
        if (this.token && this.isTokenValid()) {
            this.scheduleRefresh();
            this.authState = 'authenticated';
            authLogger.info('Authentication initialized with valid token');
        }
        else {
            authLogger.info('No valid token found during initialization');
        }
    }
    /**
     * Load tokens from storage
     */
    async loadTokens() {
        try {
            const result = await chrome.storage.local.get(['authToken', 'refreshToken', 'tokenExpiry']);
            this.token = result.authToken || null;
            this.refreshToken = result.refreshToken || null;
            this.tokenExpiry = result.tokenExpiry ? new Date(result.tokenExpiry) : null;
            authLogger.debug('Loaded tokens from storage', {
                hasToken: !!this.token,
                hasRefreshToken: !!this.refreshToken,
                tokenExpiry: this.tokenExpiry?.toISOString()
            });
        }
        catch (error) {
            authLogger.error('Error loading tokens', error);
        }
    }
    /**
     * Save tokens to storage
     * @param token - Auth token
     * @param refreshToken - Refresh token
     * @param expiresIn - Token expiration in seconds
     */
    async saveTokens(token, refreshToken, expiresIn) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
        try {
            await chrome.storage.local.set({
                authToken: token,
                refreshToken: refreshToken,
                tokenExpiry: this.tokenExpiry.toISOString()
            });
            authLogger.info('Saved tokens to storage', {
                expiresIn,
                tokenExpiry: this.tokenExpiry.toISOString()
            });
            this.scheduleRefresh();
        }
        catch (error) {
            authLogger.error('Error saving tokens', error);
        }
    }
    /**
     * Check if token is valid
     * @returns Whether token is valid
     */
    isTokenValid() {
        return !!this.token && !!this.tokenExpiry && this.tokenExpiry > new Date(Date.now() + 60000);
    }
    /**
     * Schedule token refresh
     */
    scheduleRefresh() {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
        if (!this.tokenExpiry)
            return;
        const refreshTime = this.tokenExpiry.getTime() - Date.now() - 60000; // 1 minute before expiry
        if (refreshTime > 0) {
            this.refreshTimeout = window.setTimeout(() => this.refreshTokens(), refreshTime);
            authLogger.debug(`Scheduled token refresh in ${refreshTime}ms`);
        }
        else {
            this.refreshTokens();
        }
    }
    /**
     * Refresh tokens
     * @returns Whether refresh was successful
     */
    async refreshTokens() {
        if (!this.refreshToken) {
            this.authState = 'error';
            authLogger.warn('Cannot refresh tokens: No refresh token');
            return false;
        }
        try {
            // For development/testing, use a fake token if the relay server is not available
            if (this.relayUrl.includes('localhost')) {
                authLogger.info('Using development mode with fake token refresh');
                // Create a fake token that will work with the test WebSocket server
                const fakeToken = 'test-token-' + Date.now();
                const fakeRefreshToken = 'refresh-' + Date.now();
                const fakeExpiresIn = 3600; // 1 hour
                await this.saveTokens(fakeToken, fakeRefreshToken, fakeExpiresIn);
                this.authState = 'authenticated';
                return true;
            }
            // Normal token refresh flow for production
            const response = await fetch(`${this.relayUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });
            if (!response.ok) {
                throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            await this.saveTokens(data.token, data.refreshToken, data.expiresIn);
            this.authState = 'authenticated';
            authLogger.info('Token refresh successful');
            return true;
        }
        catch (error) {
            authLogger.error('Token refresh failed', error);
            // For development/testing, use a fake token if the relay server is not available
            if (this.relayUrl.includes('localhost')) {
                authLogger.info('Token refresh failed, but using development mode with fake token refresh');
                // Create a fake token that will work with the test WebSocket server
                const fakeToken = 'test-token-' + Date.now();
                const fakeRefreshToken = 'refresh-' + Date.now();
                const fakeExpiresIn = 3600; // 1 hour
                await this.saveTokens(fakeToken, fakeRefreshToken, fakeExpiresIn);
                this.authState = 'authenticated';
                return true;
            }
            this.authState = 'error';
            return false;
        }
    }
    /**
     * Authenticate
     * @returns Whether authentication was successful
     */
    async authenticate() {
        this.authState = 'connecting';
        authLogger.info('Starting authentication process');
        try {
            // For development/testing, use a fake token if the relay server is not available
            if (this.relayUrl.includes('localhost')) {
                authLogger.info('Using development mode with fake authentication token');
                // Create a fake token that will work with the test WebSocket server
                const fakeToken = 'test-token-' + Date.now();
                const fakeRefreshToken = 'refresh-' + Date.now();
                const fakeExpiresIn = 3600; // 1 hour
                await this.saveTokens(fakeToken, fakeRefreshToken, fakeExpiresIn);
                this.authState = 'authenticated';
                return true;
            }
            // Normal authentication flow for production
            const response = await fetch(`${this.relayUrl}/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            await this.saveTokens(data.token, data.refreshToken, data.expiresIn);
            this.authState = 'authenticated';
            authLogger.info('Authentication successful');
            return true;
        }
        catch (error) {
            authLogger.error('Authentication failed', error);
            // For development/testing, use a fake token if the relay server is not available
            if (this.relayUrl.includes('localhost')) {
                authLogger.info('Authentication failed, but using development mode with fake authentication token');
                // Create a fake token that will work with the test WebSocket server
                const fakeToken = 'test-token-' + Date.now();
                const fakeRefreshToken = 'refresh-' + Date.now();
                const fakeExpiresIn = 3600; // 1 hour
                await this.saveTokens(fakeToken, fakeRefreshToken, fakeExpiresIn);
                this.authState = 'authenticated';
                return true;
            }
            this.authState = 'error';
            return false;
        }
    }
    /**
     * Get authentication header
     * @returns Authentication header
     */
    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }
    /**
     * Get authentication state
     * @returns Authentication state
     */
    getAuthState() {
        return this.authState;
    }
    /**
     * Clear authentication
     */
    async clearAuth() {
        this.token = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
        this.authState = 'disconnected';
        try {
            await chrome.storage.local.remove(['authToken', 'refreshToken', 'tokenExpiry']);
            authLogger.info('Authentication cleared');
        }
        catch (error) {
            authLogger.error('Error clearing authentication', error);
        }
    }
    /**
     * Get token expiry
     * @returns Token expiry date or null if no token
     */
    getTokenExpiry() {
        return this.tokenExpiry;
    }
    /**
     * Set relay URL
     * @param url - Relay URL
     */
    setRelayUrl(url) {
        this.relayUrl = url;
        authLogger.info(`Relay URL updated: ${url}`);
    }
}
//# sourceMappingURL=auth-manager.js.map