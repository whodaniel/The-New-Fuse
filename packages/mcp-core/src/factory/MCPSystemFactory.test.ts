/**
 * MCPSystemFactory Unit Tests
 */

import { MCPSystemFactory, MCPSystemConfig } from './MCPSystemFactory.js';
import { LogLevel } from '../types/index.js';

describe('MCPSystemFactory', () => {
  let system: any;

  afterEach(async () => {
    if (system && system.server.isRunning()) {
      await system.stop();
    }
  });

  describe('Factory Methods', () => {
    it('should create production system with correct defaults', () => {
      system = MCPSystemFactory.createProductionSystem();

      expect(system).toBeDefined();
      expect(system.config.server.name).toBe('the-new-fuse-mcp-server');
      expect(system.config.server.port).toBe(3000);
      expect(system.config.server.enableAuth).toBe(true);
      expect(system.config.server.logLevel).toBe(LogLevel.INFO);
      expect(system.config.relay?.enabled).toBe(true);
      expect(system.config.workflow?.enabled).toBe(true);
      expect(system.config.development?.debugMode).toBe(false);
    });

    it('should create development system with correct defaults', () => {
      system = MCPSystemFactory.createDevelopmentSystem();

      expect(system).toBeDefined();
      expect(system.config.server.name).toBe('the-new-fuse-mcp-dev-server');
      expect(system.config.server.port).toBe(3001);
      expect(system.config.server.enableAuth).toBe(false);
      expect(system.config.server.logLevel).toBe(LogLevel.DEBUG);
      expect(system.config.ide?.enabled).toBe(true);
      expect(system.config.development?.debugMode).toBe(true);
      expect(system.config.development?.hotReload).toBe(true);
    });

    it('should create testing system with correct defaults', () => {
      system = MCPSystemFactory.createTestingSystem();

      expect(system).toBeDefined();
      expect(system.config.server.name).toBe('the-new-fuse-mcp-test-server');
      expect(system.config.server.port).toBe(3999); // Test port
      expect(system.config.server.enableAuth).toBe(false);
      expect(system.config.server.logLevel).toBe(LogLevel.ERROR);
      expect(system.config.relay?.enabled).toBe(false);
      expect(system.config.workflow?.enabled).toBe(false);
      expect(system.config.ide?.enabled).toBe(false);
    });

    it('should create custom system with provided configuration', () => {
      const customConfig: MCPSystemConfig = {
        server: {
          name: 'custom-test-server',
          version: '2.0.0',
          port: 5000,
          host: '127.0.0.1',
          maxConnections: 500,
          timeout: 45000,
          enableAuth: true,
          enableTLS: true,
          logLevel: LogLevel.WARN
        },
        relay: {
          enabled: false
        },
        workflow: {
          enabled: false
        },
        development: {
          hotReload: false,
          debugMode: false,
          mockServices: true
        }
      };

      system = MCPSystemFactory.createCustomSystem(customConfig);

      expect(system).toBeDefined();
      expect(system.config.server.name).toBe('custom-test-server');
      expect(system.config.server.port).toBe(5000);
      expect(system.config.server.enableTLS).toBe(true);
      expect(system.config.relay?.enabled).toBe(false);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        server: {
          name: 'merged-server',
          port: 4000
        },
        relay: {
          enabled: false
        }
      };

      system = MCPSystemFactory.createProductionSystem(customConfig);

      expect(system.config.server.name).toBe('merged-server');
      expect(system.config.server.port).toBe(4000);
      expect(system.config.server.enableAuth).toBe(true); // From default
      expect(system.config.relay?.enabled).toBe(false); // From custom
      expect(system.config.workflow?.enabled).toBe(true); // From default
    });
  });

  describe('System Lifecycle', () => {
    beforeEach(() => {
      system = MCPSystemFactory.createTestingSystem({
        server: {
          name: 'test-lifecycle-server',
          version: '1.0.0',
          port: 3999,
          host: 'localhost',
          maxConnections: 10,
          timeout: 5000,
          enableAuth: false,
          enableTLS: false,
          logLevel: LogLevel.ERROR
        }
      });
    });

    it('should start and stop system successfully', async () => {
      expect(system.server.isRunning()).toBe(false);

      await system.start();
      expect(system.server.isRunning()).toBe(true);

      await system.stop();
      expect(system.server.isRunning()).toBe(false);
    });

    it('should throw error when starting already running system', async () => {
      await system.start();

      await expect(system.start()).rejects.toThrow('MCP System is already running');
    });

    it('should handle stop gracefully when not running', async () => {
      expect(system.server.isRunning()).toBe(false);

      // Should not throw
      await system.stop();
      expect(system.server.isRunning()).toBe(false);
    });
  });

  describe('System Health and Metrics', () => {
    beforeEach(async () => {
      system = MCPSystemFactory.createTestingSystem();
      await system.start();
    });

    it('should provide system health information', async () => {
      const health = await system.getHealth();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.components).toBeDefined();
      expect(health.components.server).toBe('up');
      expect(health.timestamp).toBeInstanceOf(Date);
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should provide system metrics', async () => {
      const metrics = await system.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.requests).toBeDefined();
      expect(metrics.resources).toBeDefined();
      expect(metrics.tools).toBeDefined();
      expect(metrics.connections).toBeDefined();
      expect(metrics.timestamp).toBeInstanceOf(Date);

      expect(typeof metrics.requests.total).toBe('number');
      expect(typeof metrics.resources.registered).toBe('number');
      expect(typeof metrics.tools.registered).toBe('number');
      expect(typeof metrics.connections.active).toBe('number');
    });
  });

  describe('Resource and Tool Registration', () => {
    beforeEach(async () => {
      system = MCPSystemFactory.createTestingSystem();
      await system.start();
    });

    it('should register resources successfully', async () => {
      const resource = {
        uri: 'test://resource',
        name: 'Test Resource',
        handler: {
          read: () => Promise.resolve({
            uri: 'test://resource',
            mimeType: 'text/plain',
            content: 'test content'
          })
        }
      };

      await system.registerResource(resource);

      const resources = system.server.getRegisteredResources();
      expect(resources.length).toBeGreaterThan(0);
      expect(resources.some((r: any) => r.name === 'Test Resource')).toBe(true);
    });

    it('should register tools successfully', async () => {
      const tool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object' },
        handler: {
          execute: () => Promise.resolve({ success: true, result: 'test result' })
        }
      };

      await system.registerTool(tool);

      const tools = system.server.getRegisteredTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some((t: any) => t.name === 'test-tool')).toBe(true);
    });
  });

  describe('System Components', () => {
    beforeEach(async () => {
      system = MCPSystemFactory.createTestingSystem();
      await system.start();
    });

    it('should provide access to system components', () => {
      const components = system.getComponents();

      expect(components).toBeDefined();
      expect(components.server).toBeDefined();
      expect(components.server).toBe(system.server);
    });

    it('should include database component when configured', () => {
      // This would be tested with actual Drizzle client
      const components = system.getComponents();

      // For now, database is not configured in test system
      expect(components.database).toBeUndefined();
    });
  });

  describe('Default Resources and Tools', () => {
    beforeEach(async () => {
      system = MCPSystemFactory.createTestingSystem();
      await system.start();
    });

    it('should register default system resources', () => {
      const resources = system.server.getRegisteredResources();

      expect(resources.some((r: any) => r.uri === 'system://info')).toBe(true);
      expect(resources.some((r: any) => r.uri === 'system://config')).toBe(true);
    });

    it('should register default system tools', () => {
      const tools = system.server.getRegisteredTools();

      expect(tools.some((t: any) => t.name === 'system-health')).toBe(true);
      expect(tools.some((t: any) => t.name === 'system-restart')).toBe(true);
    });

    it('should execute system health tool', async () => {
      const response = await system.server.handleRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'system-health', arguments: {} }
      });

      expect(response.result?.success).toBe(true);
      expect(response.result?.result).toBeDefined();
      expect(response.result?.result.status).toMatch(/healthy|degraded|unhealthy/);
    });
  });
});
