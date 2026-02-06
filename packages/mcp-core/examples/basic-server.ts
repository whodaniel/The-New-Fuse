/**
 * Basic MCP Server Example
 *
 * This example demonstrates how to create and use a basic MCP server
 * with resource and tool registration.
 */

import { MCPServer } from '../src/server/MCPServer';
import { LogLevel } from '../src/types/common';
import { MCPServerConfig } from '../src/types/server';

async function createBasicMCPServer() {
  // Create server instance
  const server = new MCPServer();

  // Configure server
  const config: MCPServerConfig = {
    name: 'example-mcp-server',
    version: '1.0.0',
    port: 3000,
    host: 'localhost',
    maxConnections: 100,
    timeout: 30000,
    enableAuth: false,
    enableTLS: false,
    logLevel: LogLevel.INFO,
  };

  try {
    // Start the server
    await server.start(config);
    console.log('✅ MCP Server started successfully');

    // Register a simple resource
    server.registerResource({
      uri: 'example://greeting',
      name: 'Greeting Resource',
      description: 'A simple greeting resource',
      handler: {
        async read(uri: string) {
          return {
            uri,
            mimeType: 'text/plain',
            content: 'Hello from MCP Server!',
            metadata: {
              timestamp: new Date().toISOString(),
            },
          };
        },
      },
    });

    // Register a simple tool
    server.registerTool({
      name: 'echo',
      description: 'Echo back the input message',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
        required: ['message'],
      },
      handler: {
        async execute(params: { message: string }) {
          return {
            success: true,
            result: `Echo: ${params.message}`,
            timestamp: new Date().toISOString(),
          };
        },
      },
    });

    console.log('✅ Resources and tools registered');

    // Display server information
    const serverInfo = server.getServerInfo();
    console.log('📊 Server Info:', {
      name: serverInfo.name,
      version: serverInfo.version,
      status: serverInfo.status,
      capabilities: serverInfo.capabilities,
      resourceCount: serverInfo.metadata?.resourceCount,
      toolCount: serverInfo.metadata?.toolCount,
    });

    // Test some basic requests
    console.log('\n🧪 Testing basic requests...');

    // Test server ping
    const pingResponse = await server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'server/ping',
    });
    console.log('🏓 Ping response:', pingResponse.result);

    // Test resource list
    const resourcesResponse = await server.handleRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/list',
    });
    console.log('📋 Resources:', resourcesResponse.result);

    // Test resource read
    const readResponse = await server.handleRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'resources/read',
      params: { uri: 'example://greeting' },
    });
    console.log('📖 Resource content:', readResponse.result);

    // Test tool call
    const toolResponse = await server.handleRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'echo',
        arguments: { message: 'Hello MCP!' },
      },
    });
    console.log('🔧 Tool result:', toolResponse.result);

    console.log('\n✅ All tests completed successfully!');

    // Keep server running for a bit
    console.log('\n⏳ Server will stop in 5 seconds...');
    setTimeout(async () => {
      await server.stop();
      console.log('🛑 Server stopped');
    }, 5000);
  } catch (error) {
    console.error('❌ Error:', error);
    if (server.isRunning()) {
      await server.stop();
    }
  }
}

// Run the example
if (require.main === module) {
  createBasicMCPServer().catch(console.error);
}

export { createBasicMCPServer };
