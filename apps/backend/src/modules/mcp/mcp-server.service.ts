import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MCPServer, MCPServerConfig } from '@the-new-fuse/mcp-core';
import { EventEmitter } from 'node:events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MCPToolRegistry } from './mcp-tool-registry.service';

/**
 * MCP Server Service
 *
 * Provides the main MCP server instance for The New Fuse backend.
 * Manages server lifecycle, tool registration, and client connections.
 */
@Injectable()
export class MCPServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MCPServerService.name);
  private server: MCPServer;
  private readonly eventEmitter = new EventEmitter();

  constructor(private readonly toolRegistry: MCPToolRegistry) {
    this.server = new MCPServer();
    this.setupServerEvents();
  }

  async onModuleInit(): Promise<void> {
    await this.startServer();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stopServer();
  }

  /**
   * Start the MCP server
   */
  private async startServer(): Promise<void> {
    const config: MCPServerConfig = {
      name: 'the-new-fuse-mcp-server',
      version: '1.0.0',

      host: process.env.MCP_HOST || '0.0.0.0',
      port: parseInt(process.env.MCP_PORT || '3100', 10),
      maxConnections: parseInt(process.env.MCP_MAX_CONNECTIONS || '100', 10),
      timeout: parseInt(process.env.MCP_TIMEOUT || '30000', 10),
      enableAuth: false,
      enableTLS: false,
      logLevel: (process.env.MCP_LOG_LEVEL as any) || 'info',
      options: {
        enableCORS: process.env.MCP_ENABLE_CORS !== 'false',
      },
    };

    try {
      await this.server.start(config);

      // Register all tools from the registry
      await this.registerTools();

      // Register all resources
      await this.registerResources();

      this.logger.log(`MCP Server started on ${config.host}:${config.port}`);
    } catch (error) {
      this.logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  private async stopServer(): Promise<void> {
    try {
      await this.server.stop();
      this.logger.log('MCP Server stopped');
    } catch (error) {
      this.logger.error('Error stopping MCP server:', error);
    }
  }

  /**
   * Register all tools from the tool registry
   */
  private async registerTools(): Promise<void> {
    const tools = this.toolRegistry.getAllTools();

    for (const tool of tools) {
      try {
        await this.server.registerTool(tool);
        this.logger.debug(`Registered tool: ${tool.name}`);
      } catch (error) {
        this.logger.error(`Failed to register tool ${tool.name}:`, error);
      }
    }

    this.logger.log(`Registered ${tools.length} tools`);
  }

  /**
   * Register resources (workflows, agents, etc.)
   */
  private async registerResources(): Promise<void> {
    // Register workflow templates resource
    await this.server.registerResource({
      uri: 'fuse://workflows',
      name: 'workflows',
      description: 'Available workflow templates',
      handler: {
        read: async () => {
          return {
            uri: 'fuse://workflows',
            mimeType: 'application/json',
            content: JSON.stringify(await this.toolRegistry.getWorkflowTemplates()),
          };
        },
      },
    });

    // Register agents resource
    await this.server.registerResource({
      uri: 'fuse://agents',
      name: 'agents',
      description: 'Available agents and their capabilities',
      handler: {
        read: async () => {
          return {
            uri: 'fuse://agents',
            mimeType: 'application/json',
            content: JSON.stringify(await this.toolRegistry.getAgents()),
          };
        },
      },
    });

    // Register system status resource
    await this.server.registerResource({
      uri: 'fuse://status',
      name: 'status',
      description: 'System status and health information',
      handler: {
        read: async () => {
          return {
            uri: 'fuse://status',
            mimeType: 'application/json',
            content: JSON.stringify(await this.getServerStatus()),
          };
        },
      },
    });

    // Register TWIP spec resource
    await this.server.registerResource({
      uri: 'fuse://twip/spec',
      name: 'twip-spec',
      description: 'TWIP protocol metadata and schema references',
      handler: {
        read: async () => {
          return {
            uri: 'fuse://twip/spec',
            mimeType: 'application/json',
            content: JSON.stringify({
              spec: 'twip/0.1',
              draft: 'draft-twip-0001',
              schemas: {
                envelope: 'docs/protocols/schemas/twip-envelope.schema.json',
                identity: 'docs/protocols/schemas/twip-identity.schema.json',
              },
              openapi: 'docs/protocols/openapi/twip-v0.1-stub.yaml',
            }),
          };
        },
      },
    });

    // Register TWIP capability resource
    await this.server.registerResource({
      uri: 'fuse://twip/capability',
      name: 'twip-capability',
      description: 'TWIP capability card for registry and interoperability import',
      handler: {
        read: async () => {
          return {
            uri: 'fuse://twip/capability',
            mimeType: 'application/json',
            content: JSON.stringify(this.toolRegistry.getTwipCapabilityCard()),
          };
        },
      },
    });

    // Register TWIP safety policy defaults
    await this.server.registerResource({
      uri: 'fuse://twip/policy',
      name: 'twip-policy',
      description: 'TWIP default safety policy profile',
      handler: {
        read: async () => {
          return {
            uri: 'fuse://twip/policy',
            mimeType: 'application/json',
            content: JSON.stringify({
              tenantScoped: true,
              ttlSecondsMax: 3600,
              redactGuiFieldsDefault: true,
              allowRemotePropagationDefault: false,
            }),
          };
        },
      },
    });

    // Register TWIP inventory mirror resource
    await this.server.registerResource({
      uri: 'fuse://twip/inventory',
      name: 'twip-inventory',
      description: 'Mirrored TWIP terminal inventory snapshot from relay scans',
      handler: {
        read: async () => {
          const snapshotPath = path.join(
            process.cwd(),
            'data',
            'protocols',
            'twip-inventory.snapshot.json'
          );
          try {
            const raw = await fs.readFile(snapshotPath, 'utf8');
            const parsed = JSON.parse(raw);
            return {
              uri: 'fuse://twip/inventory',
              mimeType: 'application/json',
              content: JSON.stringify({
                mirrorSource: 'tnf://twip/inventory',
                snapshotPath,
                available: true,
                ...parsed,
              }),
            };
          } catch (error: any) {
            return {
              uri: 'fuse://twip/inventory',
              mimeType: 'application/json',
              content: JSON.stringify({
                mirrorSource: 'tnf://twip/inventory',
                snapshotPath,
                available: false,
                message:
                  'TWIP inventory snapshot not found. Run twip_scan_terminals in relay MCP first.',
                error: error?.message || 'unknown_error',
              }),
            };
          }
        },
      },
    });

    this.logger.log('Registered resources');
  }

  /**
   * Setup server event handlers
   */
  private setupServerEvents(): void {
    this.server.on('started', (data) => {
      this.logger.log('Server started event', data);
      this.eventEmitter.emit('started', data);
    });

    this.server.on('stopped', (data) => {
      this.logger.log('Server stopped event', data);
      this.eventEmitter.emit('stopped', data);
    });

    this.server.on('connection', (data) => {
      this.logger.debug('Client connected', data);
      this.eventEmitter.emit('connection', data);
    });

    this.server.on('disconnection', (data) => {
      this.logger.debug('Client disconnected', data);
      this.eventEmitter.emit('disconnection', data);
    });

    this.server.on('request', (data) => {
      this.logger.debug('Request received', data);
      this.eventEmitter.emit('request', data);
    });

    this.server.on('error', (error) => {
      this.logger.error('Server error', error);
      this.eventEmitter.emit('error', error);
    });
  }

  /**
   * Get server status
   */
  async getServerStatus(): Promise<any> {
    const info = await this.server.getServerInfo();
    const health = info.health;
    const tools = this.toolRegistry.getAllTools();

    return {
      server: info,
      health,
      tools: {
        total: tools.length,
        groups: this.toolRegistry.getToolGroups(),
      },
      uptime: info.uptime || 0,
    };
  }

  /**
   * Get the MCP server instance
   */
  getServer(): MCPServer {
    return this.server;
  }

  /**
   * Subscribe to server events
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from server events
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
}
