export { MCPOrchestrator } from './MCPOrchestrator';
export { AdvancedBrowserAutomation } from './AdvancedBrowserAutomation';
export { SecurityFramework } from './SecurityFramework';
export { RealtimeCommunicationHub } from './RealtimeCommunication';
export { MonitoringAnalyticsEngine } from './MonitoringAnalytics';
export { PluginEcosystemManager } from './PluginEcosystem';
export { MCPIntegrationLayer } from './MCPIntegrationLayer';
export type { AgentCapability, TaskDistributionStrategy, CollaborationSession } from './MCPOrchestrator';
export type { BrowserSession, ElementSelector, AutomationStep } from './AdvancedBrowserAutomation';
export type { SecurityConfig, AuthenticationResult, EncryptionResult } from './SecurityFramework';
export type { AgentMessage, AgentConnection, CommunicationChannel, MessageFilter } from './RealtimeCommunication';
export type { AgentMetrics, SystemMetrics, Alert, PerformanceThreshold, AnalyticsQuery, AnalyticsResult } from './MonitoringAnalytics';
export type { PluginManifest, PluginPermission, PluginContext, PluginAPI, PluginStatus } from './PluginEcosystem';
export type { MCPIntegrationConfig, MCPCapabilityStatus } from './MCPIntegrationLayer';
/**
 * Advanced MCP Capabilities Suite
 *
 * This module provides a comprehensive set of advanced capabilities for
 * The New Fuse MCP system, including:
 *
 * - MCPOrchestrator: Multi-agent coordination and task distribution
 * - AdvancedBrowserAutomation: CDP-based browser automation with AI
 * - SecurityFramework: Comprehensive security for agent interactions
 * - RealtimeCommunicationHub: WebSocket-based real-time messaging
 * - MonitoringAnalyticsEngine: Performance monitoring and analytics
 * - PluginEcosystemManager: Extensible plugin system
 */
export declare class AdvancedMCPSuite {
    private orchestrator?;
    private browserAutomation?;
    private security?;
    private communication?;
    private monitoring?;
    private plugins?;
    constructor();
    /**
     * Initialize all advanced MCP capabilities
     */
    initialize(config: {
        orchestrator?: any;
        browserAutomation?: any;
        security?: any;
        communication?: any;
        monitoring?: any;
        plugins?: any;
    }): Promise<void>;
    /**
     * Get orchestrator instance
     */
    getOrchestrator(): any;
    /**
     * Get browser automation instance
     */
    getBrowserAutomation(): any;
    /**
     * Get security framework instance
     */
    getSecurity(): any;
    /**
     * Get communication hub instance
     */
    getCommunication(): any;
    /**
     * Get monitoring engine instance
     */
    getMonitoring(): any;
    /**
     * Get plugin ecosystem instance
     */
    getPlugins(): any;
    /**
     * Shutdown all components
     */
    shutdown(): Promise<void>;
}
export default AdvancedMCPSuite;
//# sourceMappingURL=index.d.ts.map