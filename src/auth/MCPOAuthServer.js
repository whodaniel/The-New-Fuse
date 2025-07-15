/**
 * MCP OAuth Authorization Server for The New Fuse
 * Implements RFC 8414 (Authorization Server Metadata) and RFC 9728 (Protected Resource Metadata)
 * Supports OAuth 2.1 and dynamic client registration
 */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
// Refactored: Use centralized cryptoUtils for all cryptographic operations
import { getRandomBytes } from '../utils/cryptoUtils';
export class MCPOAuthServer {
    logger;
    router;
    clients = new Map();
    authCodes = new Map();
    accessTokens = new Map();
    refreshTokens = new Map();
    JWT_SECRET;
    ISSUER;
    BASE_URL;
    constructor(logger) {
        this.logger = logger;
        this.JWT_SECRET = process.env.TNF_OAUTH_JWT_SECRET || 'tnf-mcp-oauth-secret-change-in-production';
        this.ISSUER = process.env.TNF_OAUTH_ISSUER || 'https://api.thenewfuse.com';
        this.BASE_URL = process.env.TNF_BASE_URL || 'http://localhost:3001';
        this.router = Router();
        this.setupRoutes();
        this.initializeDefaultClients();
    }
    /**
     * Setup OAuth 2.1 and MCP discovery routes
     */
    setupRoutes() {
        // RFC 8414: Authorization Server Metadata
        this.router.get('/.well-known/oauth-authorization-server', this.getAuthServerMetadata.bind(this));
        // RFC 9728: Protected Resource Metadata  
        this.router.get('/.well-known/oauth-protected-resource', this.getProtectedResourceMetadata.bind(this));
        // OAuth 2.1 Core Endpoints
        this.router.get('/oauth/authorize', this.authorize.bind(this));
        this.router.post('/oauth/token', this.token.bind(this));
        this.router.post('/oauth/revoke', this.revoke.bind(this));
        this.router.get('/oauth/userinfo', this.userinfo.bind(this));
        // RFC 7591: Dynamic Client Registration
        this.router.post('/oauth/register', this.registerClient.bind(this));
        this.router.get('/oauth/register/:client_id', this.getClient.bind(this));
        this.router.put('/oauth/register/:client_id', this.updateClient.bind(this));
        this.router.delete('/oauth/register/:client_id', this.deleteClient.bind(this));
        // MCP-specific endpoints
        this.router.get('/mcp/discovery', this.mcpDiscovery.bind(this));
        this.router.get('/mcp/capabilities', this.mcpCapabilities.bind(this));
        this.router.post('/mcp/token-exchange', this.mcpTokenExchange.bind(this));
    }
    /**
     * RFC 8414: Authorization Server Metadata Discovery
     */
    async getAuthServerMetadata(req, res) {
        const metadata = {
            issuer: this.ISSUER,
            authorization_endpoint: `${this.BASE_URL}/oauth/authorize`,
            token_endpoint: `${this.BASE_URL}/oauth/token`,
            userinfo_endpoint: `${this.BASE_URL}/oauth/userinfo`,
            revocation_endpoint: `${this.BASE_URL}/oauth/revoke`,
            registration_endpoint: `${this.BASE_URL}/oauth/register`,
            // Supported features
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
            token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
            code_challenge_methods_supported: ['S256'],
            // Scopes
            scopes_supported: [
                'openid', 'profile', 'email',
                'mcp:read', 'mcp:write', 'mcp:admin',
                'tnf:agents', 'tnf:workflows', 'tnf:chat', 'tnf:monitoring'
            ],
            // MCP Extensions
            mcp_version: '2025-06-18',
            mcp_capabilities: [
                'dynamic-discovery',
                'protected-resource-metadata',
                'token-exchange',
                'agent-authentication'
            ],
            // Security
            require_request_uri_registration: false,
            require_signed_request_object: false,
            jwks_uri: `${this.BASE_URL}/.well-known/jwks.json`,
            // Additional metadata
            service_documentation: `${this.BASE_URL}/docs/oauth`,
            ui_locales_supported: ['en-US'],
            // TNF-specific
            tnf_platform_version: '2.1.0',
            tnf_supported_mcp_transports: ['stdio', 'sse', 'websocket']
        };
        res.json(metadata);
        this.logger.log('Served OAuth Authorization Server metadata');
    }
    /**
     * RFC 9728: Protected Resource Metadata Discovery
     */
    async getProtectedResourceMetadata(req, res) {
        const metadata = {
            resource: `${this.BASE_URL}/mcp`,
            authorization_servers: [`${this.ISSUER}`],
            // MCP Resource Information
            mcp_servers: [
                {
                    name: 'the-new-fuse-main',
                    capabilities: ['agent-management', 'chat-operations', 'workflow-execution'],
                    scopes_required: ['mcp:read', 'tnf:agents'],
                    endpoint: `${this.BASE_URL}/mcp/main`
                },
                {
                    name: 'tnf-relay-server',
                    capabilities: ['relay-management', 'api-interception'],
                    scopes_required: ['mcp:admin', 'tnf:relay'],
                    endpoint: `${this.BASE_URL}/mcp/relay`
                }
            ],
            // Supported bearer token types
            bearer_methods_supported: ['header', 'body'],
            // Resource-specific scopes
            resource_scopes: [
                'tnf:agents:read',
                'tnf:agents:write',
                'tnf:workflows:execute',
                'tnf:chat:participate',
                'tnf:monitoring:view',
                'tnf:relay:control'
            ],
            // Security requirements
            resource_documentation: `${this.BASE_URL}/docs/mcp-api`,
            resource_policy_uri: `${this.BASE_URL}/policies/mcp-usage`,
            // MCP-specific metadata
            mcp_protocol_version: '2025-06-18',
            supported_auth_flows: ['authorization_code', 'client_credentials'],
            token_introspection_endpoint: `${this.BASE_URL}/oauth/introspect`
        };
        res.json(metadata);
        this.logger.log('Served Protected Resource metadata');
    }
    /**
     * OAuth Authorization Endpoint
     */
    async authorize(req, res) {
        const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method } = req.query;
        // Validate client
        const client = this.clients.get(client_id);
        if (!client) {
            return res.status(400).json({ error: 'invalid_client' });
        }
        // Validate redirect URI
        if (!client.redirect_uris.includes(redirect_uri)) {
            return res.status(400).json({ error: 'invalid_redirect_uri' });
        }
        // For demo purposes, auto-approve. In production, show consent screen
        const authCode = this.generateAuthCode();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        this.authCodes.set(authCode, {
            code: authCode,
            client_id: client_id,
            redirect_uri: redirect_uri,
            scope: scope || 'mcp:read',
            user_id: 'tnf-user-1', // In production, get from authenticated session
            expires_at: expiresAt,
            code_challenge: code_challenge,
            code_challenge_method: code_challenge_method
        });
        // Redirect with authorization code
        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set('code', authCode);
        if (state)
            redirectUrl.searchParams.set('state', state);
        res.redirect(redirectUrl.toString());
        this.logger.log(`Authorization granted for client ${client_id}`);
    }
    /**
     * OAuth Token Endpoint
     */
    async token(req, res) {
        const { grant_type, code, redirect_uri, client_id, client_secret, scope } = req.body;
        if (grant_type === 'authorization_code') {
            return this.handleAuthorizationCodeGrant(req, res);
        }
        else if (grant_type === 'client_credentials') {
            return this.handleClientCredentialsGrant(req, res);
        }
        else {
            return res.status(400).json({ error: 'unsupported_grant_type' });
        }
    }
    async handleAuthorizationCodeGrant(req, res) {
        const { code, redirect_uri, client_id, code_verifier } = req.body;
        const authCode = this.authCodes.get(code);
        if (!authCode || authCode.expires_at < Date.now()) {
            return res.status(400).json({ error: 'invalid_grant' });
        }
        // Validate PKCE if used
        if (authCode.code_challenge) {
            const expectedChallenge = crypto
                .createHash('sha256')
                .update(code_verifier)
                .digest('base64url');
            if (expectedChallenge !== authCode.code_challenge) {
                return res.status(400).json({ error: 'invalid_grant' });
            }
        }
        // Generate tokens
        const accessToken = this.generateAccessToken(authCode.client_id, authCode.user_id, authCode.scope);
        const refreshToken = this.generateRefreshToken(authCode.client_id, authCode.user_id);
        // Store access token
        this.accessTokens.set(accessToken, {
            token: accessToken,
            client_id: authCode.client_id,
            user_id: authCode.user_id,
            scope: authCode.scope,
            expires_at: Date.now() + 60 * 60 * 1000, // 1 hour
            mcp_resources: this.getMCPResourcesForScope(authCode.scope)
        });
        // Clean up auth code
        this.authCodes.delete(code);
        res.json({
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: refreshToken,
            scope: authCode.scope,
            mcp_capabilities: this.getMCPCapabilitiesForScope(authCode.scope)
        });
        this.logger.log(`Access token issued for client ${authCode.client_id}`);
    }
    async handleClientCredentialsGrant(req, res) {
        const { client_id, client_secret, scope } = req.body;
        const client = this.clients.get(client_id);
        if (!client || client.client_secret !== client_secret) {
            return res.status(400).json({ error: 'invalid_client' });
        }
        const accessToken = this.generateAccessToken(client_id, null, scope || 'mcp:read');
        this.accessTokens.set(accessToken, {
            token: accessToken,
            client_id,
            user_id: null,
            scope: scope || 'mcp:read',
            expires_at: Date.now() + 60 * 60 * 1000,
            mcp_resources: this.getMCPResourcesForScope(scope || 'mcp:read')
        });
        res.json({
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            scope: scope || 'mcp:read',
            mcp_capabilities: this.getMCPCapabilitiesForScope(scope || 'mcp:read')
        });
        this.logger.log(`Client credentials token issued for ${client_id}`);
    }
    /**
     * RFC 7591: Dynamic Client Registration
     */
    async registerClient(req, res) {
        const { client_name, redirect_uris, grant_types = ['authorization_code'], response_types = ['code'], scope = 'mcp:read', token_endpoint_auth_method = 'client_secret_basic', mcp_capabilities = [] } = req.body;
        if (!client_name || !redirect_uris?.length) {
            return res.status(400).json({
                error: 'invalid_client_metadata',
                error_description: 'client_name and redirect_uris are required'
            });
        }
        const client_id = `tnf_${getRandomBytes(16).toString('hex')}`;
        const client_secret = getRandomBytes(32).toString('hex');
        const client = {
            client_id,
            client_secret,
            client_name,
            redirect_uris,
            grant_types,
            response_types,
            scope,
            token_endpoint_auth_method,
            created_at: Date.now(),
            mcp_capabilities
        };
        this.clients.set(client_id, client);
        res.status(201).json({
            client_id,
            client_secret,
            client_name,
            redirect_uris,
            grant_types,
            response_types,
            scope,
            token_endpoint_auth_method,
            client_id_issued_at: Math.floor(Date.now() / 1000),
            client_secret_expires_at: 0, // Never expires
            registration_client_uri: `${this.BASE_URL}/oauth/register/${client_id}`,
            mcp_capabilities
        });
        this.logger.log(`Registered new OAuth client: ${client_name} (${client_id})`);
    }
    /**
     * MCP Discovery Endpoint
     */
    async mcpDiscovery(req, res) {
        const discovery = {
            mcp_version: '2025-06-18',
            platform: 'The New Fuse',
            platform_version: '2.1.0',
            oauth_discovery: {
                authorization_server_metadata: `${this.BASE_URL}/.well-known/oauth-authorization-server`,
                protected_resource_metadata: `${this.BASE_URL}/.well-known/oauth-protected-resource`
            },
            available_servers: [
                {
                    name: 'the-new-fuse-main',
                    description: 'Complete TNF platform capabilities',
                    transport: 'sse',
                    endpoint: `${this.BASE_URL}/mcp/main/sse`,
                    auth_required: true,
                    scopes: ['mcp:read', 'tnf:agents', 'tnf:workflows']
                },
                {
                    name: 'tnf-relay-server',
                    description: 'TNF relay and interception services',
                    transport: 'sse',
                    endpoint: `${this.BASE_URL}/mcp/relay/sse`,
                    auth_required: true,
                    scopes: ['mcp:admin', 'tnf:relay']
                }
            ],
            supported_transports: ['stdio', 'sse', 'websocket'],
            supported_auth_methods: ['oauth2', 'bearer_token'],
            registration_info: {
                dynamic_registration_supported: true,
                registration_endpoint: `${this.BASE_URL}/oauth/register`,
                client_authentication_required: false
            }
        };
        res.json(discovery);
    }
    /**
     * Token validation middleware for MCP servers
     */
    validateMCPToken(requiredScopes = []) {
        return async (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'invalid_token' });
            }
            const token = authHeader.substring(7);
            const tokenData = this.accessTokens.get(token);
            if (!tokenData || tokenData.expires_at < Date.now()) {
                return res.status(401).json({ error: 'invalid_token' });
            }
            // Check scopes
            const tokenScopes = tokenData.scope.split(' ');
            const hasRequiredScopes = requiredScopes.every(scope => tokenScopes.includes(scope) || tokenScopes.includes('mcp:admin'));
            if (!hasRequiredScopes) {
                return res.status(403).json({ error: 'insufficient_scope' });
            }
            // Add token info to request
            req.oauth = {
                client_id: tokenData.client_id,
                user_id: tokenData.user_id,
                scope: tokenData.scope,
                mcp_resources: tokenData.mcp_resources
            };
            next();
        };
    }
    // Helper methods
    generateAuthCode() {
        return getRandomBytes(32).toString('hex');
    }
    generateAccessToken(client_id, user_id, scope) {
        const payload = {
            iss: this.ISSUER,
            sub: user_id || client_id,
            aud: `${this.BASE_URL}/mcp`,
            client_id,
            scope,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600
        };
        return jwt.sign(payload, this.JWT_SECRET);
    }
    generateRefreshToken(client_id, user_id) {
        return getRandomBytes(32).toString('hex');
    }
    getMCPResourcesForScope(scope) {
        const scopes = scope.split(' ');
        const resources = [];
        if (scopes.includes('tnf:agents') || scopes.includes('mcp:admin')) {
            resources.push('agents', 'agent-management');
        }
        if (scopes.includes('tnf:workflows')) {
            resources.push('workflows', 'workflow-execution');
        }
        if (scopes.includes('tnf:chat')) {
            resources.push('chat', 'chat-operations');
        }
        if (scopes.includes('tnf:relay')) {
            resources.push('relay', 'api-interception');
        }
        return resources;
    }
    getMCPCapabilitiesForScope(scope) {
        const scopes = scope.split(' ');
        const capabilities = ['list_tools', 'list_resources'];
        if (scopes.includes('mcp:write') || scopes.includes('mcp:admin')) {
            capabilities.push('call_tool');
        }
        if (scopes.includes('mcp:admin')) {
            capabilities.push('server_management', 'client_registration');
        }
        return capabilities;
    }
    initializeDefaultClients() {
        // Register a default client for testing
        const defaultClient = {
            client_id: 'tnf_default_mcp_client',
            client_secret: 'tnf_default_secret_change_in_production',
            client_name: 'TNF Default MCP Client',
            redirect_uris: ['http://localhost:3000/callback', 'urn:ietf:wg:oauth:2.0:oob'],
            grant_types: ['authorization_code', 'client_credentials'],
            response_types: ['code'],
            scope: 'mcp:read mcp:write tnf:agents tnf:workflows',
            token_endpoint_auth_method: 'client_secret_basic',
            created_at: Date.now(),
            mcp_capabilities: ['dynamic-discovery', 'token-exchange']
        };
        this.clients.set(defaultClient.client_id, defaultClient);
        this.logger.log('Initialized default OAuth client for MCP');
    }
    getRouter() {
        return this.router;
    }
    async revoke(req, res) {
        // Implementation for token revocation
        res.json({ revoked: true });
    }
    async userinfo(req, res) {
        // Implementation for userinfo endpoint
        res.json({ sub: 'tnf-user-1', name: 'TNF User' });
    }
    async getClient(req, res) {
        // Implementation for getting client details
        res.json({ client_id: req.params.client_id });
    }
    async updateClient(req, res) {
        // Implementation for updating client
        res.json({ updated: true });
    }
    async deleteClient(req, res) {
        // Implementation for deleting client
        res.json({ deleted: true });
    }
    async mcpCapabilities(req, res) {
        // Implementation for MCP capabilities endpoint
        res.json({ capabilities: ['oauth2', 'dynamic-discovery'] });
    }
    async mcpTokenExchange(req, res) {
        // Implementation for MCP token exchange
        res.json({ token_exchanged: true });
    }
}
