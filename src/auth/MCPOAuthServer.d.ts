/**
 * MCP OAuth Authorization Server for The New Fuse
 * Implements RFC 8414 (Authorization Server Metadata) and RFC 9728 (Protected Resource Metadata)
 * Supports OAuth 2.1 and dynamic client registration
 */
import express, { Request, Response, Router } from 'express';
import { Logger } from '../common/logger.service.js';
export declare class MCPOAuthServer {
    private logger;
    private router;
    private clients;
    private authCodes;
    private accessTokens;
    private refreshTokens;
    private readonly JWT_SECRET;
    private readonly ISSUER;
    private readonly BASE_URL;
    constructor(logger: Logger);
    /**
     * Setup OAuth 2.1 and MCP discovery routes
     */
    private setupRoutes;
    /**
     * RFC 8414: Authorization Server Metadata Discovery
     */
    private getAuthServerMetadata;
    /**
     * RFC 9728: Protected Resource Metadata Discovery
     */
    private getProtectedResourceMetadata;
    /**
     * OAuth Authorization Endpoint
     */
    private authorize;
    /**
     * OAuth Token Endpoint
     */
    private token;
    private handleAuthorizationCodeGrant;
    private handleClientCredentialsGrant;
    /**
     * RFC 7591: Dynamic Client Registration
     */
    private registerClient;
    /**
     * MCP Discovery Endpoint
     */
    private mcpDiscovery;
    /**
     * Token validation middleware for MCP servers
     */
    validateMCPToken(requiredScopes?: string[]): (req: Request, res: Response, next: any) => Promise<express.Response<any, Record<string, any>> | undefined>;
    private generateAuthCode;
    private generateAccessToken;
    private generateRefreshToken;
    private getMCPResourcesForScope;
    private getMCPCapabilitiesForScope;
    private initializeDefaultClients;
    getRouter(): Router;
    private revoke;
    private userinfo;
    private getClient;
    private updateClient;
    private deleteClient;
    private mcpCapabilities;
    private mcpTokenExchange;
}
//# sourceMappingURL=MCPOAuthServer.d.ts.map