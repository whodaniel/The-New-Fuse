"use strict";
/**
 * Extension Manager - Central Extension Management System
 *
 * Provides high-level extension management, coordination with other services,
 * and integration with The New Fuse framework components
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionManager = void 0;
const events_1 = require("events");
const path = __importStar(require("path"));
// import { WorkflowEngineFactory } from '@the-new-fuse/workflow-engine';
const ExtensionTypes_js_1 = require("../types/ExtensionTypes.js");
const ExtensionLoader_js_1 = require("../loader/ExtensionLoader.js");
const ExtensionRegistry_js_1 = require("../registry/ExtensionRegistry.js");
const ExtensionValidator_js_1 = require("../validator/ExtensionValidator.js");
class ExtensionManager extends events_1.EventEmitter {
    constructor(config, logger, agentRegistry, workflowEngine) {
        super();
        // State management
        this.isInitialized = false;
        this.stats = this.createEmptyStats();
        this.config = config;
        this.logger = logger;
        this.agentRegistry = agentRegistry;
        this.workflowEngine = workflowEngine;
        // Initialize components
        this.loader = new ExtensionLoader_js_1.ExtensionLoader(this.createLoaderConfig(), logger);
        this.registry = new ExtensionRegistry_js_1.ExtensionRegistry(logger);
        this.validator = new ExtensionValidator_js_1.ExtensionValidator(logger);
        // Setup event forwarding
        this.setupEventHandlers();
    }
    /**
     * Initialize the extension manager
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        this.logger.info('🔌 Initializing Extension Manager...');
        this.startupTime = new Date();
        try {
            // Initialize components
            await this.registry.initialize();
            // Auto-discover and load extensions
            if (this.config.enableAutoUpdate) {
                await this.autoDiscoverAndLoad();
            }
            // Start periodic tasks
            this.startPeriodicTasks();
            this.isInitialized = true;
            this.logger.info('✅ Extension Manager initialized');
        }
        catch (error) {
            this.logger.error(`❌ Failed to initialize Extension Manager: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Auto-discover and load extensions
     */
    async autoDiscoverAndLoad() {
        this.logger.info('🔍 Auto-discovering extensions...');
        try {
            // Discover extensions
            const discoveryResult = await this.discoverExtensions();
            // Load discovered extensions
            for (const manifest of discoveryResult.found) {
                try {
                    const extensionPath = path.dirname(manifest.main);
                    await this.loadExtension(extensionPath, { skipValidation: false });
                }
                catch (error) {
                    this.logger.warn(`Failed to auto-load extension ${manifest.name}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Auto-discovery failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * ExtensionAPI Implementation
     */
    getExtension(id) {
        return this.loader.getExtension(id);
    }
    getAllExtensions() {
        return this.loader.getLoadedExtensions();
    }
    getExtensionsByType(type) {
        return this.getAllExtensions().filter(ext => ext.type === type);
    }
    getExtensionsByCategory(category) {
        return this.getAllExtensions().filter(ext => ext.category === category);
    }
    async loadExtension(path, options) {
        const result = await this.loader.loadExtension(path, options);
        if (result.success && result.extension) {
            // Register with registry
            await this.registry.registerExtension(result.extension);
            // Integrate with framework
            await this.integrateExtension(result.extension);
            // Update stats
            this.updateStats();
        }
        return result;
    }
    async unloadExtension(id) {
        const extension = this.getExtension(id);
        if (!extension) {
            return false;
        }
        // Unintegrate from framework
        await this.unintegrateExtension(extension);
        // Unload from loader
        const success = await this.loader.unloadExtension(id);
        if (success) {
            // Unregister from registry
            await this.registry.unregisterExtension(id);
            // Update stats
            this.updateStats();
        }
        return success;
    }
    async activateExtension(id) {
        const extension = this.getExtension(id);
        if (!extension || extension.status !== ExtensionTypes_js_1.ExtensionStatus.LOADED) {
            return false;
        }
        try {
            // Call lifecycle hook
            if (extension.instance?.onActivate) {
                await extension.instance.onActivate(extension.context);
            }
            extension.status = ExtensionTypes_js_1.ExtensionStatus.ACTIVE;
            this.emitExtensionEvent({
                type: ExtensionTypes_js_1.ExtensionEventType.EXTENSION_ACTIVATED,
                extensionId: id,
                timestamp: new Date()
            });
            this.updateStats();
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to activate extension ${id}: ${error instanceof Error ? error.message : String(error)}`);
            extension.status = ExtensionTypes_js_1.ExtensionStatus.ERROR;
            return false;
        }
    }
    async deactivateExtension(id) {
        const extension = this.getExtension(id);
        if (!extension || extension.status !== ExtensionTypes_js_1.ExtensionStatus.ACTIVE) {
            return false;
        }
        try {
            // Call lifecycle hook
            if (extension.instance?.onDeactivate) {
                await extension.instance.onDeactivate(extension.context);
            }
            extension.status = ExtensionTypes_js_1.ExtensionStatus.INACTIVE;
            this.emitExtensionEvent({
                type: ExtensionTypes_js_1.ExtensionEventType.EXTENSION_DEACTIVATED,
                extensionId: id,
                timestamp: new Date()
            });
            this.updateStats();
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to deactivate extension ${id}: ${error instanceof Error ? error.message : String(error)}`);
            extension.status = ExtensionTypes_js_1.ExtensionStatus.ERROR;
            return false;
        }
    }
    getExtensionConfig(id) {
        const extension = this.getExtension(id);
        return extension?.configuration.current || {};
    }
    async setExtensionConfig(id, config) {
        const extension = this.getExtension(id);
        if (!extension) {
            return false;
        }
        try {
            // Validate configuration
            const validation = await this.validator.validateConfiguration(extension.manifest, config);
            if (!validation.valid) {
                this.logger.warn(`Configuration validation failed for ${id}: ${validation.errors.map(e => e.message).join(', ')}`);
                return false;
            }
            // Update configuration
            extension.configuration.current = { ...extension.configuration.defaults, ...config };
            extension.configuration.userOverrides = config;
            // Call lifecycle hook
            if (extension.instance?.onConfigChange) {
                await extension.instance.onConfigChange(extension.configuration.current, extension.context);
            }
            this.emitExtensionEvent({
                type: ExtensionTypes_js_1.ExtensionEventType.EXTENSION_CONFIG_CHANGED,
                extensionId: id,
                timestamp: new Date(),
                data: { config }
            });
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to set configuration for ${id}: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    onExtensionEvent(callback) {
        this.on('extensionEvent', callback);
    }
    offExtensionEvent(callback) {
        this.off('extensionEvent', callback);
    }
    async discoverExtensions(sources) {
        // Use default sources if none provided
        sources || this.getDefaultDiscoverySources();
        const found = await this.loader.discoverExtensions();
        return {
            found,
            errors: [] // Would be populated by discovery failures
        };
    }
    getExtensionStats() {
        return { ...this.stats };
    }
    getExtensionHealth(id) {
        const extension = this.getExtension(id);
        if (!extension) {
            throw new Error(`Extension not found: ${id}`);
        }
        const now = new Date();
        const uptime = extension.loadedAt ? now.getTime() - extension.loadedAt.getTime() : 0;
        return {
            healthy: extension.status === ExtensionTypes_js_1.ExtensionStatus.ACTIVE || extension.status === ExtensionTypes_js_1.ExtensionStatus.LOADED,
            lastChecked: now,
            uptime,
            memoryUsage: 0, // Would be calculated from actual usage
            errors: 0, // Would be tracked from error events
            warnings: 0, // Would be tracked from warning events
            dependencies: {
                resolved: extension.dependencies.filter(d => d.resolved).length,
                failed: extension.dependencies.filter(d => !d.resolved).length
            }
        };
    }
    /**
     * Framework Integration
     */
    async integrateExtension(extension) {
        this.logger.debug(`🔗 Integrating extension: ${extension.name}`);
        switch (extension.type) {
            case ExtensionTypes_js_1.ExtensionType.NESTJS_MODULE:
                await this.integrateNestJSModule(extension);
                break;
            case ExtensionTypes_js_1.ExtensionType.WORKFLOW_NODE:
                await this.integrateWorkflowNode(extension);
                break;
            case ExtensionTypes_js_1.ExtensionType.AGENT_CAPABILITY:
                await this.integrateAgentCapability(extension);
                break;
            case ExtensionTypes_js_1.ExtensionType.VSCODE_EXTENSION:
                await this.integrateVSCodeExtension(extension);
                break;
        }
    }
    async integrateNestJSModule(extension) {
        // Integration would involve registering the module with the NestJS application
        this.logger.info(`📦 Integrating NestJS module: ${extension.name}`);
        // Implementation would depend on the NestJS application structure
    }
    async integrateWorkflowNode(extension) {
        if (this.workflowEngine) {
            this.logger.info(`⚡ Integrating workflow node: ${extension.nodeType}`);
            // Register the node type with the workflow engine
            // Implementation would call workflowEngine.registerNodeType(extension.nodeType, extension.nodeClass)
        }
    }
    async integrateAgentCapability(extension) {
        if (this.agentRegistry) {
            this.logger.info(`🤖 Integrating agent capability: ${extension.capabilityName}`);
            // Register the capability with the agent registry
            // Implementation would call agentRegistry.registerCapability(extension.capabilityName, extension.capabilityClass)
        }
    }
    async integrateVSCodeExtension(extension) {
        this.logger.info(`📝 Integrating VSCode extension: ${extension.name}`);
        // Integration would involve setting up VSCode extension wrapper
    }
    async unintegrateExtension(extension) {
        this.logger.debug(`🔗 Unintegrating extension: ${extension.name}`);
        // Type-specific unintegration logic would go here
        // This would reverse the integration process
    }
    /**
     * Helper Methods
     */
    createLoaderConfig() {
        return {
            extensionDirectories: [this.config.extensionDirectory],
            configDirectory: this.config.configDirectory,
            logDirectory: this.config.logDirectory,
            tempDirectory: this.config.tempDirectory,
            enableSandboxing: this.config.enableSandboxing,
            maxLoadTime: this.config.maxLoadTime,
            maxMemoryUsage: this.config.maxMemoryUsage,
            allowUnsignedExtensions: this.config.allowDevelopmentExtensions,
            trustedSources: this.config.trustedSources,
            permissionModel: 'permissive' // Could be configurable
        };
    }
    getDefaultDiscoverySources() {
        return [
            {
                type: 'directory',
                location: this.config.extensionDirectory,
                priority: 1,
                enabled: true
            }
        ];
    }
    setupEventHandlers() {
        // Forward loader events
        this.loader.on('extensionEvent', (event) => {
            this.emit('extensionEvent', event);
            this.updateStats();
        });
    }
    startPeriodicTasks() {
        // Health checks
        setInterval(() => {
            this.performHealthChecks();
        }, 60000); // Every minute
        // Stats update
        setInterval(() => {
            this.updateStats();
        }, 30000); // Every 30 seconds
    }
    performHealthChecks() {
        const extensions = this.getAllExtensions();
        for (const extension of extensions) {
            if (extension.status === ExtensionTypes_js_1.ExtensionStatus.ACTIVE) {
                // Perform health check
                const health = this.getExtensionHealth(extension.id);
                if (!health.healthy) {
                    this.logger.warn(`Extension ${extension.name} failed health check`);
                }
            }
        }
    }
    updateStats() {
        const extensions = this.getAllExtensions();
        this.stats = {
            total: extensions.length,
            loaded: extensions.filter(e => e.status === ExtensionTypes_js_1.ExtensionStatus.LOADED || e.status === ExtensionTypes_js_1.ExtensionStatus.ACTIVE).length,
            active: extensions.filter(e => e.status === ExtensionTypes_js_1.ExtensionStatus.ACTIVE).length,
            error: extensions.filter(e => e.status === ExtensionTypes_js_1.ExtensionStatus.ERROR).length,
            disabled: extensions.filter(e => e.status === ExtensionTypes_js_1.ExtensionStatus.DISABLED).length,
            byType: this.groupByType(extensions),
            byCategory: this.groupByCategory(extensions),
            totalLoadTime: extensions.reduce((sum, e) => sum + (e.metadata.loadTime || 0), 0),
            totalMemoryUsage: extensions.reduce((sum, e) => sum + (e.metadata.memoryUsage || 0), 0)
        };
    }
    groupByType(extensions) {
        const groups = {};
        for (const type of Object.values(ExtensionTypes_js_1.ExtensionType)) {
            groups[type] = extensions.filter(e => e.type === type).length;
        }
        return groups;
    }
    groupByCategory(extensions) {
        const groups = {};
        for (const category of Object.values(ExtensionTypes_js_1.ExtensionCategory)) {
            groups[category] = extensions.filter(e => e.category === category).length;
        }
        return groups;
    }
    createEmptyStats() {
        return {
            total: 0,
            loaded: 0,
            active: 0,
            error: 0,
            disabled: 0,
            byType: {},
            byCategory: {},
            totalLoadTime: 0,
            totalMemoryUsage: 0
        };
    }
    emitExtensionEvent(event) {
        this.emit('extensionEvent', event);
    }
    /**
     * Public API Extensions
     */
    async reloadExtension(id) {
        const extension = this.getExtension(id);
        if (!extension) {
            return false;
        }
        const extensionPath = extension.context?.workingDirectory;
        if (!extensionPath) {
            return false;
        }
        // Unload and reload
        await this.unloadExtension(id);
        const result = await this.loadExtension(extensionPath);
        return result.success;
    }
    async enableExtension(id) {
        const extension = this.getExtension(id);
        if (!extension) {
            return false;
        }
        if (extension.status === ExtensionTypes_js_1.ExtensionStatus.DISABLED) {
            extension.status = ExtensionTypes_js_1.ExtensionStatus.LOADED;
            this.updateStats();
            return true;
        }
        return false;
    }
    async disableExtension(id) {
        const extension = this.getExtension(id);
        if (!extension) {
            return false;
        }
        if (extension.status === ExtensionTypes_js_1.ExtensionStatus.ACTIVE) {
            await this.deactivateExtension(id);
        }
        extension.status = ExtensionTypes_js_1.ExtensionStatus.DISABLED;
        this.updateStats();
        return true;
    }
    getCompatibleExtensions(type) {
        return this.getExtensionsByType(type).filter(ext => ext.status === ExtensionTypes_js_1.ExtensionStatus.LOADED || ext.status === ExtensionTypes_js_1.ExtensionStatus.ACTIVE);
    }
    async shutdown() {
        this.logger.info('🔌 Shutting down Extension Manager...');
        // Unload all extensions
        const extensions = this.getAllExtensions();
        for (const extension of extensions) {
            await this.unloadExtension(extension.id);
        }
        this.isInitialized = false;
        this.logger.info('✅ Extension Manager shut down');
    }
}
exports.ExtensionManager = ExtensionManager;
//# sourceMappingURL=ExtensionManager.js.map