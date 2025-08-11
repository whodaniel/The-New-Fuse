/**
 * Integrated MCP System Example
 * 
 * This example demonstrates how to use the MCPSystemFactory to create
 * a fully integrated MCP system with all components working together.
 */

import { MCPSystemFactory, MCPSystemConfig } from '../src/factory/MCPSystemFactory';
import { LogLevel } from '../src/types/common';

async function createIntegratedMCPSystem() {
  console.log('🚀 Creating Integrated MCP System...');

  // Create a development system with custom configuration
  const customConfig: Partial<MCPSystemConfig> = {
    server: {
      name: 'integrated-mcp-example',
      version: '1.0.0',
      port: 3002,
      host: 'localhost',
      maxConnections: 50,
      timeout: 30000,
      enableAuth: false,
      enableTLS: false,
      logLevel: LogLevel.INFO
    },
    relay: {
      enabled: true
    },
    workflow: {
      enabled: true
    },
    theia: {
      enabled: false // Disable for this example
    },
    development: {
      hotReload: true,
      debugMode: true,
      mockServices: false
    }
  };

  // Create the integrated system
  const mcpSystem = MCPSystemFactory.createDevelopmentSystem(customConfig);

  try {
    // Start the system
    await mcpSystem.start();
    console.log('✅ MCP System started successfully');

    // Register some example resources
    await mcpSystem.registerResource({
      uri: 'example://greeting',
      name: 'Greeting Resource',
      description: 'A simple greeting resource for demonstration',
      handler: {
        async read(uri: string) {
          return {
            uri,
            mimeType: 'text/plain',
            content: `Hello from integrated MCP system! Time: ${new Date().toISOString()}`,
            metadata: {
              generated: new Date(),
              systemInfo: 'Integrated MCP System Example'
            }
          };
        }
      }
    });

    await mcpSystem.registerResource({
      uri: 'example://data',
      name: 'Sample Data Resource',
      description: 'Sample JSON data resource',
      handler: {
        async read(uri: string) {
          const sampleData = {
            message: 'This is sample data from the integrated MCP system',
            timestamp: new Date().toISOString(),
            systemStatus: 'operational',
            features: ['resources', 'tools', 'workflows', 'monitoring']
          };

          return {
            uri,
            mimeType: 'application/json',
            content: JSON.stringify(sampleData, null, 2),
            metadata: {
              generated: new Date(),
              dataType: 'sample'
            }
          };
        }
      }
    });

    // Register some example tools
    await mcpSystem.registerTool({
      name: 'echo',
      description: 'Echo back the input message with system info',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        },
        required: ['message']
      },
      handler: {
        async execute(params: { message: string }) {
          const systemHealth = await mcpSystem.getHealth();
          
          return {
            success: true,
            result: {
              echo: params.message,
              timestamp: new Date().toISOString(),
              systemHealth: systemHealth.status,
              uptime: systemHealth.uptime
            }
          };
        }
      }
    });

    await mcpSystem.registerTool({
      name: 'calculate',
      description: 'Perform basic arithmetic calculations',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'] },
          a: { type: 'number' },
          b: { type: 'number' }
        },
        required: ['operation', 'a', 'b']
      },
      handler: {
        async execute(params: { operation: string; a: number; b: number }) {
          let result: number;
          
          switch (params.operation) {
            case 'add':
              result = params.a + params.b;
              break;
            case 'subtract':
              result = params.a - params.b;
              break;
            case 'multiply':
              result = params.a * params.b;
              break;
            case 'divide':
              if (params.b === 0) {
                return {
                  success: false,
                  error: 'Division by zero is not allowed'
                };
              }
              result = params.a / params.b;
              break;
            default:
              return {
                success: false,
                error: `Unknown operation: ${params.operation}`
              };
          }

          return {
            success: true,
            result: {
              operation: params.operation,
              operands: [params.a, params.b],
              result,
              timestamp: new Date().toISOString()
            }
          };
        }
      }
    });

    console.log('✅ Resources and tools registered');

    // Display system information
    const health = await mcpSystem.getHealth();
    const metrics = await mcpSystem.getMetrics();
    
    console.log('\n📊 System Status:');
    console.log(`  Status: ${health.status}`);
    console.log(`  Uptime: ${health.uptime}ms`);
    console.log(`  Components: ${Object.keys(health.components).join(', ')}`);
    
    console.log('\n📈 System Metrics:');
    console.log(`  Resources: ${metrics.resources.registered} registered`);
    console.log(`  Tools: ${metrics.tools.registered} registered`);
    console.log(`  Active Connections: ${metrics.connections.active}`);

    // Test some basic requests
    console.log('\n🧪 Testing system functionality...');

    // Test server ping
    const pingResponse = await mcpSystem.server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'server/ping'
    });
    console.log('🏓 Ping response:', pingResponse.result);

    // Test resource access
    const resourceResponse = await mcpSystem.server.handleRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/read',
      params: { uri: 'example://greeting' }
    });
    console.log('📖 Resource content:', resourceResponse.result?.content);

    // Test tool execution
    const toolResponse = await mcpSystem.server.handleRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { 
        name: 'echo', 
        arguments: { message: 'Hello from integrated system!' } 
      }
    });
    console.log('🔧 Tool result:', toolResponse.result);

    // Test calculation tool
    const calcResponse = await mcpSystem.server.handleRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { 
        name: 'calculate', 
        arguments: { operation: 'multiply', a: 7, b: 6 } 
      }
    });
    console.log('🧮 Calculation result:', calcResponse.result);

    // Test system health tool
    const healthResponse = await mcpSystem.server.handleRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { 
        name: 'system-health', 
        arguments: { detailed: true } 
      }
    });
    console.log('🏥 System health check:', healthResponse.result?.result?.health?.status);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 System Components Available:');
    const components = mcpSystem.getComponents();
    console.log(`  - MCP Server: ${components.server ? '✅' : '❌'}`);
    console.log(`  - Database: ${components.database ? '✅' : '❌'}`);
    console.log(`  - Relay: ${components.relay ? '✅' : '❌'}`);
    console.log(`  - Workflow: ${components.workflow ? '✅' : '❌'}`);

    console.log('\n⏳ System will stop in 10 seconds...');
    setTimeout(async () => {
      await mcpSystem.stop();
      console.log('🛑 System stopped');
      process.exit(0);
    }, 10000);

  } catch (error) {
    console.error('❌ Error:', error);
    if (mcpSystem.server.isRunning()) {
      await mcpSystem.stop();
    }
    process.exit(1);
  }
}

