/**
 * MCP System Factory
 *
 * Unified factory for creating integrated MCP systems that work seamlessly
 * with relay-core, workflow-engine, and other platform components.
 */

import { MCPServer } from '../server/MCPServer';
import { LogLevel } from '../types/common';
import { MCPServerConfig } from '../types/server';
// import { DatabaseService } from '@db/client';

// Import types from relay-core for integration
type Logger = {
  info: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
};

type MasterAgentRegistry = any; // Will be properly typed when we integrate
type HeartbeatMonitoringService = any; // Will be properly typed when we integrate

/**
 * Configuration for the integrated MCP system
 */
export interface MCPSystemConfig {
  /** MCP Server configuration */
  server: MCPServerConfig;

  /** Database configuration */
  database?: {
    db?: any; // DatabaseService;
    connectionString?: string;
  };

  /** Relay integration configuration */
  relay?: {
    enabled: boolean;
    agentRegistry?: MasterAgentRegistry;
    heartbeatService?: HeartbeatMonitoringService;
    logger?: Logger;
  };

  /** Workflow integration configuration */
  workflow?: {
    enabled: boolean;
    engineConfig?: any;
  };

  /** SkIDEancer integration configuration */
  ide?: {
    enabled: boolean;
    port?: number;
    aiFeatures?: boolean;
  };

  /** Monitoring configuration */
  monitoring?: {
    enabled: boolean;
    metricsPort?: number;
    prometheusEnabled?: boolean;
  };

  /** Development configuration */
  development?: {
    hotReload: boolean;
    debugMode: boolean;
    mockServices: boolean;
  };
}

/**
 * Integrated MCP System containing all components
 */
export interface MCPSystem {
  /** Core MCP Server */
  server: MCPServer;

  /** System configuration */
  config: MCPSystemConfig;

  /** Start the entire system */
  start(): Promise<void>;

  /** Stop the entire system */
  stop(): Promise<void>;

  /** Get system health status */
  getHealth(): Promise<SystemHealth>;

  /** Get system metrics */
  getMetrics(): Promise<SystemMetrics>;

  /** Register a new resource */
  registerResource(resource: any): Promise<void>;

  /** Register a new tool */
  registerTool(tool: any): Promise<void>;

  /** Get integrated components */
  getComponents(): SystemComponents;
}

/**
 * System health information
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    server: 'up' | 'down' | 'degraded';
    database?: 'up' | 'down' | 'degraded';
    relay?: 'up' | 'down' | 'degraded';
    workflow?: 'up' | 'down' | 'degraded';
    ide?: 'up' | 'down' | 'degraded';
  };
  timestamp: Date;
  uptime: number;
}

/**
 * System metrics information
 */
export interface SystemMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  resources: {
    registered: number;
    accessed: number;
  };
  tools: {
    registered: number;
    executed: number;
  };
  connections: {
    active: number;
    total: number;
  };
  timestamp: Date;
}

/**
 * System components
 */
export interface SystemComponents {
  server: MCPServer;
  database?: any; // DatabaseService;
  relay?: {
    agentRegistry?: MasterAgentRegistry;
    heartbeatService?: HeartbeatMonitoringService;
    logger?: Logger;
  };
  workflow?: any;
  ide?: any;
}

/**
 * MCP System implementation
 */
class MCPSystemImpl implements MCPSystem {
  public readonly server: MCPServer;
  public readonly config: MCPSystemConfig;

  private components: SystemComponents;
  private startTime: Date | null = null;
  private running = false;

  constructor(config: MCPSystemConfig) {
    this.config = config;
    this.server = new MCPServer();
    this.components = { server: this.server };

    this.initializeComponents();
  }

  /**
   * Initialize all system components
   */
  private initializeComponents(): void {
    // Initialize database if configured
    if (this.config.database?.db) {
      this.components.database = this.config.database.db;
    }

    // Initialize relay components if configured
    if (this.config.relay?.enabled) {
      this.components.relay = {
        agentRegistry: this.config.relay.agentRegistry,
        heartbeatService: this.config.relay.heartbeatService,
        logger: this.config.relay.logger,
      };
    }

    // Initialize workflow components if configured
    if (this.config.workflow?.enabled) {
      this.components.workflow = this.config.workflow.engineConfig;
    }
  }

