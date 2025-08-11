/**
 * MCPServer Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPServer } from './MCPServer';
import { MCPServerConfig } from '../types/server';
import { MCPRequest } from '../interfaces/IMCPMessage';
import { MCPErrorCode, JSONRPCErrorCode } from '../types/error';

describe('MCPServer', () => {
  let server: MCPServer;
  let config: MCPServerConfig;

  beforeEach(() => {
    server = new MCPServer();
    config = {
      name: 'test-server',
      version: '1.0.0',
      port: 3000,
      host: 'localhost',
      maxConnections: 100,
      timeout: 30000,
      enableAuth: false,
      enableTLS: false,
      logLevel: 'info'
    };
  });

  afterEach(async () => {
    if (server.isRunning()) {
      await server.stop();
    }
  });

  describe('Server Lifecycle', () => {
    it('should start server with valid configuration', async () => {
      expect(server.isRunning()).toBe(false);
      
      await server.start(config);
      
      expect(server.isRunning()).toBe(true);
      const info = server.getServerInfo();
      expect(info.name).toBe(config.name);
      expect(info.version).toBe(config.version);
      expect(info.status).toBe('running');
    });

    it('should stop server gracefully', async () => {
      await server.start(config);
      expect(server.isRunning()).toBe(true);
      
      await server.stop();
      
      expect(server.isRunning()).toBe(false);
      // Don't check server info after stop as config is cleared
    });

    it('should throw error when starting already running server', async () => {
      await server.start(config);
      
      await expect(server.start(config)).rejects.toThrow('Server is already running');
    });

    it('should validate configuration on start', async () => {
      const invalidConfig = { ...config, name: '' };
      
      await expect(server.start(invalidConfig)).rejects.toThrow('Server name is required');
    });
  });

  describe('Resource Registration', () => {
    beforeEach(async () => {
      await server.start(config);
    });

    it('should register resource successfully', () => {
      const resource = {
        uri: 'test://resource1',
        name: 'Test Resource',
        description: 'A test resource',
        handler: {
          read: vi.fn().mockResolvedValue({ content: 'test content' })
        }
      };

      server.registerResource(resource);
      
      const resources = server.getRegisteredResources();
      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('Test Resource');
    });

    it('should throw error for duplicate resource URI', () => {
      const resource1 = {
        uri: 'test://resource1',
        name: 'Test Resource 1',
        handler: { read: vi.fn() }
      };
      const resource2 = {
        uri: 'test://resource1',
        name: 'Test Resource 2',
        handler: { read: vi.fn() }
      };

      server.registerResource(resource1);
      
      expect(() => server.registerResource(resource2))
        .toThrow('Resource with URI "test://resource1" already registered');
    });

    it('should throw error for invalid resource', () => {
      const invalidResource = {
        uri: '',
        name: 'Test Resource',
        handler: { read: vi.fn() }
      };

      expect(() => server.registerResource(invalidResource))
        .toThrow('Resource must have uri and name');
    });
  });

  describe('Tool Registration', () => {
    beforeEach(async () => {
      await server.start(config);
    });

    it('should register tool successfully', () => {
      const tool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object' },
        handler: {
          execute: vi.fn().mockResolvedValue({ success: true })
        }
      };

      server.registerTool(tool);
      
      const tools = server.getRegisteredTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test-tool');
    });

    it('should throw error for duplicate tool name', () => {
      const tool1 = {
        name: 'test-tool',
        description: 'Test Tool 1',
        inputSchema: { type: 'object' },
        handler: { execute: vi.fn() }
      };
      const tool2 = {
        name: 'test-tool',
        description: 'Test Tool 2',
        inputSchema: { type: 'object' },
        handler: { execute: vi.fn() }
      };

      server.registerTool(tool1);
      
      expect(() => server.registerTool(tool2))
        .toThrow('Tool with name "test-tool" already registered');
    });
  });

  describe('Capability Registration', () => {
    beforeEach(async () => {
      await server.start(config);
    });

    it('should register capability successfully', () => {
      const capability = {
        name: 'test-capability',
        version: '1.0.0',
        description: 'A test capability',
        methods: ['test/method'],
        experimental: false
      };

      server.registerCapability(capability);
      
      const capabilities = server.getRegisteredCapabilities();
      // Should have default capabilities plus the new one
      expect(capabilities.length).toBeGreaterThan(3);
      expect(capabilities.some(cap => cap.name === 'test-capability')).toBe(true);
    });

    it('should register default capabilities on start', () => {
      const capabilities = server.getRegisteredCapabilities();
      
      expect(capabilities.some(cap => cap.name === 'resources')).toBe(true);
      expect(capabilities.some(cap => cap.name === 'tools')).toBe(true);
      expect(capabilities.some(cap => cap.name === 'server')).toBe(true);
    });
  });

  describe('Request Handling', () => {
    beforeEach(async () => {
      await server.start(config);
    });

    it('should handle server info request', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'server/info'
      };

      const response = await server.handleRequest(request);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.result).toBeDefined();
      expect(response.result.name).toBe(config.name);
    });

    it('should handle server ping request', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'server/ping'
      };

      const response = await server.handleRequest(request);
      
      expect(response.result.status).toBe('ok');
      expect(response.result.timestamp).toBeDefined();
      expect(response.result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should handle resources list request', async () => {
      // Register a test resource
      const resource = {
        uri: 'test://resource1',
        name: 'Test Resource',
        handler: { read: vi.fn() }
      };
      server.registerResource(resource);

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'resources/list'
      };

      const response = await server.handleRequest(request);
      
      expect(Array.isArray(response.result)).toBe(true);
      expect(response.result).toHaveLength(1);
      expect(response.result[0].name).toBe('Test Resource');
    });

    it('should handle tools list request', async () => {
      // Register a test tool
      const tool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object' },
        handler: { execute: vi.fn() }
      };
      server.registerTool(tool);

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/list'
      };

      const response = await server.handleRequest(request);
      
      expect(Array.isArray(response.result)).toBe(true);
      expect(response.result).toHaveLength(1);
      expect(response.result[0].name).toBe('test-tool');
    });

    it('should return error for unknown method', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 5,
        method: 'unknown/method'
      };

      const response = await server.handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(JSONRPCErrorCode.METHOD_NOT_FOUND);
      expect(response.error?.message).toContain('Method "unknown/method" not found');
    });

    it('should handle resource read request', async () => {
      const mockHandler = {
        read: vi.fn().mockResolvedValue({ content: 'test content', mimeType: 'text/plain' })
      };
      
      const resource = {
        uri: 'test://resource1',
        name: 'Test Resource',
        handler: mockHandler
      };
      server.registerResource(resource);

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 6,
        method: 'resources/read',
        params: { uri: 'test://resource1' }
      };

      const response = await server.handleRequest(request);
      
      expect(response.result.content).toBe('test content');
      expect(mockHandler.read).toHaveBeenCalledWith('test://resource1', { uri: 'test://resource1' });
    });

    it('should handle tool call request', async () => {
      const mockHandler = {
        execute: vi.fn().mockResolvedValue({ success: true, result: 'tool executed' })
      };
      
      const tool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object' },
        handler: mockHandler
      };
      server.registerTool(tool);

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'test-tool', arguments: { param1: 'value1' } }
      };

      const response = await server.handleRequest(request);
      
      expect(response.result.success).toBe(true);
      expect(response.result.result).toBe('tool executed');
      expect(mockHandler.execute).toHaveBeenCalledWith({ param1: 'value1' });
    });

    it('should return error when server is not running', async () => {
      await server.stop();
      
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 8,
        method: 'server/info'
      };

      const response = await server.handleRequest(request);
      
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(MCPErrorCode.SERVICE_UNAVAILABLE);
    });
  });

  describe('Server Information', () => {
    beforeEach(async () => {
      await server.start(config);
    });

    it('should provide accurate server information', () => {
      const info = server.getServerInfo();
      
      expect(info.name).toBe(config.name);
      expect(info.version).toBe(config.version);
      expect(info.status).toBe('running');
      expect(info.uptime).toBeGreaterThanOrEqual(0);
      expect(info.activeConnections).toBe(0);
      expect(info.capabilities).toContain('resources');
      expect(info.capabilities).toContain('tools');
      expect(info.capabilities).toContain('server');
    });

    it('should track request statistics', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'server/ping'
      };

      await server.handleRequest(request);
      
      const info = server.getServerInfo();
      expect(info.health.details.requestCount).toBe(1);
      expect(info.health.details.successRate).toBe(100);
    });
  });
});