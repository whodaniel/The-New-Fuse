"use strict";
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
exports.PluginEcosystemManager = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class PluginEcosystemManager extends events_1.EventEmitter {
    plugins = new Map();
    pluginPaths = new Map();
    sandboxes = new Map();
    storageRoot;
    isInitialized = false;
    constructor(storageRoot = './plugins') {
        super();
        this.storageRoot = storageRoot;
    }
    /**
     * Initialize the plugin ecosystem
     */
    async initialize() {
        if (this.isInitialized) {
            throw new Error('Plugin ecosystem already initialized');
        }
        // Ensure storage directory exists
        await fs.mkdir(this.storageRoot, { recursive: true });
        await fs.mkdir(path.join(this.storageRoot, 'data'), { recursive: true });
        await fs.mkdir(path.join(this.storageRoot, 'logs'), { recursive: true });
        this.isInitialized = true;
        this.emit('initialized');
    }
    /**
     * Load plugin from directory
     */
    async loadPlugin(pluginPath) {
        if (!this.isInitialized) {
            throw new Error('Plugin ecosystem not initialized');
        }
        // Read plugin manifest
        const manifestPath = path.join(pluginPath, 'plugin.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        // Validate manifest
        this.validateManifest(manifest);
        // Check if plugin already loaded
        if (this.plugins.has(manifest.id)) {
            throw new Error(`Plugin ${manifest.id} is already loaded`);
        }
        // Load plugin code
        const pluginMainPath = path.join(pluginPath, manifest.main);
        const pluginModule = await this.loadPluginModule(pluginMainPath);
        // Create plugin context
        const context = this.createPluginContext(manifest);
        // Create plugin registry entry
        const registry = {
            id: manifest.id,
            manifest,
            api: pluginModule,
            context,
            status: {
                id: manifest.id,
                state: 'inactive',
                version: manifest.version,
                uptime: 0,
                metrics: {
                    executionCount: 0,
                    averageExecutionTime: 0,
                    errorCount: 0,
                    memoryUsage: 0
                }
            },
            loadedAt: Date.now()
        };
        // Store plugin
        this.plugins.set(manifest.id, registry);
        this.pluginPaths.set(manifest.id, pluginPath);
        // Initialize plugin
        try {
            registry.status.state = 'initializing';
            await registry.api.initialize(context);
            registry.status.state = 'inactive';
            this.emit('pluginLoaded', { pluginId: manifest.id, manifest });
            return manifest.id;
        }
        catch (error) {
            registry.status.state = 'error';
            registry.status.lastError = error.message;
            this.emit('pluginError', { pluginId: manifest.id, error });
            throw error;
        }
    }
    /**
     * Unload plugin
     */
    async unloadPlugin(pluginId) {
        const registry = this.plugins.get(pluginId);
        if (!registry) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        // Deactivate if active
        if (registry.status.state === 'active') {
            await this.deactivatePlugin(pluginId);
        }
        // Clean up sandbox
        if (this.sandboxes.has(pluginId)) {
            this.sandboxes.delete(pluginId);
        }
        // Remove from registry
        this.plugins.delete(pluginId);
        this.pluginPaths.delete(pluginId);
        this.emit('pluginUnloaded', { pluginId });
    }
    /**
     * Activate plugin
     */
    async activatePlugin(pluginId) {
        const registry = this.plugins.get(pluginId);
        if (!registry) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (registry.status.state === 'active') {
            return; // Already active
        }
        if (registry.status.state !== 'inactive') {
            throw new Error(`Plugin ${pluginId} is in ${registry.status.state} state and cannot be activated`);
        }
        try {
            await registry.api.activate();
            registry.status.state = 'active';
            registry.activatedAt = Date.now();
            this.emit('pluginActivated', { pluginId });
        }
        catch (error) {
            registry.status.state = 'error';
            registry.status.lastError = error.message;
            registry.status.metrics.errorCount++;
            this.emit('pluginError', { pluginId, error });
            throw error;
        }
    }
    /**
     * Deactivate plugin
     */
    async deactivatePlugin(pluginId) {
        const registry = this.plugins.get(pluginId);
        if (!registry) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (registry.status.state !== 'active') {
            return; // Not active
        }
        try {
            await registry.api.deactivate();
            registry.status.state = 'inactive';
            this.emit('pluginDeactivated', { pluginId });
        }
        catch (error) {
            registry.status.state = 'error';
            registry.status.lastError = error.message;
            registry.status.metrics.errorCount++;
            this.emit('pluginError', { pluginId, error });
            throw error;
        }
    }
    /**
     * Execute plugin capability
     */
    async executeCapability(pluginId, capability, params) {
        const registry = this.plugins.get(pluginId);
        if (!registry) {
            throw new Error(`Plugin ${pluginId} not found`);
        }
        if (registry.status.state !== 'active') {
            throw new Error(`Plugin ${pluginId} is not active`);
        }
        // Check if plugin has the capability
        const capabilities = registry.api.getCapabilities();
        if (!capabilities.includes(capability)) {
            throw new Error(`Plugin ${pluginId} does not have capability ${capability}`);
        }
        const startTime = Date.now();
        try {
            const result = await registry.api.executeCapability(capability, params);
            // Update metrics
            const executionTime = Date.now() - startTime;
            registry.status.metrics.executionCount++;
            registry.status.metrics.averageExecutionTime =
                (registry.status.metrics.averageExecutionTime * (registry.status.metrics.executionCount - 1) + executionTime) /
                    registry.status.metrics.executionCount;
            this.emit('capabilityExecuted', { pluginId, capability, executionTime, success: true });
            return result;
        }
        catch (error) {
            registry.status.metrics.errorCount++;
            registry.status.lastError = error.message;
            this.emit('capabilityExecuted', { pluginId, capability, executionTime: Date.now() - startTime, success: false, error });
            throw error;
        }
    }
    /**
     * Get plugin status
     */
    getPluginStatus(pluginId) {
        const registry = this.plugins.get(pluginId);
        if (!registry)
            return undefined;
        // Update uptime
        if (registry.activatedAt) {
            registry.status.uptime = Date.now() - registry.activatedAt;
        }
        return { ...registry.status };
    }
    /**
     * Get all plugins
     */
    getAllPlugins() {
        return Array.from(this.plugins.values()).map(registry => ({
            id: registry.id,
            manifest: registry.manifest,
            status: this.getPluginStatus(registry.id)
        }));
    }
    /**
     * Get active plugins
     */
    getActivePlugins() {
        return this.getAllPlugins().filter(plugin => plugin.status.state === 'active');
    }
    /**
     * Search plugins by capability
     */
    findPluginsByCapability(capability) {
        return Array.from(this.plugins.values())
            .filter(registry => registry.manifest.capabilities.includes(capability))
            .map(registry => ({ id: registry.id, manifest: registry.manifest }));
    }
    /**
     * Install plugin from package
     */
    async installPlugin(packagePath, pluginId) {
        // This would handle plugin installation from various sources
        // For now, just load from directory
        return this.loadPlugin(packagePath);
    }
    /**
     * Update plugin
     */
    async updatePlugin(pluginId, newVersion) {
        // Implementation would handle plugin updates
        throw new Error('Plugin updates not yet implemented');
    }
    /**
     * Get plugin dependencies
     */
    getPluginDependencies(pluginId) {
        const registry = this.plugins.get(pluginId);
        if (!registry)
            return [];
        return Object.keys(registry.manifest.dependencies || {});
    }
    /**
     * Validate plugin permissions
     */
    validatePermissions(pluginId, requiredPermissions) {
        const registry = this.plugins.get(pluginId);
        if (!registry)
            return false;
        const pluginPermissions = registry.manifest.permissions;
        return requiredPermissions.every(required => pluginPermissions.some(granted => granted.type === required.type &&
            granted.scope === required.scope &&
            this.hasPermissionLevel(granted.level, required.level)));
    }
    /**
     * Create plugin sandbox
     */
    createPluginSandbox(pluginId) {
        // Simplified sandbox - in production, this would be more sophisticated
        const sandbox = {
            console: {
                log: (...args) => this.emit('pluginLog', { pluginId, level: 'info', args }),
                error: (...args) => this.emit('pluginLog', { pluginId, level: 'error', args }),
                warn: (...args) => this.emit('pluginLog', { pluginId, level: 'warn', args })
            },
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            Buffer,
            process: {
                env: {}
            }
        };
        this.sandboxes.set(pluginId, sandbox);
        return sandbox;
    }
    /**
     * Load plugin module with sandboxing
     */
    async loadPluginModule(pluginPath) {
        // In a real implementation, this would use vm or worker_threads for sandboxing
        const module = await import(pluginPath);
        return module.default || module;
    }
    /**
     * Create plugin context
     */
    createPluginContext(manifest) {
        const pluginId = manifest.id;
        return {
            pluginId,
            logger: this.createPluginLogger(pluginId),
            storage: this.createPluginStorage(pluginId),
            events: this.createPluginEventBus(pluginId),
            mcp: this.createMCPInterface(pluginId),
            permissions: manifest.permissions
        };
    }
    /**
     * Create plugin logger
     */
    createPluginLogger(pluginId) {
        return {
            debug: (message, meta) => this.emit('pluginLog', { pluginId, level: 'debug', message, meta }),
            info: (message, meta) => this.emit('pluginLog', { pluginId, level: 'info', message, meta }),
            warn: (message, meta) => this.emit('pluginLog', { pluginId, level: 'warn', message, meta }),
            error: (message, meta) => this.emit('pluginLog', { pluginId, level: 'error', message, meta })
        };
    }
    /**
     * Create plugin storage
     */
    createPluginStorage(pluginId) {
        const storageDir = path.join(this.storageRoot, 'data', pluginId);
        return {
            async get(key) {
                try {
                    const filePath = path.join(storageDir, `${key}.json`);
                    const content = await fs.readFile(filePath, 'utf-8');
                    return JSON.parse(content);
                }
                catch {
                    return undefined;
                }
            },
            async set(key, value) {
                await fs.mkdir(storageDir, { recursive: true });
                const filePath = path.join(storageDir, `${key}.json`);
                await fs.writeFile(filePath, JSON.stringify(value, null, 2));
            },
            async delete(key) {
                try {
                    const filePath = path.join(storageDir, `${key}.json`);
                    await fs.unlink(filePath);
                }
                catch {
                    // Ignore if file doesn't exist
                }
            },
            async list() {
                try {
                    const files = await fs.readdir(storageDir);
                    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
                }
                catch {
                    return [];
                }
            },
            async clear() {
                try {
                    const files = await fs.readdir(storageDir);
                    await Promise.all(files.map(f => fs.unlink(path.join(storageDir, f))));
                }
                catch {
                    // Ignore if directory doesn't exist
                }
            }
        };
    }
    /**
     * Create plugin event bus
     */
    createPluginEventBus(pluginId) {
        const eventEmitter = new events_1.EventEmitter();
        return {
            emit: (event, data) => {
                eventEmitter.emit(event, data);
                this.emit('pluginEvent', { pluginId, event, data });
            },
            on: (event, handler) => eventEmitter.on(event, handler),
            off: (event, handler) => eventEmitter.off(event, handler),
            once: (event, handler) => eventEmitter.once(event, handler)
        };
    }
    /**
     * Create MCP interface
     */
    createMCPInterface(pluginId) {
        return {
            async sendMessage(message) {
                this.emit('pluginMCPMessage', { pluginId, message });
                // Implementation would integrate with actual MCP system
                return { success: true };
            },
            registerTool: (name, handler) => {
                this.emit('pluginToolRegistered', { pluginId, toolName: name });
                // Implementation would register with MCP system
            },
            unregisterTool: (name) => {
                this.emit('pluginToolUnregistered', { pluginId, toolName: name });
                // Implementation would unregister from MCP system
            },
            async getAgentInfo() {
                return { agentId: 'main', capabilities: [] };
            }
        };
    }
    /**
     * Validate plugin manifest
     */
    validateManifest(manifest) {
        const required = ['id', 'name', 'version', 'main', 'capabilities'];
        for (const field of required) {
            if (!(field in manifest)) {
                throw new Error(`Plugin manifest missing required field: ${field}`);
            }
        }
        if (!Array.isArray(manifest.capabilities)) {
            throw new Error('Plugin capabilities must be an array');
        }
        if (!Array.isArray(manifest.permissions)) {
            manifest.permissions = [];
        }
    }
    /**
     * Check permission level hierarchy
     */
    hasPermissionLevel(granted, required) {
        const levels = ['read', 'write', 'execute', 'admin'];
        const grantedIndex = levels.indexOf(granted);
        const requiredIndex = levels.indexOf(required);
        return grantedIndex >= requiredIndex;
    }
}
exports.PluginEcosystemManager = PluginEcosystemManager;
exports.default = PluginEcosystemManager;
//# sourceMappingURL=PluginEcosystem.js.map