  /**
   * Start the entire MCP system
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('MCP System is already running');
    }

    try {
      this.log('info', 'Starting MCP System...');

      // Start core MCP server
      await this.server.start(this.config.server);

      // Initialize default resources and tools
      await this.registerDefaultResources();
      await this.registerDefaultTools();

      // Start additional components
      await this.startAdditionalComponents();

      this.running = true;
      this.startTime = new Date();

      this.log(
        'info',
        `MCP System started successfully on ${this.config.server.host}:${this.config.server.port}`
      );
    } catch (error) {
      this.log('error', 'Failed to start MCP System', error);
      throw error;
    }
  }

  /**
   * Stop the entire MCP system
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    try {
      this.log('info', 'Stopping MCP System...');

      // Stop additional components first
      await this.stopAdditionalComponents();

      // Stop core MCP server
      await this.server.stop();

      this.running = false;
      this.startTime = null;

      this.log('info', 'MCP System stopped successfully');
    } catch (error) {
      this.log('error', 'Error stopping MCP System', error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getHealth(): Promise<SystemHealth> {
    const serverHealth = this.server.isRunning() ? 'up' : 'down';

    const components: SystemHealth['components'] = {
      server: serverHealth,
    };

    // Check database health
    if (this.components.database) {
      try {
        await this.components.database.$queryRaw`SELECT 1`;
        components.database = 'up';
      } catch {
        components.database = 'down';
      }
    }

    // Check relay health
    if (this.components.relay) {
      components.relay = 'up'; // Simplified for now
    }

    // Check workflow health
    if (this.components.workflow) {
      components.workflow = 'up'; // Simplified for now
    }

    // Determine overall status
    const allUp = Object.values(components).every((status) => status === 'up');
    const anyDown = Object.values(components).some((status) => status === 'down');

    const status = allUp ? 'healthy' : anyDown ? 'unhealthy' : 'degraded';

    return {
      status,
      components,
      timestamp: new Date(),
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
    };
  }

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<SystemMetrics> {
    const serverInfo = this.server.getServerInfo();

    return {
      requests: {
        total: serverInfo.metadata?.requestCount || 0,
        successful: serverInfo.metadata?.successfulRequests || 0,
        failed: serverInfo.metadata?.failedRequests || 0,
        averageResponseTime: serverInfo.metadata?.averageResponseTime || 0,
      },
      resources: {
        registered: this.server.getRegisteredResources().length,
        accessed: 0, // TODO: Track resource access
      },
      tools: {
        registered: this.server.getRegisteredTools().length,
        executed: 0, // TODO: Track tool executions
      },
      connections: {
        active: serverInfo.activeConnections,
        total: serverInfo.metadata?.totalConnections || 0,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Register a new resource
   */
  async registerResource(resource: any): Promise<void> {
    this.server.registerResource(resource);
    this.log('debug', `Registered resource: ${resource.name}`);
  }

  /**
   * Register a new tool
   */
  async registerTool(tool: any): Promise<void> {
    this.server.registerTool(tool);
    this.log('debug', `Registered tool: ${tool.name}`);
  }

  /**
   * Get integrated components
   */
  getComponents(): SystemComponents {
    return { ...this.components };
  }

  /**
   * Register default resources
   */
  private async registerDefaultResources(): Promise<void> {
    // Register system info resource
    const self = this;
    this.server.registerResource({
      uri: 'system://info',
      name: 'System Information',
      description: 'System health and metrics information',
      handler: {
        async read() {
          const health = await self.getHealth();
          const metrics = await self.getMetrics();

          return {
            uri: 'system://info',
            mimeType: 'application/json',
            content: JSON.stringify({ health, metrics }, null, 2),
            metadata: {
              generated: new Date().toISOString(),
            },
          };
        },
      },
    });

    // Register configuration resource
    this.server.registerResource({
      uri: 'system://config',
      name: 'System Configuration',
      description: 'Current system configuration',
      handler: {
        read: () =>
          Promise.resolve({
            uri: 'system://config',
            mimeType: 'application/json',
            content: JSON.stringify(self.config, null, 2),
            metadata: {
              generated: new Date().toISOString(),
            },
          }),
      },
    });
  }

