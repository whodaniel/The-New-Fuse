# Getting Started with Extensions

This guide will walk you through creating your first extension for The New Fuse platform. You'll learn the basics of extension development, from setup to deployment.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** or **Bun runtime** installed
- **The New Fuse platform** set up and running
- **Basic TypeScript knowledge** (recommended)
- **Text editor or IDE** (VS Code recommended)

## Extension Development Environment

### 1. Set Up Your Development Environment

```bash
# Navigate to your extensions directory
cd extensions/

# Create a new extension directory
mkdir my-first-extension
cd my-first-extension

# Initialize the extension
pnpm init -y
```

### 2. Install Extension Dependencies

```bash
# Install The New Fuse extension types
pnpm install --save-dev @the-new-fuse/extension-system

# Install other common dependencies
pnpm install --save-dev typescript @types/node
```

### 3. Create Extension Structure

Create the following directory structure:

```
my-first-extension/
├── extension.json          # Extension manifest
├── src/
│   └── index.ts           # Main extension code
├── package.json           # Node.js package configuration
└── tsconfig.json          # TypeScript configuration
```

## Creating Your First Extension

Let's create a simple workflow node extension that processes text data.

### 1. Create the Extension Manifest

Create `extension.json`:

```json
{
  "name": "@my-org/my-first-extension",
  "version": "1.0.0",
  "description": "My first extension for The New Fuse",
  "type": "workflow_node",
  "category": "data_processing",
  "main": "dist/index.js",
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "keywords": ["text", "processing", "example"],
  "permissions": [
    "workflow_modify"
  ],
  "configuration": {
    "schema": {
      "type": "object",
      "properties": {
        "prefix": {
          "type": "string",
          "default": "Processed: ",
          "description": "Prefix to add to processed text"
        },
        "uppercase": {
          "type": "boolean",
          "default": false,
          "description": "Convert text to uppercase"
        }
      }
    }
  },
  "dependencies": {
    "@the-new-fuse/workflow-engine": "^1.0.0"
  }
}
```

### 2. Create TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. Implement the Extension

Create `src/index.ts`:

```typescript
import { 
  ExtensionLifecycle, 
  ExtensionContext,
  WorkflowNode 
} from '@the-new-fuse/extension-system/types';

interface TextProcessorConfig {
  prefix: string;
  uppercase: boolean;
}

interface TextProcessorInput {
  text: string;
  metadata?: Record<string, any>;
}

interface TextProcessorOutput {
  processedText: string;
  originalText: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class TextProcessorNode implements ExtensionLifecycle, WorkflowNode {
  private config: TextProcessorConfig;
  private context: ExtensionContext;

  constructor() {
    // Default configuration
    this.config = {
      prefix: 'Processed: ',
      uppercase: false
    };
  }

  /**
   * Extension Lifecycle: Called when extension is loaded
   */
  async onLoad(context: ExtensionContext): Promise<void> {
    this.context = context;
    this.config = { ...this.config, ...context.getConfig() };
    
    context.logger?.info('TextProcessorNode extension loaded');
  }

  /**
   * Extension Lifecycle: Called when extension is activated
   */
  async onActivate(context: ExtensionContext): Promise<void> {
    context.logger?.info('TextProcessorNode extension activated');
  }

  /**
   * Extension Lifecycle: Called when configuration changes
   */
  async onConfigChange(
    config: Record<string, any>, 
    context: ExtensionContext
  ): Promise<void> {
    this.config = { ...this.config, ...config };
    context.logger?.info('TextProcessorNode configuration updated');
  }

  /**
   * Workflow Node: Main processing method
   */
  async execute(
    input: TextProcessorInput, 
    context: any
  ): Promise<TextProcessorOutput> {
    const { text, metadata } = input;
    
    // Apply text processing based on configuration
    let processedText = text;
    
    // Add prefix if configured
    if (this.config.prefix) {
      processedText = this.config.prefix + processedText;
    }
    
    // Convert to uppercase if configured
    if (this.config.uppercase) {
      processedText = processedText.toUpperCase();
    }
    
    // Log processing activity
    this.context.logger?.debug(`Processed text: "${text}" -> "${processedText}"`);
    
    return {
      processedText,
      originalText: text,
      timestamp: new Date().toISOString(),
      metadata
    };
  }

  /**
   * Extension Lifecycle: Called when extension is deactivated
   */
  async onDeactivate(context: ExtensionContext): Promise<void> {
    context.logger?.info('TextProcessorNode extension deactivated');
  }

  /**
   * Extension Lifecycle: Called when extension is unloaded
   */
  async onUnload(context: ExtensionContext): Promise<void> {
    context.logger?.info('TextProcessorNode extension unloaded');
  }

  /**
   * Extension Lifecycle: Called when an error occurs
   */
  async onError(error: Error, context: ExtensionContext): Promise<void> {
    context.logger?.error(`TextProcessorNode error: ${error.message}`);
  }
}

// Export the extension class as default
export default TextProcessorNode;
```

### 4. Build the Extension

Add build scripts to your `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rm -rf dist"
  }
}
```

Build your extension:

```bash
pnpm run build
```

## Loading and Testing Your Extension

### 1. Load the Extension

