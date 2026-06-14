"use strict";
/**
 * Unified Extension System - Main Export File
 *
 * Consolidates all extension system components for The New Fuse Framework
 * Provides a single entry point for all extension-related functionality
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionDevelopmentUtils = exports.ExtensionSystemIntegrator = exports.ExtensionSystemFactory = exports.ExtensionValidator = exports.ExtensionRegistry = exports.ExtensionLoader = exports.ExtensionManager = void 0;
// Core components
var ExtensionManager_js_1 = require("./manager/ExtensionManager.js");
Object.defineProperty(exports, "ExtensionManager", { enumerable: true, get: function () { return ExtensionManager_js_1.ExtensionManager; } });
var ExtensionLoader_js_1 = require("./loader/ExtensionLoader.js");
Object.defineProperty(exports, "ExtensionLoader", { enumerable: true, get: function () { return ExtensionLoader_js_1.ExtensionLoader; } });
var ExtensionRegistry_js_1 = require("./registry/ExtensionRegistry.js");
Object.defineProperty(exports, "ExtensionRegistry", { enumerable: true, get: function () { return ExtensionRegistry_js_1.ExtensionRegistry; } });
var ExtensionValidator_js_1 = require("./validator/ExtensionValidator.js");
Object.defineProperty(exports, "ExtensionValidator", { enumerable: true, get: function () { return ExtensionValidator_js_1.ExtensionValidator; } });
// Types and interfaces
__exportStar(require("./types/ExtensionTypes.js"), exports);
const ExtensionManager_js_2 = require("./manager/ExtensionManager.js");
class ExtensionSystemFactory {
    /**
     * Create a complete extension system
     */
    static create(config, logger, agentRegistry, workflowEngine) {
        const managerConfig = {
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
        return new ExtensionManager_js_2.ExtensionManager(managerConfig, logger, agentRegistry, workflowEngine);
    }
    /**
     * Create extension system with default configuration
     */
    static createDefault(baseDirectory, logger, agentRegistry, workflowEngine) {
        const config = {
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
exports.ExtensionSystemFactory = ExtensionSystemFactory;
/**
 * Extension System Integration Helper
 *
 * Provides utilities for integrating the extension system with existing modules
 */
class ExtensionSystemIntegrator {
    constructor(extensionManager, logger) {
        this.extensionManager = extensionManager;
        this.logger = logger;
    }
    /**
     * Migrate existing NestJS modules to extensions
     */
    async migrateNestJSModules(modules) {
        this.logger.info('🔄 Migrating existing NestJS modules to extension system...');
        for (const moduleClass of modules) {
            try {
                await this.createExtensionFromModule(moduleClass);
            }
            catch (error) {
                this.logger.warn(`Failed to migrate module ${moduleClass.name}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    /**
     * Create extension from existing NestJS module
     */
    async createExtensionFromModule(moduleClass) {
        // This would analyze the module and create an extension manifest
        // Implementation would be specific to the module structure
        this.logger.debug(`Creating extension from module: ${moduleClass.name}`);
    }
    /**
     * Register workflow node types as extensions
     */
    async migrateWorkflowNodes(nodeTypes) {
        this.logger.info('🔄 Migrating workflow node types to extension system...');
        for (const [nodeType, nodeClass] of nodeTypes.entries()) {
            try {
                await this.createWorkflowNodeExtension(nodeType, nodeClass);
            }
            catch (error) {
                this.logger.warn(`Failed to migrate workflow node ${nodeType}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    /**
     * Create workflow node extension from existing node type
     */
    async createWorkflowNodeExtension(nodeType, _nodeClass) {
        // This would create a workflow node extension
        this.logger.debug(`Creating workflow node extension: ${nodeType}`);
    }
    /**
     * Migrate agent capabilities to extensions
     */
    async migrateAgentCapabilities(capabilities) {
        this.logger.info('🔄 Migrating agent capabilities to extension system...');
        for (const [capabilityName, capabilityClass] of capabilities.entries()) {
            try {
                await this.createAgentCapabilityExtension(capabilityName, capabilityClass);
            }
            catch (error) {
                this.logger.warn(`Failed to migrate capability ${capabilityName}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    /**
     * Create agent capability extension
     */
    async createAgentCapabilityExtension(capabilityName, _capabilityClass) {
        // This would create an agent capability extension
        this.logger.debug(`Creating agent capability extension: ${capabilityName}`);
    }
}
exports.ExtensionSystemIntegrator = ExtensionSystemIntegrator;
/**
 * Extension Development Utilities
 */
class ExtensionDevelopmentUtils {
    /**
     * Generate extension template
     */
    static generateExtensionTemplate(type, name) {
        const templates = {
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
    static validateExtensionStructure() {
        // Implementation would check for required files, proper structure, etc.
        return { valid: true, issues: [] };
    }
}
exports.ExtensionDevelopmentUtils = ExtensionDevelopmentUtils;
// Default export for convenience
exports.default = ExtensionSystemFactory;
//# sourceMappingURL=index.js.map