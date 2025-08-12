/**
 * MCP Performance Tests
 * 
 * These tests validate the performance characteristics of the MCP implementation
 * including throughput, latency, memory usage, and scalability.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPServer } from '../server/MCPServer';
import { MCPSystemFactory } from '../factory/MCPSystemFactory';
import { ResourceManager } from '../handlers/ResourceManager';
import { ToolExecutionEngine } from '../handlers/ToolExecutionEngine';
import { MCPServerConfig } from '../types/server';
import { MCPRequest, MCPResponse } from '../types/message';
import { LogLevel } from '../types/common';
import { performance } from 'perf_hooks';

describe('MCP Performance Tests', () => {
  let server: MCPServer;
  let resourceManager: ResourceManager;
  let toolEngine: ToolExecutionEngine;

  beforeEach(async () => {
    const config: MCPServerConfig = {
      name: 'performance-test-server',
      version: '1.0.0',
      port: 0, // Use random port for testing
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
    resourceManager = new ResourceManager();
    toolEngine = new ToolExecutionEngine({
      maxConcurrent: 100,
      defaultTimeout: 30000,
      maxMemoryUsage: 512 * 1024 * 1024 // 512MB
    });
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
            timestamp: new Date().toISOString(),
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
      console.log(`Max latency: ${maxLatency.toFixed(2)}ms`);
      console.log(`P95 latency: ${p95Latency.toFixed(2)}ms`);

      // Performance requirements
      expect(avgLatency).toBeLessThan(10); // Average < 10ms
      expect(p95Latency).toBeLessThan(50); // P95 < 50ms
      expect(maxLatency).toBeLessThan(1000); // Max < 1 second
    });

    it('should handle concurrent connections efficiently', async () => {
      const connectionCount = 100;
      const messagesPerConnection = 10;
      const connections: Promise<void>[] = [];

      const startTime = performance.now();

      for (let i = 0; i < connectionCount; i++) {
        const connectionPromise = (async () => {
          for (let j = 0; j < messagesPerConnection; j++) {
            const message: MCPRequest = {
              jsonrpc: '2.0',
              id: `${i}-${j}`,
              method: 'resources/list',
              params: {}
            };

            await server.handleRequest(message);
          }
        })();

        connections.push(connectionPromise);
      }

      await Promise.all(connections);
      const processingTime = performance.now() - startTime;

      const totalMessages = connectionCount * messagesPerConnection;
      const throughput = totalMessages / (processingTime / 1000);

      console.log(`${connectionCount} concurrent connections processed ${totalMessages} messages`);
      console.log(`Total time: ${processingTime.toFixed(2)}ms`);
      console.log(`Throughput: ${throughput.toFixed(2)} messages/second`);

      expect(throughput).toBeGreaterThan(500); // At least 500 messages/second with concurrency
    });
  });

  describe('Resource Access Performance', () => {
    it('should efficiently handle large resource lists', async () => {
      // Register many resources
      const resourceCount = 10000;
      for (let i = 0; i < resourceCount; i++) {
        await resourceManager.registerResource({
          uri: `file:///test/resource-${i}.txt`,
          name: `Resource ${i}`,
          description: `Test resource ${i}`,
          handler: {
            read: async () => ({
              uri: `file:///test/resource-${i}.txt`,
              mimeType: 'text/plain',
              content: `Test content for resource ${i}`
            })
          }
        });
      }

      const startTime = performance.now();
      
      const resources = await resourceManager.listResources();
      
      const retrievalTime = performance.now() - startTime;

      console.log(`Retrieved ${resources.length} resources in ${retrievalTime.toFixed(2)}ms`);

      expect(resources.length).toBe(resourceCount);
      expect(retrievalTime).toBeLessThan(100); // Should be < 100ms for 10k resources
    });

    it('should handle resource filtering efficiently', async () => {
      // Register resources with different patterns
      const patterns = ['config', 'data', 'cache', 'temp', 'log'];
      const resourcesPerPattern = 1000;

      for (const pattern of patterns) {
        for (let i = 0; i < resourcesPerPattern; i++) {
          await resourceManager.registerResource({
            uri: `file:///test/${pattern}/resource-${i}.txt`,
            name: `${pattern} Resource ${i}`,
            description: `${pattern} test resource ${i}`,
            handler: {
              read: async () => ({
                uri: `file:///test/${pattern}/resource-${i}.txt`,
                mimeType: 'text/plain',
                content: `${pattern} content for resource ${i}`
              })
            }
          });
        }
      }

      const startTime = performance.now();
      
      const configResources = await resourceManager.listResources({ pattern: '**/config/**' });
      
      const filterTime = performance.now() - startTime;

      console.log(`Filtered ${configResources.length} config resources in ${filterTime.toFixed(2)}ms`);

      expect(configResources.length).toBe(resourcesPerPattern);
      expect(filterTime).toBeLessThan(50); // Filtering should be < 50ms
      configResources.forEach(resource => {
        expect(resource.uri).toContain('/config/');
      });
    });

    it('should cache frequently accessed resources', async () => {
      const resource = {
        uri: 'file:///test/cached-resource.txt',
        name: 'Cached Resource',
        description: 'Resource for caching test',
        handler: {
          read: async () => ({
            uri: 'file:///test/cached-resource.txt',
            mimeType: 'text/plain',
            content: 'Cached resource content'
          })
        }
      };

      await resourceManager.registerResource(resource);

      // First access - should be slower (cache miss)
      const firstAccessStart = performance.now();
      const firstResult = await resourceManager.readResource(resource.uri);
      const firstAccessTime = performance.now() - firstAccessStart;

      // Second access - should be faster (cache hit)
      const secondAccessStart = performance.now();
      const secondResult = await resourceManager.readResource(resource.uri);
      const secondAccessTime = performance.now() - secondAccessStart;

      console.log(`First access: ${firstAccessTime.toFixed(2)}ms`);
      console.log(`Second access: ${secondAccessTime.toFixed(2)}ms`);

      expect(secondAccessTime).toBeLessThan(firstAccessTime);
      expect(secondAccessTime).toBeLessThan(1); // Cache hit should be < 1ms
      expect(firstResult).toEqual(secondResult);
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
        const execution = server.executeTool(tool.name, { duration: 10 });
        executions.push(execution);
      }

      const results = await Promise.all(executions);
      const executionTime = performance.now() - startTime;

      console.log(`${concurrentExecutions} concurrent executions completed in ${executionTime.toFixed(2)}ms`);

      expect(results.length).toBe(concurrentExecutions);
      results.forEach(result => {
        expect(result).toHaveProperty('result');
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
      
      await expect(server.executeTool(tool.name, {})).rejects.toThrow('timeout');
      
      const executionTime = performance.now() - startTime;

      // Should timeout around 100ms, not wait for the full 200ms
      expect(executionTime).toBeLessThan(150);
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
      
      const result = await server.executeTool(tool.name, { arraySize: 100000 });
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryDelta = endMemory - startMemory;

      console.log(`Memory usage increased by ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);

      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('memoryUsage');
      
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
      const allTools = await toolEngine.listTools();
      const toolListTime = performance.now() - toolListStart;

      // Test specific operations
      const specificResourceStart = performance.now();
      const specificResource = await resourceManager.readResource(`file:///scale-test/resource-${Math.floor(resourceCount / 2)}.txt`);
      const specificResourceTime = performance.now() - specificResourceStart;

      const specificToolStart = performance.now();
      const specificToolResult = await toolEngine.executeTool(`scale-test-tool-${Math.floor(toolCount / 2)}`, {});
      const specificToolTime = performance.now() - specificToolStart;

      console.log(`Resource listing (${allResources.length} resources): ${resourceListTime.toFixed(2)}ms`);
      console.log(`Tool listing (${allTools.length} tools): ${toolListTime.toFixed(2)}ms`);
      console.log(`Specific resource access: ${specificResourceTime.toFixed(2)}ms`);
      console.log(`Specific tool execution: ${specificToolTime.toFixed(2)}ms`);

      // Performance should remain reasonable even with many registered items
      expect(allResources.length).toBe(resourceCount);
      expect(allTools.length).toBe(toolCount);
      expect(resourceListTime).toBeLessThan(1000); // Less than 1 second
      expect(toolListTime).toBeLessThan(500); // Less than 0.5 seconds
      expect(specificResourceTime).toBeLessThan(10); // Less than 10ms
      expect(specificToolTime).toBeLessThan(50); // Less than 50ms
      expect(specificToolResult).toHaveProperty('result');
    });
  });
});