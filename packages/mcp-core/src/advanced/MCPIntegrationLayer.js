"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPIntegrationLayer = void 0;
const events_1 = require("events");
const MCPOrchestrator_1 = require("./MCPOrchestrator");
const AdvancedBrowserAutomation_1 = require("./AdvancedBrowserAutomation");
const SecurityFramework_1 = require("./SecurityFramework");
const RealtimeCommunication_1 = require("./RealtimeCommunication");
const MonitoringAnalytics_1 = require("./MonitoringAnalytics");
const PluginEcosystem_1 = require("./PluginEcosystem");
/**
 * Integration layer for advanced MCP capabilities
 * Provides unified interface for managing all advanced features
 */
class MCPIntegrationLayer extends events_1.EventEmitter {
    orchestrator;
    browserAutomation;
    security;
    communication;
    monitoring;
    plugins;
    config;
    initialized = false;
    capabilities = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.initializeCapabilityStatus();
    }
    initializeCapabilityStatus() {
        const capabilityNames = [
            'orchestrator',
            'browserAutomation',
            'security',
            'communication',
            'monitoring',
            'plugins'
        ];
        capabilityNames.forEach(name => {
            this.capabilities.set(name, {
                name,
                enabled: this.config[name]?.enabled || false,
                status: 'disabled'
            });
        });
    }
    /**
     * Initialize all enabled capabilities
     */
    async initialize() {
        if (this.initialized) {
            throw new Error('MCPIntegrationLayer already initialized');
        }
        try {
            // Initialize orchestrator
            if (this.config.orchestrator?.enabled) {
                await this.initializeOrchestrator();
            }
            // Initialize browser automation
            if (this.config.browserAutomation?.enabled) {
                await this.initializeBrowserAutomation();
            }
            // Initialize security framework
            if (this.config.security?.enabled) {
                await this.initializeSecurity();
            }
            // Initialize communication hub
            if (this.config.communication?.enabled) {
                await this.initializeCommunication();
            }
            // Initialize monitoring
            if (this.config.monitoring?.enabled) {
                await this.initializeMonitoring();
            }
            // Initialize plugin ecosystem
            if (this.config.plugins?.enabled) {
                await this.initializePlugins();
            }
            this.initialized = true;
            this.emit('initialized');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async initializeOrchestrator() {
        try {
            this.updateCapabilityStatus('orchestrator', 'initializing');
            this.orchestrator = new MCPOrchestrator_1.MCPOrchestrator();
            await this.orchestrator.initialize();
            this.orchestrator.on('taskCompleted', (data) => {
                this.emit('orchestrator:taskCompleted', data);
            });
            this.orchestrator.on('agentRegistered', (data) => {
                this.emit('orchestrator:agentRegistered', data);
            });
            this.updateCapabilityStatus('orchestrator', 'active');
        }
        catch (error) {
            this.updateCapabilityStatus('orchestrator', 'error', error.message);
            throw error;
        }
    }
    async initializeBrowserAutomation() {
        try {
            this.updateCapabilityStatus('browserAutomation', 'initializing');
            this.browserAutomation = new AdvancedBrowserAutomation_1.AdvancedBrowserAutomation();
            await this.browserAutomation.initialize();
            this.browserAutomation.on('sessionCreated', (data) => {
                this.emit('browserAutomation:sessionCreated', data);
            });
            this.browserAutomation.on('automationCompleted', (data) => {
                this.emit('browserAutomation:automationCompleted', data);
            });
            this.updateCapabilityStatus('browserAutomation', 'active');
        }
        catch (error) {
            this.updateCapabilityStatus('browserAutomation', 'error', error.message);
            throw error;
        }
    }
    async initializeSecurity() {
        try {
            this.updateCapabilityStatus('security', 'initializing');
            this.security = new SecurityFramework_1.SecurityFramework({
                jwtSecret: this.config.security.jwtSecret,
                encryptionKey: this.config.security.encryptionKey,
                sessionTimeout: this.config.security.sessionTimeout
            });
            await this.security.initialize();
            this.security.on('authenticationAttempt', (data) => {
                this.emit('security:authenticationAttempt', data);
            });
            this.security.on('securityViolation', (data) => {
                this.emit('security:securityViolation', data);
            });
            this.updateCapabilityStatus('security', 'active');
        }
        catch (error) {
            this.updateCapabilityStatus('security', 'error', error.message);
            throw error;
        }
    }
    async initializeCommunication() {
        try {
            this.updateCapabilityStatus('communication', 'initializing');
            this.communication = new RealtimeCommunication_1.RealtimeCommunicationHub(this.config.communication.port);
            await this.communication.start();
            this.communication.on('agentConnected', (data) => {
                this.emit('communication:agentConnected', data);
            });
            this.communication.on('messageRouted', (data) => {
                this.emit('communication:messageRouted', data);
            });
            this.updateCapabilityStatus('communication', 'active');
        }
        catch (error) {
            this.updateCapabilityStatus('communication', 'error', error.message);
            throw error;
        }
    }
    async initializeMonitoring() {
        try {
            this.updateCapabilityStatus('monitoring', 'initializing');
            this.monitoring = new MonitoringAnalytics_1.MonitoringAnalyticsEngine();
            await this.monitoring.startMonitoring(this.config.monitoring.metricsInterval);
            this.monitoring.on('alertTriggered', (data) => {
                this.emit('monitoring:alertTriggered', data);
            });
            this.monitoring.on('metricsCollected', (data) => {
                this.emit('monitoring:metricsCollected', data);
            });
            this.updateCapabilityStatus('monitoring', 'active');
        }
        catch (error) {
            this.updateCapabilityStatus('monitoring', 'error', error.message);
            throw error;
        }
    }
    async initializePlugins() {
        try {
            this.updateCapabilityStatus('plugins', 'initializing');
            this.plugins = new PluginEcosystem_1.PluginEcosystemManager(this.config.plugins.storageRoot);
            await this.plugins.initialize();
            this.plugins.on('pluginLoaded', (data) => {
                this.emit('plugins:pluginLoaded', data);
            });
            this.plugins.on('pluginError', (data) => {
                this.emit('plugins:pluginError', data);
            });
            this.updateCapabilityStatus('plugins', 'active');
        }
        catch (error) {
            this.updateCapabilityStatus('plugins', 'error', error.message);
            throw error;
        }
    }
    updateCapabilityStatus(name, status, error) {
        const capability = this.capabilities.get(name);
        if (capability) {
            capability.status = status;
            capability.lastError = error;
            this.capabilities.set(name, capability);
            this.emit('capabilityStatusChanged', { name, status, error });
        }
    }
    /**
     * Get status of all capabilities
     */
    getCapabilityStatus() {
        return Array.from(this.capabilities.values());
    }
    /**
     * Get specific capability instance
     */
    getCapability(name) {
        switch (name) {
            case 'orchestrator':
                return this.orchestrator;
            case 'browserAutomation':
                return this.browserAutomation;
            case 'security':
                return this.security;
            case 'communication':
                return this.communication;
            case 'monitoring':
                return this.monitoring;
            case 'plugins':
                return this.plugins;
            default:
                return null;
        }
    }
    /**
     * Execute a cross-capability operation
     */
    async executeOperation(operation) {
        const results = {};
        for (const capabilityName of operation.capabilities) {
            const capability = this.getCapability(capabilityName);
            if (!capability) {
                throw new Error(`Capability ${capabilityName} not available`);
            }
            try {
                switch (operation.type) {
                    case 'healthCheck':
                        results[capabilityName] = await this.performHealthCheck(capability, capabilityName);
                        break;
                    case 'getMetrics':
                        results[capabilityName] = await this.getCapabilityMetrics(capability, capabilityName);
                        break;
                    default:
                        throw new Error(`Unknown operation type: ${operation.type}`);
                }
            }
            catch (error) {
                results[capabilityName] = { error: error.message };
            }
        }
        return results;
    }
    async performHealthCheck(capability, name) {
        // Implement health check logic for each capability
        return {
            status: 'healthy',
            timestamp: Date.now(),
            capability: name
        };
    }
    async getCapabilityMetrics(capability, name) {
        // Implement metrics collection for each capability
        return {
            name,
            timestamp: Date.now(),
            metrics: {}
        };
    }
    /**
     * Shutdown all capabilities
     */
    async shutdown() {
        if (!this.initialized) {
            return;
        }
        try {
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
            this.initialized = false;
            this.emit('shutdown');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Check if integration layer is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.MCPIntegrationLayer = MCPIntegrationLayer;
exports.default = MCPIntegrationLayer;
//# sourceMappingURL=MCPIntegrationLayer.js.map