  /**
   * Register default tools
   */
  private async registerDefaultTools(): Promise<void> {
    // Register system health check tool
    this.server.registerTool({
      name: 'system-health',
      description: 'Check system health status',
      inputSchema: {
        type: 'object',
        properties: {
          detailed: { type: 'boolean', default: false },
        },
      },
      handler: {
        execute: async (params: { detailed?: boolean }) => {
          const health = await this.getHealth();

          if (params.detailed) {
            const metrics = await this.getMetrics();
            return {
              success: true,
              result: { health, metrics },
            };
          }

          return {
            success: true,
            result: health,
          };
        },
      },
    });

    // Register system restart tool
    this.server.registerTool({
      name: 'system-restart',
      description: 'Restart the MCP system',
      inputSchema: {
        type: 'object',
        properties: {
          graceful: { type: 'boolean', default: true },
        },
      },
      handler: {
        execute: async (params: { graceful?: boolean }) => {
          try {
            if (params.graceful) {
              await this.stop();
              await this.start();
            } else {
              // Force restart - simplified for now
              await this.stop();
              await this.start();
            }

            return {
              success: true,
              result: 'System restarted successfully',
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Restart failed',
            };
          }
        },
      },
    });
  }

  /**
   * Register relay-specific resources
   */
  private async registerRelayResources(): Promise<void> {
    // Check if already registered to avoid duplicates (e.g. if using RelayBridge)
    const registeredResources = this.server.getRegisteredResources();
    if (registeredResources.some((r) => r.uri === 'relay://agents')) {
      this.log('debug', 'Relay resources already registered, skipping');
      return;
    }

    const registry = this.components.relay?.agentRegistry;
    const heartbeatService = this.components.relay?.heartbeatService;

    // Register agent registry resource
    if (registry) {
      this.server.registerResource({
        uri: 'relay://agents',
        name: 'Agent Registry',
        description: 'Access to the Master Agent Registry',
        handler: {
          read: async () => {
            const agents = registry.getAllAgents?.() || [];
            return {
              uri: 'relay://agents',
              mimeType: 'application/json',
              content: JSON.stringify(agents, null, 2),
              metadata: {
                count: agents.length,
                generated: new Date().toISOString(),
              },
            };
          },
        },
      });
    }

    // Register heartbeat status resource
    if (heartbeatService) {
      this.server.registerResource({
        uri: 'relay://heartbeat',
        name: 'Heartbeat Status',
        description: 'Current heartbeat monitoring status',
        handler: {
          read: async () => {
            let status;
            if (heartbeatService.getStagnationStatus) {
              status = await heartbeatService.getStagnationStatus();
            } else {
              status = {
                active: true,
                lastCheck: new Date().toISOString(),
                monitoredAgents: 0,
              };
            }

            return {
              uri: 'relay://heartbeat',
              mimeType: 'application/json',
              content: JSON.stringify(status, null, 2),
              metadata: {
                generated: new Date().toISOString(),
              },
            };
          },
        },
      });
    }

    // Register relay configuration resource
    this.server.registerResource({
      uri: 'relay://config',
      name: 'Relay Configuration',
      description: 'Current relay configuration',
      handler: {
        read: () =>
          Promise.resolve({
            uri: 'relay://config',
            mimeType: 'application/json',
            content: JSON.stringify(
              {
                relay: this.config.relay,
              },
              null,
              2
            ),
            metadata: {
              generated: new Date().toISOString(),
            },
          }),
      },
    });

    this.log('debug', 'Registered relay-specific resources');
  }

  /**
   * Register relay-specific tools
   */
  private async registerRelayTools(): Promise<void> {
    // Check if already registered
    const registeredTools = this.server.getRegisteredTools();
    if (registeredTools.some((t) => t.name === 'relay-agent-lookup')) {
      this.log('debug', 'Relay tools already registered, skipping');
      return;
    }

    const registry = this.components.relay?.agentRegistry;
    const heartbeatService = this.components.relay?.heartbeatService;

    // Register agent lookup tool
    if (registry) {
      this.server.registerTool({
        name: 'relay-agent-lookup',
        description: 'Look up agent information from the registry',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string' },
            includeMetadata: { type: 'boolean', default: false },
          },
          required: ['agentId'],
        },
        handler: {
          execute: async (params: { agentId: string; includeMetadata?: boolean }) => {
            try {
              // Try getAgentProfile first (MasterAgentRegistry), fallback to getAgent (Legacy)
              const agentProfile = registry.getAgentProfile?.(params.agentId);
              const legacyAgent = registry.getAgent?.(params.agentId);
              const resultAgent = agentProfile || legacyAgent;

              if (!resultAgent) {
                return {
                  success: false,
                  error: `Agent not found: ${params.agentId}`,
                };
              }

              const result = params.includeMetadata
                ? resultAgent
                : {
                    id: resultAgent.id,
                    name: resultAgent.name,
                    type: resultAgent.type,
                    status: resultAgent.status,
                    lastSeen: resultAgent.lastSeen,
                  };

              return {
                success: true,
                result,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Agent lookup failed',
              };
            }
          },
        },
      });

