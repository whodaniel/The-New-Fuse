/**
 * Extension Loader - Dynamic Extension Loading and Management
 *
 * Handles the loading, validation, and instantiation of extensions from various sources
 * Provides secure sandboxing and dependency resolution
 */
import { EventEmitter } from 'events';
import { Logger } from '@the-new-fuse/relay-core';
import { UnifiedExtension, ExtensionManifest, ExtensionLoadOptions, ExtensionLoadResult } from '../types/ExtensionTypes.js';
export interface ExtensionLoaderConfig {
    extensionDirectories: string[];
    configDirectory: string;
    logDirectory: string;
    tempDirectory: string;
    enableSandboxing: boolean;
    maxLoadTime: number;
    maxMemoryUsage: number;
    allowUnsignedExtensions: boolean;
    trustedSources: string[];
    permissionModel: 'strict' | 'permissive' | 'interactive';
}
export declare class ExtensionLoader extends EventEmitter {
    private logger;
    private config;
    private loadedExtensions;
    private extensionFactories;
    private sandboxes;
    private loadingPromises;
    constructor(config: ExtensionLoaderConfig, logger: Logger);
    /**
     * Load extension from path
     */
    loadExtension(extensionPath: string, options?: ExtensionLoadOptions): Promise<ExtensionLoadResult>;
    /**
     * Perform the actual extension loading
     */
    private performLoad;
    /**
     * Load extension manifest
     */
    private loadManifest;
    /**
     * Convert package.json to extension manifest
     */
    private convertPackageJsonToManifest;
    /**
     * Validate extension
     */
    private validateExtension;
    /**
     * Create extension context
     */
    private createExtensionContext;
    /**
     * Resolve extension dependencies
     */
    private resolveDependencies;
    /**
     * Request permissions for extension
     */
    private requestPermissions;
    /**
     * Create extension instance
     */
    private createExtensionInstance;
    /**
     * Create sandbox for extension
     */
    private createSandbox;
    /**
     * Initialize extension
     */
    private initializeExtension;
    /**
     * Unload extension
     */
    unloadExtension(extensionId: string): Promise<boolean>;
    /**
     * Discover extensions in directories
     */
    discoverExtensions(): Promise<ExtensionManifest[]>;
    /**
     * Initialize extension factories
     */
    private initializeExtensionFactories;
    /**
     * Helper methods
     */
    private isValidVersion;
    private getPermissionDescription;
    private shouldAutoGrantPermission;
    private hasPermission;
    private implementsLifecycle;
    private emitExtensionEvent;
    /**
     * Public API
     */
    getLoadedExtensions(): UnifiedExtension[];
    getExtension(id: string): UnifiedExtension | null;
    isLoaded(id: string): boolean;
    loadFromDirectory(_directory: string): Promise<ExtensionLoadResult[]>;
}
//# sourceMappingURL=ExtensionLoader.d.ts.map