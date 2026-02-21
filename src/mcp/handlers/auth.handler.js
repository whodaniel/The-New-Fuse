"use strict";
/**
 * Authentication handler for MCP server
 * Handles login, registration, logout, and token management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthHandler = void 0;
const base_handler_1 = require("./base.handler");
class AuthHandler extends base_handler_1.BaseHandler {
    getTools() {
        return [
            {
                name: 'auth_login',
                description: 'Login with email and password to get authentication token',
                inputSchema: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', description: 'User email address' },
                        password: { type: 'string', description: 'User password' },
                    },
                    required: ['email', 'password'],
                },
            },
            {
                name: 'auth_register',
                description: 'Register a new user account',
                inputSchema: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', description: 'User email address' },
                        password: { type: 'string', description: 'User password (min 6 characters)' },
                        name: { type: 'string', description: 'User full name' },
                    },
                    required: ['email', 'password', 'name'],
                },
            },
            {
                name: 'auth_refresh',
                description: 'Refresh authentication token using refresh token',
                inputSchema: {
                    type: 'object',
                    properties: {
                        refreshToken: { type: 'string', description: 'Refresh token from login response' },
                    },
                    required: ['refreshToken'],
                },
            },
            {
                name: 'auth_logout',
                description: 'Logout current user and invalidate token',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'auth_set_credentials',
                description: 'Set authentication credentials for subsequent API calls',
                inputSchema: {
                    type: 'object',
                    properties: {
                        token: { type: 'string', description: 'JWT authentication token' },
                        apiKey: { type: 'string', description: 'API key for service-to-service auth (optional)' },
                    },
                    required: ['token'],
                },
            },
        ];
    }
    getToolPrefix() {
        return 'auth';
    }
    async handleTool(toolName, args) {
        switch (toolName) {
            case 'auth_login':
                return this.handleLogin(args);
            case 'auth_register':
                return this.handleRegister(args);
            case 'auth_refresh':
                return this.handleRefresh(args);
            case 'auth_logout':
                return this.handleLogout();
            case 'auth_set_credentials':
                return this.handleSetCredentials(args);
            default:
                throw new Error(`Unknown auth tool: ${toolName}`);
        }
    }
    async handleLogin(args) {
        try {
            const response = await this.apiClient.post('/auth/login', {
                email: args.email,
                password: args.password,
            });
            // Store authentication context
            if (response.token || response.access_token) {
                this.apiClient.setAuthContext({
                    token: response.token || response.access_token,
                    userId: response.user?.id,
                    role: response.user?.role,
                });
            }
            return {
                content: [{
                        type: 'text',
                        text: `✅ Login successful!\n\nUser: ${response.user?.email}\nRole: ${response.user?.role}\nToken stored for subsequent requests.\n\n${JSON.stringify(response, null, 2)}`,
                    }],
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `❌ Login failed: ${error.message}`,
                    }],
                isError: true,
            };
        }
    }
    async handleRegister(args) {
        try {
            const response = await this.apiClient.post('/auth/register', {
                email: args.email,
                password: args.password,
                name: args.name,
            });
            return {
                content: [{
                        type: 'text',
                        text: `✅ Registration successful!\n\nUser created: ${response.user?.email}\nPlease use auth_login to authenticate.\n\n${JSON.stringify(response, null, 2)}`,
                    }],
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `❌ Registration failed: ${error.message}`,
                    }],
                isError: true,
            };
        }
    }
    async handleRefresh(args) {
        try {
            const response = await this.apiClient.post('/auth/refresh', {
                refreshToken: args.refreshToken,
            });
            if (response.token || response.access_token) {
                this.apiClient.setAuthContext({
                    token: response.token || response.access_token,
                });
            }
            return {
                content: [{
                        type: 'text',
                        text: `✅ Token refreshed successfully!\n\n${JSON.stringify(response, null, 2)}`,
                    }],
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `❌ Token refresh failed: ${error.message}`,
                    }],
                isError: true,
            };
        }
    }
    async handleLogout() {
        try {
            await this.apiClient.post('/auth/logout');
        }
        catch (error) {
            // Log error but don't fail the logout
            console.warn('Logout API failed:', error.message);
        }
        // Clear authentication context
        this.apiClient.setAuthContext({});
        return {
            content: [{
                    type: 'text',
                    text: '✅ Logout successful. Authentication context cleared.',
                }],
        };
    }
    handleSetCredentials(args) {
        this.apiClient.setAuthContext({
            token: args.token,
            apiKey: args.apiKey,
        });
        return {
            content: [{
                    type: 'text',
                    text: '✅ Authentication credentials set successfully.',
                }],
        };
    }
}
exports.AuthHandler = AuthHandler;
//# sourceMappingURL=auth.handler.js.map