      // Register agent registration tool
      this.server.registerTool({
        name: 'relay-agent-register',
        description: 'Register a new agent with the relay system',
        inputSchema: {
          type: 'object',
          properties: {
            agentData: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                capabilities: { type: 'object' }, // Accept object for capabilities
              },
              required: ['name', 'type'],
            },
          },
          required: ['agentData'],
        },
        handler: {
          execute: async (params: { agentData: any }) => {
            try {
              const registrationResult = await registry.registerAgent?.(params.agentData);

              return {
                success: true,
                result: registrationResult || {
                  registered: true,
                  timestamp: new Date().toISOString(),
                },
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Agent registration failed',
              };
            }
          },
        },
      });
    }

    // Register heartbeat trigger tool
    if (heartbeatService) {
      this.server.registerTool({
        name: 'relay-heartbeat-trigger',
        description: 'Trigger a heartbeat check for an agent',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string' },
            force: { type: 'boolean', default: false },
          },
          required: ['agentId'],
        },
        handler: {
          execute: async (params: { agentId: string; force?: boolean }) => {
            try {
              if (heartbeatService.recordHeartbeat) {
                // recordHeartbeat might be sync or async
                await Promise.resolve(heartbeatService.recordHeartbeat(params.agentId));
              }

              const result = {
                agentId: params.agentId,
                heartbeatSent: true,
                timestamp: new Date().toISOString(),
                forced: params.force || false,
              };

              return {
                success: true,
                result,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Heartbeat trigger failed',
              };
            }
          },
        },
      });
    }

    this.log('debug', 'Registered relay-specific tools');
  }

  /**
   * Start additional components
   */
  private async startAdditionalComponents(): Promise<void> {
    // Start relay integration if enabled
    if (this.config.relay?.enabled && this.components.relay?.agentRegistry) {
      this.log('info', 'Starting relay integration...');

      try {
        await this.registerRelayResources();
        await this.registerRelayTools();

        this.log('info', 'Relay integration started successfully');
      } catch (error) {
        this.log('error', 'Failed to start relay integration', error);
      }
    }

    // Start workflow integration if enabled
    if (this.config.workflow?.enabled) {
      this.log('info', 'Starting workflow integration...');
      // TODO: Initialize workflow integration
    }

    // Start SkIDEancer integration if enabled
    if (this.config.ide?.enabled) {
      this.log('info', 'Starting SkIDEancer integration...');
      // TODO: Initialize SkIDEancer integration
    }
  }

  /**
   * Stop additional components
   */
  private async stopAdditionalComponents(): Promise<void> {
    // Stop components in reverse order
    if (this.config.ide?.enabled) {
      this.log('info', 'Stopping SkIDEancer integration...');
      // TODO: Stop SkIDEancer integration
    }

    if (this.config.workflow?.enabled) {
      this.log('info', 'Stopping workflow integration...');
      // TODO: Stop workflow integration
    }

    if (this.config.relay?.enabled) {
      this.log('info', 'Stopping relay integration...');
      // Relay integration resources are cleaned up when server stops
    }
  }

  /**
   * Log message with appropriate level
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: any): void {
    if (this.components.relay?.logger) {
      this.components.relay.logger[level](message, meta);
    } else {
      // Fallback to console logging
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      if (level === 'error') {
        console.error(logMessage, meta);
      } else if (level === 'warn') {
        console.warn(logMessage);
      } else if (level === 'info') {
        console.info(logMessage);
      } else if (level === 'debug' && this.config.development?.debugMode) {
        console.debug(logMessage);
      }
    }
  }
}

/**
 * MCP System Factory class
 */
