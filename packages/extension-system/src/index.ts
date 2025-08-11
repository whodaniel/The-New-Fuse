/**
 * Unified Extension System - Main Export File
 * 
 * Consolidates all extension system components for The New Fuse Framework
 * Provides a single entry point for all extension-related functionality
 */

// Core components
export { ExtensionManager } from './manager/ExtensionManager.js';
export { ExtensionLoader, type ExtensionLoaderConfig } from './loader/ExtensionLoader.js';
export { ExtensionRegistry, type ExtensionRegistryConfig, type ExtensionSearchQuery, type ExtensionSearchResult } from './registry/ExtensionRegistry.js';
export { ExtensionValidator, type ExtensionValidatorConfig, type SecurityScanResult, type SecurityIssue } from './validator/ExtensionValidator.js';

// Types and interfaces
export * from './types/ExtensionTypes.js';

// Factory for creating extension system
import { Logger, MasterAgentRegistry } from '@tnf/relay-core';
import { ExtensionManager } from './manager/ExtensionManager.js';
import { ExtensionManagerConfig } from './types/ExtensionTypes.js';

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

export class ExtensionSystemFactory {
  /**
   * Create a complete extension system
   */
  static create(
    config: ExtensionSystemConfig,
    logger: Logger,
    agentRegistry?: MasterAgentRegistry,
    workflowEngine?: any
  ): ExtensionManager {
    const managerConfig: ExtensionManagerConfig = {
      extensionDirectory: config.extensionDirectory,
      configDirectory: config.configDirectory,
      logDirectory: config.logDirectory,
      tempDirectory: config.tempDirectory,
      enableAutoUpdate: config.enableAutoUpdate,
      enableSandboxing: config.enableSandboxing,
      maxLoadTime: config.maxLoadTime,
      maxMemoryUsage: config.maxMemoryUsage,
      allowDevelopmentExtensions: config.allowDevelopmentExtensions,
      trustedSources: config.trustedSources
    };

    return new ExtensionManager(managerConfig, logger, agentRegistry, workflowEngine);
  }

  /**
   * Create extension system with default configuration
   */
  static createDefault(
    baseDirectory: string,
    logger: Logger,
    agentRegistry?: MasterAgentRegistry,
    workflowEngine?: any
  ): ExtensionManager {
    const config: ExtensionSystemConfig = {
      extensionDirectory: `${baseDirectory}/extensions`,
      configDirectory: `${baseDirectory}/config`,
      logDirectory: `${baseDirectory}/logs`,
      tempDirectory: `${baseDirectory}/temp`,
      enableAutoUpdate: true,
      enableSandboxing: true,
      maxLoadTime: 30000, // 30 seconds
      maxMemoryUsage: 128 * 1024 * 1024, // 128MB
      allowDevelopmentExtensions: process.env.NODE_ENV === 'development',
      trustedSources: ['@the-new-fuse/', 'https://registry.npmjs.org/']
    };

    return this.create(config, logger, agentRegistry, workflowEngine);
  }
}

/**
 * Extension System Integration Helper
 * 
 * Provides utilities for integrating the extension system with existing modules
 */
export class ExtensionSystemIntegrator {
  private extensionManager: ExtensionManager;
  private logger: Logger;

  constructor(extensionManager: ExtensionManager, logger: Logger) {
    this.extensionManager = extensionManager;
    this.logger = logger;
  }

