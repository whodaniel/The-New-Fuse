#!/usr/bin/env node
/**
 * Enhanced MCP Configuration Manager Server
 * Integrates with TNF OAuth system and modern MCP protocol
 *
 * Features:
 * - OAuth 2.1 authentication and authorization
 * - MCP protocol 2025-06-18 compliance
 * - Advanced configuration validation
 * - Server health monitoring and discovery
 * - Backup/restore capabilities
 * - Configuration templates and presets
 * - Integration with TNF MCP discovery system
 */
declare class EnhancedMCPConfigManager {
    private server;
    private logger;
    private configCache;
    private healthChecks;
    private oauthClient;
    constructor();
    private setupTools;
    private setupResources;
    private initializeDefaultTemplates;
    private listMCPServers;
    private addMCPServer;
    private removeMCPServer;
    private validateConfiguration;
    private getConfigPath;
    private readConfigFile;
    private writeConfigFile;
    private createEmptyConfig;
    private expandPath;
    private validateServerConfig;
    private isCommandInPath;
    private performSingleHealthCheck;
    private startHealthMonitoring;
    private stopHealthMonitoring;
    private validateOAuthClient;
    private backupConfiguration;
    private restoreConfiguration;
    private healthCheckServers;
    private discoverMCPServers;
    private applyTemplate;
    private generateOAuthClient;
    private getConfigurationTemplates;
    private getConfigurationSchemas;
    private getDiscoveryEndpoints;
    start(): Promise<void>;
}
export default EnhancedMCPConfigManager;
//# sourceMappingURL=enhanced-config-manager.d.ts.map