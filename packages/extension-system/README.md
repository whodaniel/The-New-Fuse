# Unified Extension System

The Unified Extension System consolidates and standardizes all extension,
plugin, and module functionality across The New Fuse Framework. It provides a
secure, scalable, and comprehensive platform for extending the framework's
capabilities while maintaining consistency and reliability.

## Features

### Core Components

- **🔌 Extension Manager**: Central management system for all extensions
- **📥 Extension Loader**: Dynamic loading with security sandboxing and
  validation
- **📚 Extension Registry**: Persistent registry with search, reviews, and
  statistics
- **✅ Extension Validator**: Comprehensive validation including security
  scanning
- **🔒 Security System**: Permission model, sandboxing, and threat detection

### Extension Types Supported

- **NestJS Modules**: Backend service modules
- **Workflow Nodes**: Custom workflow execution nodes
- **Agent Capabilities**: AI agent skill extensions
- **Communication Extensions**: Relay transports and message handlers
- **Integration Extensions**: API connectors and database adapters
- **UI Extensions**: VSCode, Chrome, and web components
- **Development Tools**: Debug plugins and testing frameworks
- **Analytics Extensions**: Monitoring and metrics collection

### Key Capabilities

- **Unified Architecture**: Single system for all extension types
- **Security First**: Comprehensive permission model and sandboxing
- **Hot Loading**: Dynamic loading and unloading without restarts
- **Dependency Management**: Automatic resolution and validation
- **Performance Monitoring**: Resource usage tracking and optimization
- **Migration Tools**: Convert existing modules to extensions

## Installation

```bash
pnpm install @the-new-fuse/extension-system
```

## Quick Start

### Basic Usage

```typescript
import { ExtensionSystemFactory } from '@the-new-fuse/extension-system';
import { Logger } from '@the-new-fuse/relay-core';

// Create extension system
const logger = new Logger();
const extensionManager = ExtensionSystemFactory.createDefault(
  '/path/to/extensions',
  logger
);

// Initialize
await extensionManager.initialize();

// Load an extension
const result = await extensionManager.loadExtension('/path/to/my-extension');
if (result.success) {
  console.log(`Extension loaded: ${result.extension.name}`);
}

// Get loaded extensions
const extensions = extensionManager.getAllExtensions();
console.log(`${extensions.length} extensions loaded`);
```

### Advanced Configuration

```typescript
import {
  ExtensionSystemFactory,
  ExtensionSystemConfig,
} from '@the-new-fuse/extension-system';

const config: ExtensionSystemConfig = {
  extensionDirectory: './extensions',
  configDirectory: './config',
  logDirectory: './logs',
  tempDirectory: './temp',
  enableAutoUpdate: true,
  enableSandboxing: true,
  maxLoadTime: 30000,
  maxMemoryUsage: 128 * 1024 * 1024,
  allowDevelopmentExtensions: process.env.NODE_ENV === 'development',
  trustedSources: ['@my-org/', 'https://my-registry.com/'],
};

const extensionManager = ExtensionSystemFactory.create(
  config,
  logger,
  agentRegistry, // Optional: integrate with agents
  workflowEngine // Optional: integrate with workflows
);
```

## Creating Extensions

### Extension Manifest

Every extension needs an `extension.json` manifest file:

```json
{
  "name": "@my-org/my-extension",
  "version": "1.0.0",
  "description": "My custom extension",
  "type": "workflow_node",
  "category": "workflow",
  "main": "index.js",
  "author": "Your Name",
  "license": "MIT",
  "keywords": ["workflow", "custom"],
  "permissions": ["workflow_modify"],
  "configuration": {
    "schema": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true }
      }
    }
  },
  "dependencies": {
    "@the-new-fuse/workflow-engine": "^1.0.0"
  }
}
```

### Workflow Node Extension

```typescript
// index.ts
import {
  WorkflowNode,
  ExtensionLifecycle,
  ExtensionContext,
} from '@the-new-fuse/extension-system/types';

export class MyCustomNode implements ExtensionLifecycle {
  private config: any;

  async onLoad(context: ExtensionContext): Promise<void> {
    this.config = context.getConfig();
    console.log('Extension loaded');
  }

  async execute(input: any, context: any): Promise<any> {
    // Custom node logic
    return {
      processed: true,
      timestamp: new Date(),
      input,
    };
  }

  async onUnload(context: ExtensionContext): Promise<void> {
    console.log('Extension unloaded');
  }
}

export default MyCustomNode;
```

