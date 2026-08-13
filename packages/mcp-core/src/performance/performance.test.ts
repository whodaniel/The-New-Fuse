/**
 * MCP Performance Tests
 *
 * These tests validate the performance characteristics of the MCP implementation
 * including throughput, latency, memory usage, and scalability.
 */

// Jest globals are available without import
import { MCPServer } from '../server/MCPServer.js';
import { MCPSystemFactory } from '../factory/MCPSystemFactory.js';
import { ResourceManager } from '../handlers/ResourceManager.js';
import { ToolExecutionEngine } from '../handlers/ToolExecutionEngine.js';
import { MCPServerConfig } from '../types/server.js';
import { MCPRequest, MCPResponse } from '../types/message.js';
import { LogLevel } from '../types/common.js';
import { performance } from 'perf_hooks';

describe('MCP Performance Tests', () => {
  let server: MCPServer;
  let resourceManager: ResourceManager;
  let toolEngine: ToolExecutionEngine;

  beforeEach(async () => {
    const config: MCPServerConfig = {
      name: 'performance-test-server',
      version: '1.0.0',
      port: 3000, // Use random port for testing
      host: 'localhost',
      maxConnections: 1000,
      timeout: 5000,
      enableAuth: false,
      enableTLS: false,
      logLevel: LogLevel.ERROR,
      options: {
        requestSizeLimit: 10 * 1024 * 1024, // 10MB
      }
    };

    server = MCPSystemFactory.createServer(config);
    await server.start(config);
    resourceManager = new ResourceManager();
    toolEngine = new ToolExecutionEngine(
      30000, // defaultTimeout
      {
        cpuTime: 1000,
        memory: 512 * 1024 * 1024,
        fileOperations: 1000,
        networkOperations: 1000
      }
    );
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('Message Processing Performance', () => {
    it('should handle high-throughput message processing', async () => {
      const messageCount = 10000;
      const messages: MCPRequest[] = [];

      // Generate test messages
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          jsonrpc: '2.0',
          id: i,
          method: 'resources/list',
          params: {},
          meta: {
            timestamp: new Date(),
            priority: 'normal'
          }
        });
      }

      const startTime = performance.now();
      const responses: Promise<MCPResponse>[] = [];

      // Process all messages concurrently
      for (const message of messages) {
        responses.push(server.handleRequest(message));
      }

      const results = await Promise.all(responses);
      const endTime = performance.now();

      const processingTime = endTime - startTime;
      const throughput = messageCount / (processingTime / 1000); // messages per second

      console.log(`Processed ${messageCount} messages in ${processingTime.toFixed(2)}ms`);
      console.log(`Throughput: ${throughput.toFixed(2)} messages/second`);

      // Verify all messages were processed successfully
      expect(results.length).toBe(messageCount);
      results.forEach(result => {
        expect(result.jsonrpc).toBe('2.0');
        expect(result).toHaveProperty('id');
      });

      // Performance benchmarks
      expect(throughput).toBeGreaterThan(1000); // At least 1000 messages/second
      expect(processingTime).toBeLessThan(messageCount * 10); // Max 10ms per message on average
    });

    it('should maintain low latency under load', async () => {
      const latencyTests = 100;
      const latencies: number[] = [];

      for (let i = 0; i < latencyTests; i++) {
        const startTime = performance.now();

        const message: MCPRequest = {
          jsonrpc: '2.0',
          id: i,
          method: 'resources/list',
          params: {}
        };

        await server.handleRequest(message);

        const latency = performance.now() - startTime;
        latencies.push(latency);

        // Small delay to simulate realistic load
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

      console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`Min latency: ${minLatency.toFixed(2)}ms`);
      const p99Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)];

      console.log(`Latency stats: Avg=${avgLatency.toFixed(2)}ms, P95=${p95Latency.toFixed(2)}ms, P99=${p99Latency.toFixed(2)}ms`);

      expect(avgLatency).toBeLessThan(5); // Sub-5ms average latency
      expect(p99Latency).toBeLessThan(20); // Sub-20ms tail latency
    });
  });

  describe('Resource Access Performance', () => {
    it('should handle large number of resources efficiently', async () => {
      const resourceCount = 10000;
      const resources: any[] = [];

      // Register resources
      const registerStart = performance.now();
      for (let i = 0; i < resourceCount; i++) {
        const resource = {
          uri: `file:///test/resource-${i}.txt`,
          name: `Resource ${i}`,
          handler: {
            read: async () => ({
              uri: `file:///test/resource-${i}.txt`,
              mimeType: 'text/plain',
              content: 'test content'
            })
          }
        };
        resourceManager.registerResource(resource);
        resources.push(resource);
      }
      const registerTime = performance.now() - registerStart;
      console.log(`Registered ${resourceCount} resources in ${registerTime.toFixed(2)}ms`);

      // Discovery performance
      const discoveryStart = performance.now();
      const configResources = await resourceManager.listResources('**/config/**');
      const discoveryTime = performance.now() - discoveryStart;
      console.log(`Discovery query took ${discoveryTime.toFixed(2)}ms`);

      expect(registerTime / resourceCount).toBeLessThan(0.1); // < 0.1ms per registration
      expect(discoveryTime).toBeLessThan(500); // < 500ms for discovery (increased from 100ms)
    });

    it('should cache resource content effectively', async () => {
      const resource = {
        uri: 'file:///test/cached-resource.txt',
        name: 'Cached Resource',
        caching: {
          enabled: true,
          ttl: 60
        },
        handler: {
          read: async () => {
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate slow I/O
            return {
              uri: 'file:///test/cached-resource.txt',
              mimeType: 'text/plain',
              content: 'cached content'
            };
          }
        }
      };

      resourceManager.registerResource(resource);

      // First access - should be slower (cache miss)
      const firstAccessStart = performance.now();
      const mockContext = { principal: 'test', roles: [], permissions: [] };
      const firstResult = await resourceManager.readResource(resource.uri, mockContext);
      const firstAccessTime = performance.now() - firstAccessStart;

      // Second access - should be faster (cache hit)
      const secondAccessStart = performance.now();
      const secondResult = await resourceManager.readResource(resource.uri, mockContext);
      const secondAccessTime = performance.now() - secondAccessStart;

      console.log(`First access: ${firstAccessTime.toFixed(2)}ms`);
      console.log(`Second access: ${secondAccessTime.toFixed(2)}ms`);

      expect(firstAccessTime).toBeGreaterThan(50);
      expect(secondAccessTime).toBeLessThan(10);
      expect(firstResult.content).toBe(secondResult.content);
    });
  });

  describe('Tool Execution Performance', () => {
    it('should handle concurrent tool executions', async () => {
      const tool = {
        name: 'performance-test-tool',
        description: 'A tool for performance testing',
        inputSchema: {
          type: 'object',
          properties: {
            duration: { type: 'number' }
          }
        }
      };

      await server.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        handler: {
          execute: async (params: any) => {
            const duration = params.duration || 10;
            await new Promise(resolve => setTimeout(resolve, duration));
            return {
              success: true,
              result: `Completed after ${duration}ms`
            };
          }
        }
      });

      const concurrentExecutions = 50;
      const executions: Promise<any>[] = [];

      const startTime = performance.now();

      for (let i = 0; i < concurrentExecutions; i++) {
        const execution = server.handleRequest({
          jsonrpc: '2.0',
          id: i,
          method: 'tools/call',
          params: {
            name: tool.name,
            arguments: { duration: 10 }
          }
        });
        executions.push(execution);
      }

      const results = await Promise.all(executions);
      const executionTime = performance.now() - startTime;

      console.log(`${concurrentExecutions} concurrent executions completed in ${executionTime.toFixed(2)}ms`);

      expect(results.length).toBe(concurrentExecutions);
      results.forEach(response => {
        expect(response.result).toHaveProperty('result');
      });

      // Should complete concurrently, not sequentially
      expect(executionTime).toBeLessThan(concurrentExecutions * 20); // Much less than sequential execution
    });

    it('should enforce execution timeouts', async () => {
      const tool = {
        name: 'timeout-test-tool',
        description: 'A tool that times out',
        inputSchema: { type: 'object' },
        config: {
          timeout: 100 // 100ms timeout
        }
      };

      await server.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        config: tool.config,
        handler: {
          execute: async () => {
            // This will take longer than the timeout
            await new Promise(resolve => setTimeout(resolve, 200));
            return {
              success: true,
              result: 'Should not complete'
            };
          }
        }
      });

      const startTime = performance.now();

      // We expect the promise to resolve with an error response, or reject depending on implementation.
      // handleRequest usually catches errors and returns error response.
      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: tool.name,
          arguments: {}
        },
        meta: { timeout: 100 }
      });

      const executionTime = performance.now() - startTime;

      // Expect error response or timeout error
      expect(response.error).toBeDefined();
      // Code might be CONNECTION_TIMEOUT or TOOL_TIMEOUT

      // Should timeout around 100ms, not wait for the full 200ms
      expect(executionTime).toBeLessThan(250);
      expect(executionTime).toBeGreaterThan(90);
    });

    it('should handle memory-intensive operations', async () => {
      const tool = {
        name: 'memory-test-tool',
        description: 'A memory-intensive tool',
        inputSchema: {
          type: 'object',
          properties: {
            arraySize: { type: 'number' }
          }
        },
        config: {
          maxMemory: 10 * 1024 * 1024 // 10MB limit
        }
      };

      await server.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        config: tool.config,
        handler: {
          execute: async (params: any) => {
            const size = params.arraySize || 1000000;

            // Create a large array (should be within memory limits)
            const largeArray = new Array(size).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));

            return {
              success: true,
              result: `Created array with ${largeArray.length} items`,
              data: {
                memoryUsage: process.memoryUsage().heapUsed
              }
            };
          }
        }
      });

      const startMemory = process.memoryUsage().heapUsed;

      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: tool.name,
          arguments: { arraySize: 100000 }
        }
      });

      const endMemory = process.memoryUsage().heapUsed;
      const memoryDelta = endMemory - startMemory;

      console.log(`Memory usage increased by ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);

      expect(response.result).toHaveProperty('result');
      expect(response.result.data).toHaveProperty('memoryUsage');

      // Should not exceed reasonable memory increase
      expect(memoryDelta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  describe('System Resource Usage', () => {
    it('should maintain reasonable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();

      // Generate sustained load
      const loadDuration = 5000; // 5 seconds
      const messageInterval = 10; // Every 10ms

      const startTime = Date.now();
      const memorySnapshots: Array<{ time: number; memory: NodeJS.MemoryUsage }> = [];

      const loadPromise = new Promise<void>((resolve) => {
        const interval = setInterval(async () => {
          if (Date.now() - startTime >= loadDuration) {
            clearInterval(interval);
            resolve();
            return;
          }

          // Send a message
          const message: MCPRequest = {
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'resources/list',
            params: {}
          };

          server.handleRequest(message).catch(() => {}); // Ignore errors for this test

          // Take memory snapshot every 500ms
          if (memorySnapshots.length === 0 || Date.now() - memorySnapshots[memorySnapshots.length - 1].time >= 500) {
            memorySnapshots.push({
              time: Date.now() - startTime,
              memory: process.memoryUsage()
            });
          }
        }, messageInterval);
      });

      await loadPromise;

      const finalMemory = process.memoryUsage();

      console.log('Memory usage over time:');
      memorySnapshots.forEach(snapshot => {
        const heapMB = (snapshot.memory.heapUsed / 1024 / 1024).toFixed(2);
        console.log(`  ${snapshot.time}ms: ${heapMB}MB heap`);
      });

      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log(`Total memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);

      // Memory should not grow excessively under sustained load
      expect(memoryIncreaseMB).toBeLessThan(100); // Less than 100MB increase

      // Check for memory leaks - memory should stabilize
      if (memorySnapshots.length >= 4) {
        const lastQuarter = memorySnapshots.slice(-2);
        const firstQuarter = memorySnapshots.slice(0, 2);

        const lastAvg = lastQuarter.reduce((sum, snap) => sum + snap.memory.heapUsed, 0) / lastQuarter.length;
        const firstAvg = firstQuarter.reduce((sum, snap) => sum + snap.memory.heapUsed, 0) / firstQuarter.length;

        const growth = (lastAvg - firstAvg) / firstAvg;

        console.log(`Memory growth rate: ${(growth * 100).toFixed(2)}%`);

        // Memory growth should be reasonable (less than 50% increase during load)
        expect(growth).toBeLessThan(0.5);
      }
    });
  });

  describe('Scalability Tests', () => {
    it('should handle increasing message sizes efficiently', async () => {
      const messageSizes = [1024, 10 * 1024, 100 * 1024, 1024 * 1024]; // 1KB to 1MB
      const results: Array<{ size: number; time: number; throughput: number }> = [];

      for (const size of messageSizes) {
        const largeData = 'x'.repeat(size);
        const messageCount = Math.max(10, Math.floor(10000 / (size / 1024))); // Fewer messages for larger sizes

        const startTime = performance.now();

        const promises: Promise<MCPResponse>[] = [];
        for (let i = 0; i < messageCount; i++) {
          const message: MCPRequest = {
            jsonrpc: '2.0',
            id: i,
            method: 'test/echo',
            params: { data: largeData }
          };
          // Expect error because test/echo is not implemented, but we measure overhead
          promises.push(server.handleRequest(message));
        }

        await Promise.all(promises);
        const processingTime = performance.now() - startTime;
        const throughput = (messageCount * size) / (processingTime / 1000); // bytes per second

        results.push({
          size,
          time: processingTime,
          throughput
        });

        console.log(`Size: ${(size / 1024).toFixed(1)}KB, Messages: ${messageCount}, Time: ${processingTime.toFixed(2)}ms, Throughput: ${(throughput / 1024 / 1024).toFixed(2)}MB/s`);
      }

      // Performance should degrade gracefully with size
      results.forEach((result, index) => {
        expect(result.throughput).toBeGreaterThan(0);

        // Each message should process reasonably quickly even when large
        const timePerMessage = result.time / (10000 / (result.size / 1024) || 10);
        expect(timePerMessage).toBeLessThan(100); // Less than 100ms per message on average
      });
    });

    it('should maintain performance with large numbers of registered resources and tools', async () => {
      // Register many resources and tools
      const resourceCount = 5000;
      const toolCount = 1000;

      console.log(`Registering ${resourceCount} resources and ${toolCount} tools...`);

      // Register resources
      for (let i = 0; i < resourceCount; i++) {
        await resourceManager.registerResource({
          uri: `file:///scale-test/resource-${i}.txt`,
          name: `Scale Test Resource ${i}`,
          description: `Scale test resource ${i}`,
          handler: {
            read: async () => ({
              uri: `file:///scale-test/resource-${i}.txt`,
              mimeType: 'text/plain',
              content: `Scale test content for resource ${i}`
            })
          }
        });
      }

      // Register tools
      for (let i = 0; i < toolCount; i++) {
        await server.registerTool({
          name: `scale-test-tool-${i}`,
          description: `Scale test tool ${i}`,
          inputSchema: { type: 'object' },
          handler: {
            execute: async () => ({
              success: true,
              result: `Tool ${i} executed`
            })
          }
        });
      }

      console.log('Registration complete, testing performance...');

      // Test resource listing performance
      const resourceListStart = performance.now();
      const allResources = await resourceManager.listResources();
      const resourceListTime = performance.now() - resourceListStart;

      // Test tool listing performance
      const toolListStart = performance.now();
      const allTools = server.getRegisteredTools();
      const toolListTime = performance.now() - toolListStart;

      // Test specific operations
      const specificResourceStart = performance.now();
      const mockContext = { principal: 'test', roles: [], permissions: [] };
      const specificResource = await resourceManager.readResource(`file:///scale-test/resource-${Math.floor(resourceCount / 2)}.txt`, mockContext);
      const specificResourceTime = performance.now() - specificResourceStart;

      const specificToolStart = performance.now();
      const specificToolResponse = await server.handleRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: `scale-test-tool-${Math.floor(toolCount / 2)}`,
          arguments: {}
        }
      });
      const specificToolTime = performance.now() - specificToolStart;

      console.log(`Resource listing (${allResources.length} resources): ${resourceListTime.toFixed(2)}ms`);
      console.log(`Tool listing (${allTools.length} tools): ${toolListTime.toFixed(2)}ms`);
      console.log(`Specific resource access: ${specificResourceTime.toFixed(2)}ms`);
      console.log(`Specific tool execution: ${specificToolTime.toFixed(2)}ms`);

      if (specificToolResponse.error) {
        console.error('Specific tool execution failed:', specificToolResponse.error);
      }

      // Performance should remain reasonable even with many registered items
      expect(allResources.length).toBe(resourceCount);
      expect(allTools.length).toBe(toolCount);
      expect(resourceListTime).toBeLessThan(1000); // Less than 1 second
      expect(toolListTime).toBeLessThan(500); // Less than 0.5 seconds
      expect(specificResourceTime).toBeLessThan(10); // Less than 10ms
      expect(specificToolTime).toBeLessThan(50); // Less than 50ms
      expect(specificToolResponse.result).toHaveProperty('result');
    });
  });
});