// Different system configurations for various use cases
async function demonstrateSystemVariants() {
  console.log('\n🎯 Demonstrating different system configurations...');

  // Production system configuration
  console.log('\n1. Production System Configuration:');
  const prodSystem = MCPSystemFactory.createProductionSystem({
    server: {
      name: 'production-mcp-server',
      version: '1.0.0',
      port: 3000,
      host: '0.0.0.0',
      maxConnections: 1000,
      timeout: 30000,
      enableAuth: true,
      enableTLS: true,
      logLevel: LogLevel.WARN
    }
  });
  console.log('   ✅ Production system created (not started)');

  // Testing system configuration
  console.log('\n2. Testing System Configuration:');
  const testSystem = MCPSystemFactory.createTestingSystem();
  console.log('   ✅ Testing system created (not started)');

  // Custom system configuration
  console.log('\n3. Custom System Configuration:');
  const customSystem = MCPSystemFactory.createCustomSystem({
    server: {
      name: 'custom-mcp-server',
      version: '2.0.0-beta',
      port: 4000,
      host: 'localhost',
      maxConnections: 200,
      timeout: 60000,
      enableAuth: false,
      enableTLS: false,
      logLevel: LogLevel.DEBUG
    },
    relay: {
      enabled: true
    },
    workflow: {
      enabled: true
    },
    theia: {
      enabled: true,
      port: 3006,
      aiFeatures: true
    },
    monitoring: {
      enabled: true,
      metricsPort: 9090,
      prometheusEnabled: true
    },
    development: {
      hotReload: false,
      debugMode: true,
      mockServices: false
    }
  });
  console.log('   ✅ Custom system created (not started)');

  console.log('\n🎉 All system variants demonstrated successfully!');
}

// Run the example
if (require.main === module) {
  createIntegratedMCPSystem()
    .then(() => demonstrateSystemVariants())
    .catch(console.error);
}

export { createIntegratedMCPSystem, demonstrateSystemVariants };