  /**
   * Migrate existing NestJS modules to extensions
   */
  async migrateNestJSModules(modules: any[]): Promise<void> {
    this.logger.info('🔄 Migrating existing NestJS modules to extension system...');

    for (const moduleClass of modules) {
      try {
        await this.createExtensionFromModule(moduleClass);
      } catch (error) {
        this.logger.warn(`Failed to migrate module ${moduleClass.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Create extension from existing NestJS module
   */
  private async createExtensionFromModule(moduleClass: any): Promise<void> {
    // This would analyze the module and create an extension manifest
    // Implementation would be specific to the module structure
    this.logger.debug(`Creating extension from module: ${moduleClass.name}`);
  }

  /**
   * Register workflow node types as extensions
   */
  async migrateWorkflowNodes(nodeTypes: Map<string, any>): Promise<void> {
    this.logger.info('🔄 Migrating workflow node types to extension system...');

    for (const [nodeType, nodeClass] of nodeTypes.entries()) {
      try {
        await this.createWorkflowNodeExtension(nodeType, nodeClass);
      } catch (error) {
        this.logger.warn(`Failed to migrate workflow node ${nodeType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Create workflow node extension from existing node type
   */
  private async createWorkflowNodeExtension(nodeType: string, _nodeClass: any): Promise<void> {
    // This would create a workflow node extension
    this.logger.debug(`Creating workflow node extension: ${nodeType}`);
  }

  /**
   * Migrate agent capabilities to extensions
   */
  async migrateAgentCapabilities(capabilities: Map<string, any>): Promise<void> {
    this.logger.info('🔄 Migrating agent capabilities to extension system...');

    for (const [capabilityName, capabilityClass] of capabilities.entries()) {
      try {
        await this.createAgentCapabilityExtension(capabilityName, capabilityClass);
      } catch (error) {
        this.logger.warn(`Failed to migrate capability ${capabilityName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Create agent capability extension
   */
  private async createAgentCapabilityExtension(capabilityName: string, _capabilityClass: any): Promise<void> {
    // This would create an agent capability extension
    this.logger.debug(`Creating agent capability extension: ${capabilityName}`);
  }
}

/**
 * Extension Development Utilities
 */
export class ExtensionDevelopmentUtils {
  /**
   * Generate extension template
   */
  static generateExtensionTemplate(type: string, name: string): Record<string, string> {
    const templates: Record<string, Record<string, string>> = {
      'workflow-node': {
        'extension.json': JSON.stringify({
          name: `@my-org/${name}`,
          version: '1.0.0',
          description: `Custom workflow node: ${name}`,
          type: 'workflow_node',
          category: 'workflow',
          main: 'index.js',
          author: 'Your Name',
          keywords: ['workflow', 'node', name],
          permissions: [],
          configuration: {
            schema: {
              type: 'object',
              properties: {}
            }
          }
        }, null, 2),
        'index.js': `/**
 * ${name} Workflow Node Extension
 */

class ${name.charAt(0).toUpperCase() + name.slice(1)}Node {
  constructor(config) {
    this.config = config;
  }

  async execute(input, context) {
    // Implement your node logic here
    return { processed: true, input };
  }
}

module.exports = ${name.charAt(0).toUpperCase() + name.slice(1)}Node;`,
        'README.md': `# ${name} Extension

A custom workflow node extension for The New Fuse Framework.

## Usage

This extension provides a custom workflow node that can be used in workflows.

## Configuration

No configuration required.

## Development

To develop this extension:

1. Install dependencies: \`npm install\`
2. Build: \`npm run build\`
3. Test: \`npm run test\`
`
      },
      'agent-capability': {
        'extension.json': JSON.stringify({
          name: `@my-org/${name}`,
          version: '1.0.0',
          description: `Custom agent capability: ${name}`,
          type: 'agent_capability',
          category: 'agent',
          main: 'index.js',
          author: 'Your Name',
          keywords: ['agent', 'capability', name],
          permissions: [],
          configuration: {
            schema: {
              type: 'object',
              properties: {}
            }
          }
        }, null, 2),
        'index.js': `/**
 * ${name} Agent Capability Extension
 */

class ${name.charAt(0).toUpperCase() + name.slice(1)}Capability {
  constructor(config) {
    this.config = config;
  }

  async initialize(agent) {
    // Initialize the capability for the agent
    this.agent = agent;
  }

  async execute(task, context) {
    // Implement your capability logic here
    return { completed: true, result: 'Task completed' };
  }
}

module.exports = ${name.charAt(0).toUpperCase() + name.slice(1)}Capability;`,
        'README.md': `# ${name} Capability Extension

A custom agent capability extension for The New Fuse Framework.

## Usage

This extension provides a custom capability that can be added to agents.

## Configuration

No configuration required.

## Development

To develop this extension:

1. Install dependencies: \`npm install\`
2. Build: \`npm run build\`
3. Test: \`npm run test\`
`
      }
    };

    return templates[type] || {};
  }

  /**
   * Validate extension structure
   */
  static validateExtensionStructure(): { valid: boolean; issues: string[] } {
    // Implementation would check for required files, proper structure, etc.
    return { valid: true, issues: [] };
  }
}

// Default export for convenience
export default ExtensionSystemFactory;