export class MCPSystemFactory {
  /**
   * Create a production-ready MCP system
   */
  static createProductionSystem(config: Partial<MCPSystemConfig> = {}): MCPSystem {
    const defaultConfig: MCPSystemConfig = {
      server: {
        name: 'the-new-fuse-mcp-server',
        version: '1.0.0',
        port: 3000,
        host: 'localhost',
        maxConnections: 1000,
        timeout: 30000,
        enableAuth: true,
        enableTLS: false,
        logLevel: LogLevel.INFO,
      },
      relay: {
        enabled: true,
      },
      workflow: {
        enabled: true,
      },
      ide: {
        enabled: false,
      },
      monitoring: {
        enabled: true,
        metricsPort: 9090,
        prometheusEnabled: true,
      },
      development: {
        hotReload: false,
        debugMode: false,
        mockServices: false,
      },
    };

    const mergedConfig = this.mergeConfigs(defaultConfig, config);
    return new MCPSystemImpl(mergedConfig);
  }

  /**
   * Create a development MCP system
   */
  static createDevelopmentSystem(config: Partial<MCPSystemConfig> = {}): MCPSystem {
    const defaultConfig: MCPSystemConfig = {
      server: {
        name: 'the-new-fuse-mcp-dev-server',
        version: '1.0.0-dev',
        port: 3001,
        host: 'localhost',
        maxConnections: 100,
        timeout: 30000,
        enableAuth: false,
        enableTLS: false,
        logLevel: LogLevel.DEBUG,
      },
      relay: {
        enabled: true,
      },
      workflow: {
        enabled: true,
      },
      ide: {
        enabled: true,
        port: 3006,
        aiFeatures: true,
      },
      monitoring: {
        enabled: true,
        metricsPort: 9091,
        prometheusEnabled: false,
      },
      development: {
        hotReload: true,
        debugMode: true,
        mockServices: true,
      },
    };

    const mergedConfig = this.mergeConfigs(defaultConfig, config);
    return new MCPSystemImpl(mergedConfig);
  }

  /**
   * Create a testing MCP system
   */
  static createTestingSystem(config: Partial<MCPSystemConfig> = {}): MCPSystem {
    const defaultConfig: MCPSystemConfig = {
      server: {
        name: 'the-new-fuse-mcp-test-server',
        version: '1.0.0-test',
        port: 3999, // Test port
        host: 'localhost',
        maxConnections: 10,
        timeout: 5000,
        enableAuth: false,
        enableTLS: false,
        logLevel: LogLevel.ERROR,
      },
      relay: {
        enabled: false,
      },
      workflow: {
        enabled: false,
      },
      ide: {
        enabled: false,
      },
      monitoring: {
        enabled: false,
      },
      development: {
        hotReload: false,
        debugMode: false,
        mockServices: true,
      },
    };

    const mergedConfig = this.mergeConfigs(defaultConfig, config);
    return new MCPSystemImpl(mergedConfig);
  }

  /**
   * Create a custom MCP system with full configuration
   */
  static createCustomSystem(config: MCPSystemConfig): MCPSystem {
    return new MCPSystemImpl(config);
  }

  /**
   * Create a simple MCP server for testing
   * @deprecated Use createTestingSystem() instead for full system functionality
   */
  static createServer(config: MCPServerConfig): MCPServer {
    const systemConfig: MCPSystemConfig = {
      server: config,
      development: {
        hotReload: false,
        debugMode: false,
        mockServices: true,
      },
    };

    const system = new MCPSystemImpl(systemConfig);
    return system.server;
  }

  /**
   * Merge configuration objects deeply
   */
  private static mergeConfigs(
    defaultConfig: MCPSystemConfig,
    userConfig: Partial<MCPSystemConfig>
  ): MCPSystemConfig {
    const merged = { ...defaultConfig };

    for (const [key, value] of Object.entries(userConfig)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof MCPSystemConfig] = {
          ...merged[key as keyof MCPSystemConfig],
          ...value,
        } as any;
      } else {
        merged[key as keyof MCPSystemConfig] = value as any;
      }
    }

    return merged;
  }
}

/**
 * Default export for convenience
 */
export default MCPSystemFactory;
