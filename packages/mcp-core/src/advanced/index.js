"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedMCPSuite = exports.MCPIntegrationLayer = exports.PluginEcosystemManager = exports.MonitoringAnalyticsEngine = exports.RealtimeCommunicationHub = exports.SecurityFramework = exports.AdvancedBrowserAutomation = exports.MCPOrchestrator = void 0;
// Advanced MCP Capabilities Export
var MCPOrchestrator_1 = require("./MCPOrchestrator");
Object.defineProperty(exports, "MCPOrchestrator", { enumerable: true, get: function () { return MCPOrchestrator_1.MCPOrchestrator; } });
var AdvancedBrowserAutomation_1 = require("./AdvancedBrowserAutomation");
Object.defineProperty(exports, "AdvancedBrowserAutomation", { enumerable: true, get: function () { return AdvancedBrowserAutomation_1.AdvancedBrowserAutomation; } });
var SecurityFramework_1 = require("./SecurityFramework");
Object.defineProperty(exports, "SecurityFramework", { enumerable: true, get: function () { return SecurityFramework_1.SecurityFramework; } });
var RealtimeCommunication_1 = require("./RealtimeCommunication");
Object.defineProperty(exports, "RealtimeCommunicationHub", { enumerable: true, get: function () { return RealtimeCommunication_1.RealtimeCommunicationHub; } });
var MonitoringAnalytics_1 = require("./MonitoringAnalytics");
Object.defineProperty(exports, "MonitoringAnalyticsEngine", { enumerable: true, get: function () { return MonitoringAnalytics_1.MonitoringAnalyticsEngine; } });
var PluginEcosystem_1 = require("./PluginEcosystem");
Object.defineProperty(exports, "PluginEcosystemManager", { enumerable: true, get: function () { return PluginEcosystem_1.PluginEcosystemManager; } });
var MCPIntegrationLayer_1 = require("./MCPIntegrationLayer");
Object.defineProperty(exports, "MCPIntegrationLayer", { enumerable: true, get: function () { return MCPIntegrationLayer_1.MCPIntegrationLayer; } });
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
class AdvancedMCPSuite {
    orchestrator;
    browserAutomation;
    security;
    communication;
    monitoring;
    plugins;
    constructor() {
        // Initialize components as needed
    }
    /**
     * Initialize all advanced MCP capabilities
     */
    async initialize(config) {
        const { MCPOrchestrator } = await import('./MCPOrchestrator');
        const { AdvancedBrowserAutomation } = await import('./AdvancedBrowserAutomation');
        const { SecurityFramework } = await import('./SecurityFramework');
        const { RealtimeCommunicationHub } = await import('./RealtimeCommunication');
        const { MonitoringAnalyticsEngine } = await import('./MonitoringAnalytics');
        const { PluginEcosystemManager } = await import('./PluginEcosystem');
        // Initialize orchestrator
        if (config.orchestrator) {
            // Create a mock broker for the orchestrator
            const mockBroker = {
                registerService: async (service) => Promise.resolve(),
                unregisterService: async (serviceId) => Promise.resolve(),
                discoverServices: async () => Promise.resolve([]),
                sendRequest: async (request) => Promise.resolve({ success: true }),
                subscribe: async (topic, callback) => Promise.resolve(),
                unsubscribe: async (topic) => Promise.resolve()
            };
            this.orchestrator = new MCPOrchestrator(mockBroker, config.orchestrator);
            // Note: MCPOrchestrator doesn't have an initialize method, initialization happens in constructor
        }
        // Initialize browser automation
        if (config.browserAutomation) {
            this.browserAutomation = new AdvancedBrowserAutomation();
            await this.browserAutomation.initialize();
        }
        // Initialize security framework
        if (config.security) {
            this.security = new SecurityFramework(config.security);
            await this.security.initialize();
        }
        // Initialize communication hub
        if (config.communication) {
            this.communication = new RealtimeCommunicationHub(config.communication.port);
            await this.communication.start();
        }
        // Initialize monitoring
        if (config.monitoring) {
            this.monitoring = new MonitoringAnalyticsEngine();
            await this.monitoring.startMonitoring(config.monitoring.interval);
        }
        // Initialize plugin ecosystem
        if (config.plugins) {
            this.plugins = new PluginEcosystemManager(config.plugins.storageRoot);
            await this.plugins.initialize();
        }
    }
    /**
     * Get orchestrator instance
     */
    getOrchestrator() {
        return this.orchestrator;
    }
    /**
     * Get browser automation instance
     */
    getBrowserAutomation() {
        return this.browserAutomation;
    }
    /**
     * Get security framework instance
     */
    getSecurity() {
        return this.security;
    }
    /**
     * Get communication hub instance
     */
    getCommunication() {
        return this.communication;
    }
    /**
     * Get monitoring engine instance
     */
    getMonitoring() {
        return this.monitoring;
    }
    /**
     * Get plugin ecosystem instance
     */
    getPlugins() {
        return this.plugins;
    }
    /**
     * Shutdown all components
     */
    async shutdown() {
        if (this.communication) {
            await this.communication.stop();
        }
        if (this.monitoring) {
            await this.monitoring.stopMonitoring();
        }
        if (this.browserAutomation) {
            await this.browserAutomation.cleanup();
        }
        if (this.orchestrator) {
            await this.orchestrator.shutdown();
        }
    }
}
exports.AdvancedMCPSuite = AdvancedMCPSuite;
exports.default = AdvancedMCPSuite;
//# sourceMappingURL=index.js.map