### Agent Capability Extension

```typescript
// capability.ts
import {
  AgentCapabilityExtension,
  ExtensionLifecycle,
} from '@the-new-fuse/extension-system/types';

export class DataAnalysisCapability implements ExtensionLifecycle {
  private agent: any;

  async onLoad(context: ExtensionContext): Promise<void> {
    console.log('Data analysis capability loaded');
  }

  async onActivate(context: ExtensionContext): Promise<void> {
    // Register with agent registry
    this.agent = context.agentRegistry;
  }

  async analyzeData(data: any[], options: any = {}): Promise<any> {
    // Implement data analysis logic
    return {
      mean: data.reduce((a, b) => a + b, 0) / data.length,
      count: data.length,
      analysis: 'completed',
    };
  }
}

export default DataAnalysisCapability;
```

### NestJS Module Extension

```typescript
// module.ts
import { Module } from '@nestjs/common';
import { ExtensionLifecycle } from '@the-new-fuse/extension-system/types';

@Module({
  providers: [MyService],
  controllers: [MyController],
  exports: [MyService],
})
export class MyExtensionModule implements ExtensionLifecycle {
  async onLoad(context: ExtensionContext): Promise<void> {
    console.log('NestJS module extension loaded');
  }
}

export default MyExtensionModule;
```

## Extension API

### Managing Extensions

```typescript
// Load extension
const result = await extensionManager.loadExtension('./my-extension', {
  skipValidation: false,
  configOverrides: { enabled: true },
});

// Activate extension
await extensionManager.activateExtension('my-extension@1.0.0');

// Configure extension
await extensionManager.setExtensionConfig('my-extension@1.0.0', {
  apiKey: 'secret',
  timeout: 5000,
});

// Unload extension
await extensionManager.unloadExtension('my-extension@1.0.0');
```

### Searching Extensions

```typescript
// Search by type
const workflowExtensions =
  extensionManager.getExtensionsByType('workflow_node');

// Search by category
const agentExtensions = extensionManager.getExtensionsByCategory('agent');

// Advanced search
const searchResult = await registry.searchExtensions({
  name: 'data',
  category: 'analytics',
  minRating: 4.0,
  limit: 10,
  sortBy: 'rating',
  sortOrder: 'desc',
});
```

### Event Handling

```typescript
// Listen for extension events
extensionManager.onExtensionEvent((event) => {
  switch (event.type) {
    case 'extension_loaded':
      console.log(`Extension loaded: ${event.extensionId}`);
      break;
    case 'extension_error':
      console.error(`Extension error: ${event.data.error}`);
      break;
  }
});

// Get extension statistics
const stats = extensionManager.getExtensionStats();
console.log(`${stats.active} active extensions`);
```

## Security Model

### Permission System

Extensions must declare required permissions:

```json
{
  "permissions": [
    "filesystem_read",
    "network_access",
    "agent_control",
    "workflow_modify"
  ]
}
```

Available permissions:

- `filesystem_read` / `filesystem_write`
- `network_access`
- `database_access`
- `agent_control`
- `workflow_modify`
- `system_info`
- `user_data`
- `sensitive_data`

### Sandboxing

Extensions run in secure sandboxes with resource limits:

```typescript
const sandbox = {
  environment: 'node', // or 'worker', 'iframe'
  resourceLimits: {
    memory: 128 * 1024 * 1024, // 128MB
    cpu: 80, // 80% CPU limit
    time: 30000, // 30 seconds
    network: true,
    filesystem: false,
  },
};
```

### Security Scanning

The validator performs comprehensive security scans:

```typescript
const securityResult = await validator.performSecurityScan(
  manifest,
  extensionPath
);
if (!securityResult.safe) {
  console.warn('Security issues found:', securityResult.issues);
}
```

## Migration Guide

### From Existing NestJS Modules

