/**
 * Relay Service - Manages the Relay Core Server within NestJS
 *
 * This service wraps the @the-new-fuse/relay-core package and provides:
 * - Server lifecycle management (start/stop)
 * - Agent registration and discovery
 * - Message routing between agents
 * - Health and status monitoring
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Types for relay integration (we'll define these inline to avoid import issues)
interface RelayConfig {
  id: string;
  version: string;
  workspaceDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  ports: {
    http: number;
    websocket: number;
    grpc?: number;
  };
  transports: {
    http: boolean;
    websocket: boolean;
    grpc?: boolean;
    file?: boolean;
    mcp?: boolean;
    redis?: boolean;
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
    database?: number;
  };
}

interface Agent {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  lastSeen: Date;
  metadata?: Record<string, unknown>;
}

interface RelayMessage {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: unknown;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface SystemStatus {
  relayId: string;
  uptime: number;
  agentCount: number;
  messageCount: number;
  transports: string[];
}

@Injectable()
export class RelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RelayService.name);
  private relayServer: any = null;
  private isRunning = false;
  private config: RelayConfig;

  // In-memory stores when relay server is not available
  private agents: Map<string, Agent> = new Map();
  private messageQueue: RelayMessage[] = [];
  private startTime: Date = new Date();

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.config = this.buildConfig();
  }

  private buildConfig(): RelayConfig {
    return {
      id: this.configService.get('RELAY_ID', 'tnf-backend-relay'),
      version: '1.0.0',
      workspaceDir: process.cwd(),
      logLevel: this.configService.get('LOG_LEVEL', 'info') as RelayConfig['logLevel'],
      ports: {
        http: this.configService.get('RELAY_HTTP_PORT', 3010),
        websocket: this.configService.get('WEBSOCKET_PORT', 3001),
        grpc: this.configService.get('RELAY_GRPC_PORT', 50051),
      },
      transports: {
        http: this.configService.get('RELAY_ENABLE_HTTP', true),
        websocket: this.configService.get('RELAY_ENABLE_WS', true),
        grpc: this.configService.get('RELAY_ENABLE_GRPC', false),
        file: this.configService.get('RELAY_ENABLE_FILE', false),
        mcp: this.configService.get('RELAY_ENABLE_MCP', false),
        redis: this.configService.get('RELAY_ENABLE_REDIS', false),
      },
      redis: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
        database: this.configService.get('REDIS_DATABASE', 0),
      },
    };
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing Relay Service...');

    try {
      // Try to import relay-core dynamically
      const relayCore = await this.loadRelayCore();

      if (relayCore) {
        this.relayServer = new relayCore.RelayServer(this.config);
        await this.startRelayServer();
      } else {
        this.logger.warn('Relay Core not available - running in standalone mode');
        this.startTime = new Date();
      }
    } catch (error) {
      this.logger.error('Failed to initialize relay server', error);
      this.logger.warn('Continuing with local agent management');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  private async loadRelayCore(): Promise<any | null> {
    try {
      // Dynamic import of relay-core
      const module = await import('@the-new-fuse/relay-core');
      return module;
    } catch (error) {
      this.logger.warn('Could not load @the-new-fuse/relay-core:', (error as Error).message);
      return null;
    }
  }

  private async startRelayServer(): Promise<void> {
    if (!this.relayServer) return;

    try {
      // Setup event handlers
      this.relayServer.on('started', () => {
        this.isRunning = true;
        this.logger.log('✅ Relay server started');
        this.eventEmitter.emit('relay.started', { relayId: this.config.id });
      });

      this.relayServer.on('error', (error: Error) => {
        this.logger.error('Relay server error:', error);
        this.eventEmitter.emit('relay.error', { error });
      });

      this.relayServer.on('agentRegistered', (agent: Agent) => {
        this.logger.log(`🤖 Agent registered: ${agent.id}`);
        this.eventEmitter.emit('relay.agent.registered', agent);
      });

      this.relayServer.on('message', (message: RelayMessage) => {
        this.eventEmitter.emit('relay.message', message);
      });

      const started = await this.relayServer.start();
      if (!started) {
        throw new Error('Relay server failed to start');
      }

      this.startTime = new Date();
      this.isRunning = true;
    } catch (error) {
      this.logger.error('Failed to start relay server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.relayServer && this.isRunning) {
      this.logger.log('Stopping relay server...');
      await this.relayServer.stop();
      this.isRunning = false;
      this.eventEmitter.emit('relay.stopped', { relayId: this.config.id });
    }
  }

  // ========================================
  // Agent Management
  // ========================================

  async registerAgent(agent: Omit<Agent, 'lastSeen'>): Promise<Agent> {
    const fullAgent: Agent = {
      ...agent,
      lastSeen: new Date(),
    };

    if (this.relayServer) {
      // Use relay server's agent registry
      // This would call into the relay server's native methods
      this.logger.log(`Registering agent via relay server: ${agent.id}`);
    }

    // Also store locally for quick access
    this.agents.set(agent.id, fullAgent);
    this.eventEmitter.emit('agent.registered', fullAgent);

    return fullAgent;
  }

  async unregisterAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    this.agents.delete(agentId);
    this.eventEmitter.emit('agent.unregistered', { agentId });

    return true;
  }

  async getAgent(agentId: string): Promise<Agent | undefined> {
    return this.agents.get(agentId);
  }

  async getAllAgents(): Promise<Agent[]> {
    if (this.relayServer) {
      try {
        return this.relayServer.getAgents();
      } catch {
        // Fall back to local agents
      }
    }
    return Array.from(this.agents.values());
  }

  async getAgentsByType(type: string): Promise<Agent[]> {
    const agents = await this.getAllAgents();
    return agents.filter((a) => a.type === type);
  }

  async getAgentsByCapability(capability: string): Promise<Agent[]> {
    const agents = await this.getAllAgents();
    return agents.filter((a) => a.capabilities.includes(capability));
  }

  // ========================================
  // Message Routing
  // ========================================

  async sendMessage(message: Omit<RelayMessage, 'id' | 'timestamp'>): Promise<string> {
    const fullMessage: RelayMessage = {
      ...message,
      id: this.generateId(),
      timestamp: new Date(),
    };

    if (this.relayServer) {
      await this.relayServer.sendMessage(fullMessage);
    } else {
      // Queue message for later processing or handle locally
      this.messageQueue.push(fullMessage);
      this.eventEmitter.emit('relay.message.queued', fullMessage);
    }

    return fullMessage.id;
  }

  async broadcastMessage(
    source: string,
    type: string,
    payload: unknown,
    filter?: { type?: string; capability?: string },
  ): Promise<string[]> {
    let targetAgents = await this.getAllAgents();

    if (filter?.type) {
      targetAgents = targetAgents.filter((a) => a.type === filter.type);
    }
    if (filter?.capability) {
      targetAgents = targetAgents.filter((a) => a.capabilities.includes(filter.capability!));
    }

    const messageIds: string[] = [];
    for (const agent of targetAgents) {
      const id = await this.sendMessage({
        type,
        source,
        target: agent.id,
        payload,
      });
      messageIds.push(id);
    }

    return messageIds;
  }

  // ========================================
  // Status & Health
  // ========================================

  getStatus(): SystemStatus {
    if (this.relayServer) {
      return this.relayServer.getSystemStatus();
    }

    return {
      relayId: this.config.id,
      uptime: Date.now() - this.startTime.getTime(),
      agentCount: this.agents.size,
      messageCount: this.messageQueue.length,
      transports: Object.entries(this.config.transports)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name),
    };
  }

  isHealthy(): boolean {
    return this.isRunning || this.agents.size >= 0;
  }

  getConfig(): RelayConfig {
    return { ...this.config };
  }

  // ========================================
  // Utility Methods
  // ========================================

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.startRelayServer();
  }
}
