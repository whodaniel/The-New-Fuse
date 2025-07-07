/**
 * Extension Manager - Central Extension Management System
 * 
 * Provides high-level extension management, coordination with other services,
 * and integration with The New Fuse framework components
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import { Logger } from '@the-new-fuse/relay-core';
import { AgentRegistry } from '@the-new-fuse/relay-core';
// import { WorkflowEngineFactory } from '@the-new-fuse/workflow-engine';
import {
  UnifiedExtension,
  ExtensionType,
  ExtensionStatus,
  ExtensionCategory,
  ExtensionManagerConfig,
  ExtensionStats,
  ExtensionEvent,
  ExtensionEventType,
  ExtensionAPI,
  ExtensionLoadOptions,
  ExtensionLoadResult,
  ExtensionDiscoverySource,
  ExtensionDiscoveryResult,
  ExtensionHealthStatus,
  NestJSModuleExtension,
  WorkflowNodeExtension,
  AgentCapabilityExtension,
  VSCodeExtensionWrapper
} from '../types/ExtensionTypes.js';
import { ExtensionLoader, ExtensionLoaderConfig } from '../loader/ExtensionLoader.js';
import { ExtensionRegistry } from '../registry/ExtensionRegistry.js';
import { ExtensionValidator } from '../validator/ExtensionValidator.js';

export class ExtensionManager extends EventEmitter implements ExtensionAPI {
  private logger: Logger;
  private config: ExtensionManagerConfig;
  private loader: ExtensionLoader;
  private registry: ExtensionRegistry;
  private validator: ExtensionValidator;
  
  // Framework integration
  private agentRegistry?: AgentRegistry;
  private workflowEngine?: any;
  
  // State management
  private isInitialized: boolean = false;
  private startupTime?: Date;
  private stats: ExtensionStats = this.createEmptyStats();

  constructor(
    config: ExtensionManagerConfig,
    logger: Logger,
    agentRegistry?: AgentRegistry,
    workflowEngine?: any
  ) {
    super();
    this.config = config;
    this.logger = logger;
    this.agentRegistry = agentRegistry;
    this.workflowEngine = workflowEngine;

    // Initialize components
    this.loader = new ExtensionLoader(this.createLoaderConfig(), logger);
    this.registry = new ExtensionRegistry(logger);
    this.validator = new ExtensionValidator(logger);

    // Setup event forwarding
    this.setupEventHandlers();
  }

  /**
   * Initialize the extension manager
   */
  async initialize(): Promise<void> {
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
      
    } catch (error) {
      this.logger.error(`❌ Failed to initialize Extension Manager: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Auto-discover and load extensions
   */
  private async autoDiscoverAndLoad(): Promise<void> {
    this.logger.info('🔍 Auto-discovering extensions...');
    
    try {
      // Discover extensions
      const discoveryResult = await this.discoverExtensions();
      
      // Load discovered extensions
      for (const manifest of discoveryResult.found) {
        try {
          const extensionPath = path.dirname(manifest.main);
          await this.loadExtension(extensionPath, { skipValidation: false });
        } catch (error) {
          this.logger.warn(`Failed to auto-load extension ${manifest.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
    } catch (error) {
      this.logger.error(`Auto-discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * ExtensionAPI Implementation
   */
  
  getExtension(id: string): UnifiedExtension | null {
    return this.loader.getExtension(id);
  }

  getAllExtensions(): UnifiedExtension[] {
    return this.loader.getLoadedExtensions();
  }

  getExtensionsByType(type: ExtensionType): UnifiedExtension[] {
    return this.getAllExtensions().filter(ext => ext.type === type);
  }

  getExtensionsByCategory(category: ExtensionCategory): UnifiedExtension[] {
    return this.getAllExtensions().filter(ext => ext.category === category);
  }

  async loadExtension(path: string, options?: ExtensionLoadOptions): Promise<ExtensionLoadResult> {
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

  async unloadExtension(id: string): Promise<boolean> {
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

  async activateExtension(id: string): Promise<boolean> {
    const extension = this.getExtension(id);
    if (!extension || extension.status !== ExtensionStatus.LOADED) {
      return false;
    }
    
    try {
      // Call lifecycle hook
      if (extension.instance?.onActivate) {
        await extension.instance.onActivate(extension.context!);
      }
      
      extension.status = ExtensionStatus.ACTIVE;
      
      this.emitExtensionEvent({
        type: ExtensionEventType.EXTENSION_ACTIVATED,
        extensionId: id,
        timestamp: new Date()
      });
      
      this.updateStats();
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to activate extension ${id}: ${error instanceof Error ? error.message : String(error)}`);
      extension.status = ExtensionStatus.ERROR;
      return false;
    }
  }

  async deactivateExtension(id: string): Promise<boolean> {
    const extension = this.getExtension(id);
    if (!extension || extension.status !== ExtensionStatus.ACTIVE) {
      return false;
    }
    
    try {
      // Call lifecycle hook
      if (extension.instance?.onDeactivate) {
        await extension.instance.onDeactivate(extension.context!);
      }
      
      extension.status = ExtensionStatus.INACTIVE;
      
      this.emitExtensionEvent({
        type: ExtensionEventType.EXTENSION_DEACTIVATED,
        extensionId: id,
        timestamp: new Date()
      });
      
      this.updateStats();
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to deactivate extension ${id}: ${error instanceof Error ? error.message : String(error)}`);
      extension.status = ExtensionStatus.ERROR;
      return false;
    }
  }

  getExtensionConfig(id: string): Record<string, any> {
    const extension = this.getExtension(id);
    return extension?.configuration.current || {};
  }

  async setExtensionConfig(id: string, config: Record<string, any>): Promise<boolean> {
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
        await extension.instance.onConfigChange(extension.configuration.current, extension.context!);
      }
      
      this.emitExtensionEvent({
        type: ExtensionEventType.EXTENSION_CONFIG_CHANGED,
        extensionId: id,
        timestamp: new Date(),
        data: { config }
      });
      
      return true;
      
    } catch (error) {
      this.logger.error(`Failed to set configuration for ${id}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  onExtensionEvent(callback: (event: ExtensionEvent) => void): void {
    this.on('extensionEvent', callback);
  }

  offExtensionEvent(callback: (event: ExtensionEvent) => void): void {
    this.off('extensionEvent', callback);
  }

  async discoverExtensions(sources?: ExtensionDiscoverySource[]): Promise<ExtensionDiscoveryResult> {
    // Use default sources if none provided
    sources || this.getDefaultDiscoverySources();
    
    const found = await this.loader.discoverExtensions();
    
    return {
      found,
      errors: [] // Would be populated by discovery failures
    };
  }

  getExtensionStats(): ExtensionStats {
    return { ...this.stats };
  }

  getExtensionHealth(id: string): ExtensionHealthStatus {
    const extension = this.getExtension(id);
    if (!extension) {
      throw new Error(`Extension not found: ${id}`);
    }
    
    const now = new Date();
    const uptime = extension.loadedAt ? now.getTime() - extension.loadedAt.getTime() : 0;
    
    return {
      healthy: extension.status === ExtensionStatus.ACTIVE || extension.status === ExtensionStatus.LOADED,
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
  
  private async integrateExtension(extension: UnifiedExtension): Promise<void> {
    this.logger.debug(`🔗 Integrating extension: ${extension.name}`);
    
    switch (extension.type) {
      case ExtensionType.NESTJS_MODULE:
        await this.integrateNestJSModule(extension as NestJSModuleExtension);
        break;
        
      case ExtensionType.WORKFLOW_NODE:
        await this.integrateWorkflowNode(extension as WorkflowNodeExtension);
        break;
        
      case ExtensionType.AGENT_CAPABILITY:
        await this.integrateAgentCapability(extension as AgentCapabilityExtension);
        break;
        
      case ExtensionType.VSCODE_EXTENSION:
        await this.integrateVSCodeExtension(extension as VSCodeExtensionWrapper);
        break;
    }
  }

  private async integrateNestJSModule(extension: NestJSModuleExtension): Promise<void> {
    // Integration would involve registering the module with the NestJS application
    this.logger.info(`📦 Integrating NestJS module: ${extension.name}`);
    // Implementation would depend on the NestJS application structure
  }

  private async integrateWorkflowNode(extension: WorkflowNodeExtension): Promise<void> {
    if (this.workflowEngine) {
      this.logger.info(`⚡ Integrating workflow node: ${extension.nodeType}`);
      // Register the node type with the workflow engine
      // Implementation would call workflowEngine.registerNodeType(extension.nodeType, extension.nodeClass)
    }
  }

  private async integrateAgentCapability(extension: AgentCapabilityExtension): Promise<void> {
    if (this.agentRegistry) {
      this.logger.info(`🤖 Integrating agent capability: ${extension.capabilityName}`);
      // Register the capability with the agent registry
      // Implementation would call agentRegistry.registerCapability(extension.capabilityName, extension.capabilityClass)
    }
  }

  private async integrateVSCodeExtension(extension: VSCodeExtensionWrapper): Promise<void> {
    this.logger.info(`📝 Integrating VSCode extension: ${extension.name}`);
    // Integration would involve setting up VSCode extension wrapper
  }

  private async unintegrateExtension(extension: UnifiedExtension): Promise<void> {
    this.logger.debug(`🔗 Unintegrating extension: ${extension.name}`);
    
    // Type-specific unintegration logic would go here
    // This would reverse the integration process
  }

  /**
   * Helper Methods
   */
  
  private createLoaderConfig(): ExtensionLoaderConfig {
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

  private getDefaultDiscoverySources(): ExtensionDiscoverySource[] {
    return [
      {
        type: 'directory',
        location: this.config.extensionDirectory,
        priority: 1,
        enabled: true
      }
    ];
  }

  private setupEventHandlers(): void {
    // Forward loader events
    this.loader.on('extensionEvent', (event: ExtensionEvent) => {
      this.emit('extensionEvent', event);
      this.updateStats();
    });
  }

  private startPeriodicTasks(): void {
    // Health checks
    setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Every minute
    
    // Stats update
    setInterval(() => {
      this.updateStats();
    }, 30000); // Every 30 seconds
  }

  private performHealthChecks(): void {
    const extensions = this.getAllExtensions();
    
    for (const extension of extensions) {
      if (extension.status === ExtensionStatus.ACTIVE) {
        // Perform health check
        const health = this.getExtensionHealth(extension.id);
        if (!health.healthy) {
          this.logger.warn(`Extension ${extension.name} failed health check`);
        }
      }
    }
  }

  private updateStats(): void {
    const extensions = this.getAllExtensions();
    
    this.stats = {
      total: extensions.length,
      loaded: extensions.filter(e => e.status === ExtensionStatus.LOADED || e.status === ExtensionStatus.ACTIVE).length,
      active: extensions.filter(e => e.status === ExtensionStatus.ACTIVE).length,
      error: extensions.filter(e => e.status === ExtensionStatus.ERROR).length,
      disabled: extensions.filter(e => e.status === ExtensionStatus.DISABLED).length,
      byType: this.groupByType(extensions),
      byCategory: this.groupByCategory(extensions),
      totalLoadTime: extensions.reduce((sum, e) => sum + (e.metadata.loadTime || 0), 0),
      totalMemoryUsage: extensions.reduce((sum, e) => sum + (e.metadata.memoryUsage || 0), 0)
    };
  }

  private groupByType(extensions: UnifiedExtension[]): Record<ExtensionType, number> {
    const groups = {} as Record<ExtensionType, number>;
    
    for (const type of Object.values(ExtensionType)) {
      groups[type] = extensions.filter(e => e.type === type).length;
    }
    
    return groups;
  }

  private groupByCategory(extensions: UnifiedExtension[]): Record<ExtensionCategory, number> {
    const groups = {} as Record<ExtensionCategory, number>;
    
    for (const category of Object.values(ExtensionCategory)) {
      groups[category] = extensions.filter(e => e.category === category).length;
    }
    
    return groups;
  }

  private createEmptyStats(): ExtensionStats {
    return {
      total: 0,
      loaded: 0,
      active: 0,
      error: 0,
      disabled: 0,
      byType: {} as Record<ExtensionType, number>,
      byCategory: {} as Record<ExtensionCategory, number>,
      totalLoadTime: 0,
      totalMemoryUsage: 0
    };
  }

  private emitExtensionEvent(event: ExtensionEvent): void {
    this.emit('extensionEvent', event);
  }

  /**
   * Public API Extensions
   */
  
  async reloadExtension(id: string): Promise<boolean> {
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

  async enableExtension(id: string): Promise<boolean> {
    const extension = this.getExtension(id);
    if (!extension) {
      return false;
    }
    
    if (extension.status === ExtensionStatus.DISABLED) {
      extension.status = ExtensionStatus.LOADED;
      this.updateStats();
      return true;
    }
    
    return false;
  }

  async disableExtension(id: string): Promise<boolean> {
    const extension = this.getExtension(id);
    if (!extension) {
      return false;
    }
    
    if (extension.status === ExtensionStatus.ACTIVE) {
      await this.deactivateExtension(id);
    }
    
    extension.status = ExtensionStatus.DISABLED;
    this.updateStats();
    return true;
  }

  getCompatibleExtensions(type: ExtensionType): UnifiedExtension[] {
    return this.getExtensionsByType(type).filter(ext => 
      ext.status === ExtensionStatus.LOADED || ext.status === ExtensionStatus.ACTIVE
    );
  }

  async shutdown(): Promise<void> {
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