```typescript
import { ExtensionSystemIntegrator } from '@the-new-fuse/extension-system';

const integrator = new ExtensionSystemIntegrator(extensionManager, logger);

// Migrate existing modules
await integrator.migrateNestJSModules([MyModule1, MyModule2, MyModule3]);
```

### From Custom Plugin Systems

1. **Create Extension Manifest**: Convert plugin metadata to extension manifest
2. **Implement Lifecycle**: Add `onLoad`, `onUnload` hooks
3. **Update Permissions**: Declare required permissions
4. **Test Migration**: Validate functionality after conversion

## Development Tools

### Generate Extension Template

```typescript
import { ExtensionDevelopmentUtils } from '@the-new-fuse/extension-system';

// Generate workflow node template
const template = ExtensionDevelopmentUtils.generateExtensionTemplate(
  'workflow-node',
  'data-processor'
);

// Write template files
for (const [filename, content] of Object.entries(template)) {
  await fs.writeFile(filename, content);
}
```

### Validation During Development

```typescript
// Validate extension structure
const validation =
  ExtensionDevelopmentUtils.validateExtensionStructure('./my-extension');
if (!validation.valid) {
  console.error('Validation issues:', validation.issues);
}
```

## Best Practices

### Extension Development

1. **Keep Extensions Small**: Focus on single responsibility
2. **Declare Minimal Permissions**: Only request necessary permissions
3. **Handle Errors Gracefully**: Implement proper error handling
4. **Document APIs**: Provide clear documentation
5. **Test Thoroughly**: Include comprehensive tests

### Security Considerations

1. **Validate Input**: Always validate external input
2. **Sanitize Data**: Prevent injection attacks
3. **Limit Resource Usage**: Respect memory and CPU limits
4. **Use HTTPS**: Encrypt network communications
5. **Regular Updates**: Keep dependencies updated

### Performance Optimization

1. **Lazy Loading**: Load resources only when needed
2. **Cache Results**: Cache expensive operations
3. **Optimize Bundle Size**: Minimize extension size
4. **Profile Memory Usage**: Monitor resource consumption
5. **Async Operations**: Use non-blocking operations

## Integration Examples

### With Workflow Engine

```typescript
// Register custom workflow node
extensionManager.onExtensionEvent(async (event) => {
  if (
    event.type === 'extension_loaded' &&
    event.data.extension.type === 'workflow_node'
  ) {
    const extension = event.data.extension;
    await workflowEngine.registerNodeType(
      extension.nodeType,
      extension.nodeClass
    );
  }
});
```

### With Agent Registry

```typescript
// Register agent capability
extensionManager.onExtensionEvent(async (event) => {
  if (
    event.type === 'extension_loaded' &&
    event.data.extension.type === 'agent_capability'
  ) {
    const extension = event.data.extension;
    await agentRegistry.registerCapability(
      extension.capabilityName,
      extension.capabilityClass
    );
  }
});
```

## API Reference

### ExtensionManager

```typescript
interface ExtensionAPI {
  loadExtension(
    path: string,
    options?: ExtensionLoadOptions
  ): Promise<ExtensionLoadResult>;
  unloadExtension(id: string): Promise<boolean>;
  activateExtension(id: string): Promise<boolean>;
  deactivateExtension(id: string): Promise<boolean>;
  getExtension(id: string): UnifiedExtension | null;
  getAllExtensions(): UnifiedExtension[];
  getExtensionsByType(type: ExtensionType): UnifiedExtension[];
  setExtensionConfig(id: string, config: Record<string, any>): Promise<boolean>;
  getExtensionStats(): ExtensionStats;
}
```

### Extension Lifecycle

```typescript
interface ExtensionLifecycle {
  onLoad?(context: ExtensionContext): Promise<void> | void;
  onUnload?(context: ExtensionContext): Promise<void> | void;
  onActivate?(context: ExtensionContext): Promise<void> | void;
  onDeactivate?(context: ExtensionContext): Promise<void> | void;
  onConfigChange?(
    config: Record<string, any>,
    context: ExtensionContext
  ): Promise<void> | void;
  onError?(error: Error, context: ExtensionContext): Promise<void> | void;
}
```

## Contributing

See the main [Contributing Guide](../../CONTRIBUTING.md) for development setup
and guidelines.

## License

MIT - see [LICENSE](../../LICENSE) for details.