```typescript
import { ExtensionSystemFactory } from '@the-new-fuse/extension-system';
import { Logger } from '@the-new-fuse/relay-core';

const logger = new Logger();
const extensionManager = ExtensionSystemFactory.createDefault(
  './extensions',
  logger
);

await extensionManager.initialize();

// Load your extension
const result = await extensionManager.loadExtension('./my-first-extension');

if (result.success) {
  console.log(`Extension loaded: ${result.extension.name}`);
  
  // Activate the extension
  await extensionManager.activateExtension(result.extension.id);
} else {
  console.error('Failed to load extension:', result.error);
}
```

### 2. Test the Extension

```typescript
// Get the loaded extension
const extension = extensionManager.getExtension('@my-org/my-first-extension@1.0.0');

if (extension && extension.instance) {
  // Test the workflow node functionality
  const testInput = {
    text: 'Hello, World!',
    metadata: { source: 'test' }
  };
  
  const result = await extension.instance.execute(testInput, {});
  console.log('Processing result:', result);
  // Output: { processedText: 'Processed: Hello, World!', ... }
}
```

### 3. Configure the Extension

```typescript
// Update extension configuration
await extensionManager.setExtensionConfig('@my-org/my-first-extension@1.0.0', {
  prefix: 'Custom Prefix: ',
  uppercase: true
});

// Test with new configuration
const result2 = await extension.instance.execute({ text: 'hello world' }, {});
console.log('Result with config:', result2);
// Output: { processedText: 'CUSTOM PREFIX: HELLO WORLD', ... }
```

## Integration with Workflows

Once your extension is loaded, it can be used in workflows:

```typescript
// Example workflow definition that uses your extension
const workflowDefinition = {
  id: 'text-processing-workflow',
  name: 'Text Processing Workflow',
  nodes: [
    {
      id: 'input',
      type: 'input',
      config: {}
    },
    {
      id: 'text-processor',
      type: '@my-org/my-first-extension',  // Your extension
      config: {
        prefix: 'Workflow: ',
        uppercase: false
      }
    },
    {
      id: 'output',
      type: 'output',
      config: {}
    }
  ],
  connections: [
    { from: 'input', to: 'text-processor' },
    { from: 'text-processor', to: 'output' }
  ]
};
```

## Debugging and Development Tips

### 1. Enable Debug Logging

```typescript
// Enable debug logging for your extension
const extensionManager = ExtensionSystemFactory.create({
  extensionDirectory: './extensions',
  logLevel: 'debug'
}, logger);
```

### 2. Use Development Mode

```typescript
// Enable development mode for hot reloading
const extensionManager = ExtensionSystemFactory.create({
  extensionDirectory: './extensions',
  allowDevelopmentExtensions: true,
  enableHotReload: true
}, logger);
```

### 3. Validate Your Extension

```typescript
import { ExtensionValidator } from '@the-new-fuse/extension-system';

const validator = new ExtensionValidator(logger);
const validation = await validator.validateExtension('./my-first-extension');

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## Next Steps

Congratulations! You've created your first extension. Here are some next steps:

### 1. Explore More Extension Types

- **[Agent Capability Example](examples/agent-capability-example.md)** - Add skills to AI agents
- **[NestJS Module Example](examples/workflow-node-example.md)** - Backend service integration
- **[API Integration Example](examples/agent-capability-example.md)** - External service connectors

### 2. Learn Advanced Features

- **[Development Guide](../guides/development-workflow.md)** - Advanced extension development
- **[Security Model](../security/SECURITY_BEST_PRACTICES.md)** - Security best practices
- **[Integration Patterns](../guides/MCP-INTEGRATION-GUIDE-component-analysis.md)** - Platform integration patterns

### 3. Publish Your Extension

- **[Publishing Guide](../README.md)** - Share your extension with others
- **[Extension Registry](../AVAILABLE_AGENTS_REGISTRY.md)** - Submit to the official registry

### 4. Get Help

- **[API Reference](../API_DOCUMENTATION_README.md)** - Complete API documentation
- **[Troubleshooting](../troubleshooting/MCP-TROUBLESHOOTING-COMPLETE.md)** - Common issues and solutions
- **[Community](https://github.com/the-new-fuse/framework/discussions)** - Ask questions and share ideas

## Common Patterns

### Error Handling

```typescript
async execute(input: any, context: any): Promise<any> {
  try {
    // Your processing logic
    return await this.processData(input);
  } catch (error) {
    // Log the error
    this.context.logger?.error(`Processing failed: ${error.message}`);
    
    // Return error result
    return {
      success: false,
      error: error.message,
      input
    };
  }
}
```

### Async Operations

```typescript
async execute(input: any, context: any): Promise<any> {
  // Use async/await for external API calls
  const response = await fetch('https://api.example.com/process', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  
  return await response.json();
}
```

### Configuration Validation

```typescript
async onConfigChange(config: Record<string, any>, context: ExtensionContext): Promise<void> {
  // Validate configuration
  if (!config.apiKey) {
    throw new Error('API key is required');
  }
  
  if (config.timeout && config.timeout < 1000) {
    throw new Error('Timeout must be at least 1000ms');
  }
  
  this.config = { ...this.config, ...config };
}
```

You're now ready to build powerful extensions for The New Fuse platform!