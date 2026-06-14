/**
 * Extension Manager - Central Extension Management System
 *
 * Provides high-level extension management, coordination with other services,
 * and integration with The New Fuse framework components
 */
import { EventEmitter } from 'events';
import { Logger, MasterAgentRegistry } from '@the-new-fuse/relay-core';
import { UnifiedExtension, ExtensionType, ExtensionCategory, ExtensionManagerConfig, ExtensionStats, ExtensionEvent, ExtensionAPI, ExtensionLoadOptions, ExtensionLoadResult, ExtensionDiscoverySource, ExtensionDiscoveryResult, ExtensionHealthStatus } from '../types/ExtensionTypes.js';
export declare class ExtensionManager extends EventEmitter implements ExtensionAPI {
    private logger;
    private config;
    private loader;
    private registry;
    private validator;
    private agentRegistry?;
    private workflowEngine?;
    private isInitialized;
    private startupTime?;
    private stats;
    constructor(config: ExtensionManagerConfig, logger: Logger, agentRegistry?: MasterAgentRegistry, workflowEngine?: any);
    /**
     * Initialize the extension manager
     */
    initialize(): Promise<void>;
    /**
     * Auto-discover and load extensions
     */
    private autoDiscoverAndLoad;
    /**
     * ExtensionAPI Implementation
     */
    getExtension(id: string): UnifiedExtension | null;
    getAllExtensions(): UnifiedExtension[];
    getExtensionsByType(type: ExtensionType): UnifiedExtension[];
    getExtensionsByCategory(category: ExtensionCategory): UnifiedExtension[];
    loadExtension(path: string, options?: ExtensionLoadOptions): Promise<ExtensionLoadResult>;
    unloadExtension(id: string): Promise<boolean>;
    activateExtension(id: string): Promise<boolean>;
    deactivateExtension(id: string): Promise<boolean>;
    getExtensionConfig(id: string): Record<string, any>;
    setExtensionConfig(id: string, config: Record<string, any>): Promise<boolean>;
    onExtensionEvent(callback: (event: ExtensionEvent) => void): void;
    offExtensionEvent(callback: (event: ExtensionEvent) => void): void;
    discoverExtensions(sources?: ExtensionDiscoverySource[]): Promise<ExtensionDiscoveryResult>;
    getExtensionStats(): ExtensionStats;
    getExtensionHealth(id: string): ExtensionHealthStatus;
    /**
     * Framework Integration
     */
    private integrateExtension;
    private integrateNestJSModule;
    private integrateWorkflowNode;
    private integrateAgentCapability;
    private integrateVSCodeExtension;
    private unintegrateExtension;
    /**
     * Helper Methods
     */
    private createLoaderConfig;
    private getDefaultDiscoverySources;
    private setupEventHandlers;
    private startPeriodicTasks;
    private performHealthChecks;
    private updateStats;
    private groupByType;
    private groupByCategory;
    private createEmptyStats;
    private emitExtensionEvent;
    /**
     * Public API Extensions
     */
    reloadExtension(id: string): Promise<boolean>;
    enableExtension(id: string): Promise<boolean>;
    disableExtension(id: string): Promise<boolean>;
    getCompatibleExtensions(type: ExtensionType): UnifiedExtension[];
    shutdown(): Promise<void>;
}
//# sourceMappingURL=ExtensionManager.d.ts.map