import { EventEmitter } from 'events';
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
    main: string;
    dependencies?: Record<string, string>;
    capabilities: string[];
    permissions: PluginPermission[];
    metadata: Record<string, any>;
}
export interface PluginPermission {
    type: 'filesystem' | 'network' | 'system' | 'agent' | 'mcp';
    scope: string;
    level: 'read' | 'write' | 'execute' | 'admin';
    description: string;
}
export interface PluginContext {
    pluginId: string;
    logger: PluginLogger;
    storage: PluginStorage;
    events: PluginEventBus;
    mcp: MCPInterface;
    permissions: PluginPermission[];
}
export interface PluginAPI {
    initialize(context: PluginContext): Promise<void>;
    activate(): Promise<void>;
    deactivate(): Promise<void>;
    getCapabilities(): string[];
    executeCapability(capability: string, params: any): Promise<any>;
    getStatus(): PluginStatus;
}
export interface PluginStatus {
    id: string;
    state: 'inactive' | 'initializing' | 'active' | 'error' | 'disabled';
    version: string;
    uptime: number;
    lastError?: string;
    metrics: {
        executionCount: number;
        averageExecutionTime: number;
        errorCount: number;
        memoryUsage: number;
    };
}
export interface PluginLogger {
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
}
export interface PluginStorage {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<string[]>;
    clear(): Promise<void>;
}
export interface PluginEventBus {
    emit(event: string, data: any): void;
    on(event: string, handler: (data: any) => void): void;
    off(event: string, handler: (data: any) => void): void;
    once(event: string, handler: (data: any) => void): void;
}
export interface MCPInterface {
    sendMessage(message: any): Promise<any>;
    registerTool(name: string, handler: (params: any) => Promise<any>): void;
    unregisterTool(name: string): void;
    getAgentInfo(): Promise<any>;
}
export interface PluginRegistry {
    id: string;
    manifest: PluginManifest;
    api: PluginAPI;
    context: PluginContext;
    status: PluginStatus;
    loadedAt: number;
    activatedAt?: number;
}
export declare class PluginEcosystemManager extends EventEmitter {
    private plugins;
    private pluginPaths;
    private sandboxes;
    private storageRoot;
    private isInitialized;
    constructor(storageRoot?: string);
    /**
     * Initialize the plugin ecosystem
     */
    initialize(): Promise<void>;
    /**
     * Load plugin from directory
     */
    loadPlugin(pluginPath: string): Promise<string>;
    /**
     * Unload plugin
     */
    unloadPlugin(pluginId: string): Promise<void>;
    /**
     * Activate plugin
     */
    activatePlugin(pluginId: string): Promise<void>;
    /**
     * Deactivate plugin
     */
    deactivatePlugin(pluginId: string): Promise<void>;
    /**
     * Execute plugin capability
     */
    executeCapability(pluginId: string, capability: string, params: any): Promise<any>;
    /**
     * Get plugin status
     */
    getPluginStatus(pluginId: string): PluginStatus | undefined;
    /**
     * Get all plugins
     */
    getAllPlugins(): Array<{
        id: string;
        manifest: PluginManifest;
        status: PluginStatus;
    }>;
    /**
     * Get active plugins
     */
    getActivePlugins(): Array<{
        id: string;
        manifest: PluginManifest;
        status: PluginStatus;
    }>;
    /**
     * Search plugins by capability
     */
    findPluginsByCapability(capability: string): Array<{
        id: string;
        manifest: PluginManifest;
    }>;
    /**
     * Install plugin from package
     */
    installPlugin(packagePath: string, pluginId?: string): Promise<string>;
    /**
     * Update plugin
     */
    updatePlugin(pluginId: string, newVersion: string): Promise<void>;
    /**
     * Get plugin dependencies
     */
    getPluginDependencies(pluginId: string): string[];
    /**
     * Validate plugin permissions
     */
    validatePermissions(pluginId: string, requiredPermissions: PluginPermission[]): boolean;
    /**
     * Create plugin sandbox
     */
    private createPluginSandbox;
    /**
     * Load plugin module with sandboxing
     */
    private loadPluginModule;
    /**
     * Create plugin context
     */
    private createPluginContext;
    /**
     * Create plugin logger
     */
    private createPluginLogger;
    /**
     * Create plugin storage
     */
    private createPluginStorage;
    /**
     * Create plugin event bus
     */
    private createPluginEventBus;
    /**
     * Create MCP interface
     */
    private createMCPInterface;
    /**
     * Validate plugin manifest
     */
    private validateManifest;
    /**
     * Check permission level hierarchy
     */
    private hasPermissionLevel;
}
export default PluginEcosystemManager;
//# sourceMappingURL=PluginEcosystem.d.ts.map