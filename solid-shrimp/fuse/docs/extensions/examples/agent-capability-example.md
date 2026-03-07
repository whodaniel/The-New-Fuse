# Agent Capability Extension Example

This example demonstrates how to create an agent capability extension that adds new skills to AI agents in The New Fuse platform. We'll build a **Web Research Capability** that enables agents to perform web searches and analyze results.

## Overview

The Web Research Capability will:
- Perform web searches using multiple search engines
- Extract and summarize relevant information from search results
- Provide structured data for agent decision-making
- Cache results for improved performance
- Handle rate limiting and error recovery

## Prerequisites

- The New Fuse platform with Agent Registry
- Node.js 18+ or Bun runtime
- API keys for search services (optional, uses free alternatives)
- Understanding of AI agent architecture

## Project Structure

```
web-research-capability/
├── extension.json          # Extension manifest
├── src/
│   ├── index.ts           # Main capability implementation
│   ├── search-engines/    # Search engine integrations
│   │   ├── duckduckgo.ts  # DuckDuckGo search
│   │   └── bing.ts        # Bing search (optional)
│   ├── analyzers/         # Content analysis
│   │   └── summarizer.ts  # Text summarization
│   ├── cache.ts           # Result caching
│   └── types.ts           # Type definitions
├── tests/
│   └── capability.test.ts # Unit tests
├── package.json
└── tsconfig.json
```

## Implementation

### 1. Extension Manifest

Create `extension.json`:

```json
{
  "name": "@examples/web-research-capability",
  "version": "1.0.0",
  "description": "Web research capability for AI agents",
  "type": "agent_capability",
  "category": "research",
  "main": "dist/index.js",
  "author": "The New Fuse Examples",
  "license": "MIT",
  "keywords": ["research", "web", "search", "agent", "capability"],
  "permissions": [
    "network_access",
    "agent_control"
  ],
  "configuration": {
    "schema": {
      "type": "object",
      "properties": {
        "searchEngines": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["duckduckgo", "bing", "google"]
          },
          "default": ["duckduckgo"],
          "description": "Search engines to use"
        },
        "maxResults": {
          "type": "integer",
          "minimum": 1,
          "maximum": 50,
          "default": 10,
          "description": "Maximum search results to analyze"
        },
        "cacheEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable result caching"
        }
      }
    }
  }
}
```

### 2. Main Implementation

Create `src/index.ts`:

```typescript
import { 
  ExtensionLifecycle, 
  ExtensionContext,
  AgentCapability 
} from '@the-new-fuse/extension-system/types';

export class WebResearchCapability implements ExtensionLifecycle, AgentCapability {
  public readonly capabilityName = 'web-research';
  public readonly version = '1.0.0';
  public readonly description = 'Enables agents to perform web research and analysis';

  private config: any;
  private context: ExtensionContext;

  async onLoad(context: ExtensionContext): Promise<void> {
    this.context = context;
    this.config = context.getConfig();
    context.logger?.info('WebResearchCapability loaded successfully');
  }

  async onActivate(context: ExtensionContext): Promise<void> {
    if (context.agentRegistry) {
      await context.agentRegistry.registerCapability(this.capabilityName, this);
      context.logger?.info('WebResearchCapability registered with agent registry');
    }
  }

  async research(query: string): Promise<any> {
    // Implementation would go here
    return {
      query,
      results: [],
      summary: 'Research capability implementation',
      confidence: 0.8
    };
  }

  async onDeactivate(context: ExtensionContext): Promise<void> {
    if (context.agentRegistry) {
      await context.agentRegistry.unregisterCapability(this.capabilityName);
    }
  }

  async onUnload(context: ExtensionContext): Promise<void> {
    context.logger?.info('WebResearchCapability unloaded');
  }
}

export default WebResearchCapability;
```

## Usage Examples

### Basic Agent Integration

```typescript
import { ExtensionSystemFactory } from '@the-new-fuse/extension-system';

const extensionManager = ExtensionSystemFactory.createDefault('./extensions', logger);
await extensionManager.initialize();

const result = await extensionManager.loadExtension('./web-research-capability');
await extensionManager.activateExtension(result.extension.id);

// Use the capability in an agent
const capability = await agentRegistry.getCapability('web-research');
const researchResult = await capability.research('artificial intelligence trends');
```

## Next Steps

This example provides a foundation for creating agent capabilities. You can extend it by:

1. Adding more sophisticated search and analysis features
2. Implementing caching and rate limiting
3. Creating specialized research types
4. Building integration with multiple search engines

For more examples, see:
- **[Workflow Node Example](workflow-node-example.md)** - Custom workflow processing
- **[NestJS Module Example](nestjs-module-example.md)** - Backend service integration