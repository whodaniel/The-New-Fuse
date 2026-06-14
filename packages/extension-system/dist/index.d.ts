/**
 * Unified Extension System - Main Export File
 *
 * Consolidates all extension system components for The New Fuse Framework
 * Provides a single entry point for all extension-related functionality
 */
export { ExtensionManager } from './manager/ExtensionManager.js';
export { ExtensionLoader, type ExtensionLoaderConfig } from './loader/ExtensionLoader.js';
export { ExtensionRegistry, type ExtensionRegistryConfig, type ExtensionSearchQuery, type ExtensionSearchResult } from './registry/ExtensionRegistry.js';
export { ExtensionValidator, type ExtensionValidatorConfig, type SecurityScanResult, type SecurityIssue } from './validator/ExtensionValidator.js';
export * from './types/ExtensionTypes.js';
import { Logger, MasterAgentRegistry } from '@the-new-fuse/relay-core';
import { ExtensionManager } from './manager/ExtensionManager.js';
export interface ExtensionSystemConfig {
    extensionDirectory: string;
    configDirectory: string;
    logDirectory: string;
    tempDirectory: string;
    enableAutoUpdate: boolean;
    enableSandboxing: boolean;
    maxLoadTime: number;
    maxMemoryUsage: number;
    allowDevelopmentExtensions: boolean;
    trustedSources: string[];
}
export declare class ExtensionSystemFactory {
    /**
     * Create a complete extension system
     */
    static create(config: ExtensionSystemConfig, logger: Logger, agentRegistry?: MasterAgentRegistry, workflowEngine?: any): ExtensionManager;
    /**
     * Create extension system with default configuration
     */
    static createDefault(baseDirectory: string, logger: Logger, agentRegistry?: MasterAgentRegistry, workflowEngine?: any): ExtensionManager;
}
/**
 * Extension System Integration Helper
 *
 * Provides utilities for integrating the extension system with existing modules
 */
export declare class ExtensionSystemIntegrator {
    private extensionManager;
    private logger;
    constructor(extensionManager: ExtensionManager, logger: Logger);
    /**
     * Migrate existing NestJS modules to extensions
     */
    migrateNestJSModules(modules: any[]): Promise<void>;
    /**
     * Create extension from existing NestJS module
     */
    private createExtensionFromModule;
    /**
     * Register workflow node types as extensions
     */
    migrateWorkflowNodes(nodeTypes: Map<string, any>): Promise<void>;
    /**
     * Create workflow node extension from existing node type
     */
    private createWorkflowNodeExtension;
    /**
     * Migrate agent capabilities to extensions
     */
    migrateAgentCapabilities(capabilities: Map<string, any>): Promise<void>;
    /**
     * Create agent capability extension
     */
    private createAgentCapabilityExtension;
}
/**
 * Extension Development Utilities
 */
export declare class ExtensionDevelopmentUtils {
    /**
     * Generate extension template
     */
    static generateExtensionTemplate(type: string, name: string): Record<string, string>;
    /**
     * Validate extension structure
     */
    static validateExtensionStructure(): {
        valid: boolean;
        issues: string[];
    };
}
export default ExtensionSystemFactory;
//# sourceMappingURL=index.d.ts.map