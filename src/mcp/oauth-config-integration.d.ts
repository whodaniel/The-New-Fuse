/**
 * OAuth Integration for Enhanced MCP Config Manager
 * Connects config manager with TNF OAuth Authorization Server
 */
import { MCPOAuthServer } from '../auth/MCPOAuthServer.js';
import express from 'express';
interface OAuthConfigManagerOptions {
    oauth_server_url?: string;
    required_scopes?: string[];
    admin_scopes?: string[];
    config_management_scopes?: string[];
    enable_discovery_protection?: boolean;
}
export declare class OAuthConfigIntegration {
    private logger;
    private oauthServer;
    private options;
    constructor(oauthServer: MCPOAuthServer, options?: OAuthConfigManagerOptions);
    /**
     * Create OAuth-protected endpoints for MCP config management
     */
    createProtectedEndpoints(): express.Router;
    /**
     * Validate tokens for configuration management operations
     */
    private validateConfigManagementToken;
    /**
     * Determine required scopes based on operation
     */
    private getRequiredScopesForOperation;
    /**
     * Enhanced configuration management with OAuth integration
     */
    generateSecureServerConfig(serverName: string, baseConfig: any, oauthInfo: any): Promise<any>;
    /**
     * Generate OAuth client for MCP server
     */
    private generateOAuthClientForServer;
    /**
     * Discovery integration with OAuth protection
     */
    getSecureDiscoveryInfo(oauthInfo: any): Promise<{
        oauth_integration: {
            enabled: boolean;
            authorization_server: string;
            client_id: any;
            authorized_scopes: any;
            authorized_resources: any;
            management_capabilities: string[];
        };
        security_features: {
            configuration_protection: boolean;
            oauth_required_for_changes: boolean;
            audit_logging: boolean;
            client_isolation: boolean;
        };
        service: string;
        version: string;
        mcp_protocol_version: string;
        capabilities: string[];
    }>;
    private getBaseDiscoveryInfo;
    private getManagementCapabilities;
    private handleListServers;
    private handleAddServer;
    private handleUpdateServer;
    private handleRemoveServer;
    private handleValidateConfig;
    private handleBackupConfig;
    private handleRestoreConfig;
    private handleListTemplates;
    private handleApplyTemplate;
    private handleDiscovery;
    private handleGenerateOAuthClient;
    private listServersWithOAuthInfo;
    private addServerWithOAuth;
}
export default OAuthConfigIntegration;
//# sourceMappingURL=oauth-config-integration.d.ts.map