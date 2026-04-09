# MCP Core Usage Examples

This document provides comprehensive usage examples for common MCP integration patterns and real-world scenarios.

## Table of Contents

- [Quick Start Examples](#quick-start-examples)
- [Server Implementation Patterns](#server-implementation-patterns)
- [Client Integration Patterns](#client-integration-patterns)
- [Resource Management Examples](#resource-management-examples)
- [Tool Development Examples](#tool-development-examples)
- [Authentication & Security](#authentication--security)
- [Performance Optimization](#performance-optimization)
- [Error Handling Patterns](#error-handling-patterns)
- [Testing Examples](#testing-examples)
- [Production Deployment](#production-deployment)

## Quick Start Examples

### Basic Echo Server

```typescript
import { MCPSystemFactory, ToolHandler } from '@the-new-fuse/mcp-core';

// Simple echo tool
class EchoTool extends ToolHandler {
  name = 'echo';
  
  async execute(params: { message: string }): Promise<any> {
    return {
      echo: params.message,
      timestamp: new Date().toISOString(),
      length: params.message.length
    };
  }
  
  async validate(params: any): Promise<boolean> {
    return typeof params?.message === 'string';
  }
}

// Create and start server
async function startEchoServer() {
  const server = MCPSystemFactory.createServer({
    name: 'echo-server',
    version: '1.0.0',
    port: 8080
  });

  await server.registerTool({
    name: 'echo',
    description: 'Echoes back the provided message',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', maxLength: 1000 }
      },
      required: ['message']
    }
  }, new EchoTool());

  await server.start();
  console.log('Echo server running on port 8080');
}

startEchoServer().catch(console.error);
```

### Basic Client Usage

```typescript
import { MCPSystemFactory } from '@the-new-fuse/mcp-core';

async function useEchoClient() {
  const client = MCPSystemFactory.createClient({
    serverUrl: 'ws://localhost:8080',
    connectionTimeout: 5000
  });

  try {
    await client.connect();
    
    const result = await client.callTool('echo', {
      message: 'Hello, MCP!'
    });
    
    console.log('Echo result:', result);
  } finally {
    await client.disconnect();
  }
}

useEchoClient().catch(console.error);
```

## Server Implementation Patterns

### Multi-Service MCP Server

```typescript
import { MCPSystemFactory, ResourceHandler, ToolHandler } from '@the-new-fuse/mcp-core';
import { promises as fs } from 'fs';
import { join } from 'path';

// File system resource handler
class FileSystemHandler extends ResourceHandler {
  constructor(private basePath: string) {
    super();
  }

  async read(uri: string): Promise<any> {
    const filePath = this.uriToPath(uri);
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      content,
      mimeType: 'text/plain',
      size: content.length,
      lastModified: (await fs.stat(filePath)).mtime.toISOString()
    };
  }

  async list(pattern?: string): Promise<any[]> {
    const files = await fs.readdir(this.basePath);
    return files
      .filter(file => !pattern || file.includes(pattern))
      .map(file => ({
        uri: `file:///${file}`,
        name: file,
        mimeType: 'text/plain'
      }));
  }

  private uriToPath(uri: string): string {
    const url = new URL(uri);
    return join(this.basePath, url.pathname);
  }
}

// Text processing tool
class TextProcessorTool extends ToolHandler {
  name = 'text-processor';

  async execute(params: {
    text: string;
    operation: 'uppercase' | 'lowercase' | 'reverse' | 'wordcount';
  }): Promise<any> {
    const { text, operation } = params;

    switch (operation) {
      case 'uppercase':
        return { result: text.toUpperCase(), operation };
      case 'lowercase':
        return { result: text.toLowerCase(), operation };
      case 'reverse':
        return { result: text.split('').reverse().join(''), operation };
      case 'wordcount':
        return { 
          result: text.split(/\s+/).length, 
          operation,
          characters: text.length 
        };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  async validate(params: any): Promise<boolean> {
    return (
      typeof params?.text === 'string' &&
      ['uppercase', 'lowercase', 'reverse', 'wordcount'].includes(params?.operation)
    );
  }
}

// Create comprehensive server
async function createMultiServiceServer() {
  const server = MCPSystemFactory.createServer({
    name: 'multi-service-server',
    version: '1.0.0',
    port: 8080,
    maxConnections: 100,
    rateLimiting: {
      enabled: true,
      maxRequestsPerMinute: 1000,
      burstSize: 50
    }
  });

  // Register file system resources
  const fileHandler = new FileSystemHandler('./data');
  await server.registerResource({
    uri: 'file:///',
    name: 'File System',
    description: 'Local file system access',
    permissions: { read: true, write: false }
  }, fileHandler);

  // Register text processing tool
  await server.registerTool({
    name: 'text-processor',
    description: 'Processes text with various operations',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', minLength: 1 },
        operation: {
          type: 'string',
          enum: ['uppercase', 'lowercase', 'reverse', 'wordcount']
        }
      },
      required: ['text', 'operation']
    }
  }, new TextProcessorTool());

  // Add server capabilities
  await server.registerCapability({
    name: 'file-access',
    version: '1.0.0',
    description: 'File system access capability',
    methods: ['resources/list', 'resources/read']
  });

  await server.registerCapability({
    name: 'text-processing',
    version: '1.0.0',
    description: 'Text processing capability',
    methods: ['tools/call']
  });

  await server.start();
  console.log('Multi-service server running on port 8080');
  
  return server;
}
```

For more comprehensive examples, see the individual example files in the examples/ directory.