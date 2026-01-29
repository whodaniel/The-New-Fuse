/**
 * KIMI Orchestrator - Main orchestrator class
 *
 * Orchestrates up to 100 parallel KIMI k2.5 agents for The New Fuse ecosystem.
 * This is the main entry point for managing the agent fleet.
 */

import { EventEmitter } from 'events';

import Redis from 'ioredis';
import WebSocket from 'ws';

import { AgentPool } from './AgentPool';
import { DEFAULT_ORCHESTRATOR_CONFIG, ORCHESTRATOR_EVENTS } from './constants';
import { HealthMonitor } from './HealthMonitor';
import { TaskDistributor } from './TaskDistributor';

import type {
  AgentPoolStats,
  KimiAgent,
  KimiCapability,
  KimiOrchestratorConfig,
  OperationResult,
  TaskAssignment,
  TaskDecomposition,
} from './types';

/**
 * Main orchestrator class for managing KIMI agent fleet
 */
export class KimiOrchestrator extends EventEmitter {
  private config: KimiOrchestratorConfig;
  private agentPool: AgentPool;
  private taskDistributor: TaskDistributor;
  private healthMonitor: HealthMonitor;
  private wsClient?: WebSocket;
  private redis?: Redis;
  private isRunning = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout?: NodeJS.Timeout;

  constructor(config?: Partial<KimiOrchestratorConfig>) {
    super();
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
    this.agentPool = new AgentPool(this.config.maxAgents);
    this.taskDistributor = new TaskDistributor(this.agentPool);
    this.healthMonitor = new HealthMonitor(this.agentPool, {
      heartbeatIntervalMs: this.config.heartbeatIntervalMs,
      agentTimeoutMs: this.config.agentTimeoutMs,
      enableAutoRecovery: this.config.enableAutoRecovery,
    });

    this.setupEventForwarding();
  }

  /**
   * Set up event forwarding from sub-components
   */
  private setupEventForwarding(): void {
    // Forward agent pool events
    this.agentPool.on(ORCHESTRATOR_EVENTS.AGENT_REGISTERED, (data) => {
      this.emit(ORCHESTRATOR_EVENTS.AGENT_REGISTERED, data);
    });
    this.agentPool.on(ORCHESTRATOR_EVENTS.AGENT_UNREGISTERED, (data) => {
      this.emit(ORCHESTRATOR_EVENTS.AGENT_UNREGISTERED, data);
    });
    this.agentPool.on(ORCHESTRATOR_EVENTS.POOL_STATS, (data) => {
      this.emit(ORCHESTRATOR_EVENTS.POOL_STATS, data);
    });

    // Forward task distributor events
    this.taskDistributor.on(ORCHESTRATOR_EVENTS.TASK_ASSIGNED, (data) => {
      this.emit(ORCHESTRATOR_EVENTS.TASK_ASSIGNED, data);
    });
    this.taskDistributor.on(ORCHESTRATOR_EVENTS.TASK_COMPLETED, (data) => {
      this.emit(ORCHESTRATOR_EVENTS.TASK_COMPLETED, data);
    });
    this.taskDistributor.on(ORCHESTRATOR_EVENTS.TASK_FAILED, (data) => {
      this.emit(ORCHESTRATOR_EVENTS.TASK_FAILED, data);
      this.handleTaskFailure(data.task, data.error);
    });

    // Forward health monitor events
    this.healthMonitor.on(ORCHESTRATOR_EVENTS.AGENT_HEALTH_CHANGED, (data) => {
      this.emit(ORCHESTRATOR_EVENTS.AGENT_HEALTH_CHANGED, data);
    });
    this.healthMonitor.on(ORCHESTRATOR_EVENTS.AGENT_FAILED, (data) => {
      this.emit(ORCHESTRATOR_EVENTS.AGENT_FAILED, data);
    });
    this.healthMonitor.on(ORCHESTRATOR_EVENTS.AGENT_RECOVERED, (data) => {
      this.emit(ORCHESTRATOR_EVENTS.AGENT_RECOVERED, data);
    });
  }

  /**
   * Start the orchestrator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Orchestrator is already running');
    }

    this.emit('orchestrator:starting');

    try {
      // Connect to Redis if configured
      if (this.config.redisUrl) {
        await this.connectRedis();
      }

      // Connect to relay server
      await this.connectRelay();

      // Start health monitoring
      this.healthMonitor.start();

      this.isRunning = true;
      this.reconnectAttempts = 0;

      this.emit('orchestrator:started');
    } catch (error) {
      this.emit(ORCHESTRATOR_EVENTS.ERROR, { error, context: 'start' });
      throw error;
    }
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    this.emit('orchestrator:stopping');

    this.isRunning = false;

    // Stop health monitoring
    this.healthMonitor.stop();

    // Close WebSocket connection
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = undefined;
    }

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
      this.redis = undefined;
    }

    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    this.emit('orchestrator:stopped');
  }

  /**
   * Connect to Redis
   */
  private async connectRedis(): Promise<void> {
    if (!this.config.redisUrl) {
      return;
    }

    this.redis = new Redis(this.config.redisUrl);

    this.redis.on('error', (error) => {
      this.emit(ORCHESTRATOR_EVENTS.ERROR, { error, context: 'redis' });
    });

    this.redis.on('connect', () => {
      this.emit('redis:connected');
    });

    // Test connection
    await this.redis.ping();
  }

  /**
   * Connect to relay server via WebSocket
   */
  private async connectRelay(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wsClient = new WebSocket(this.config.relayUrl);

        this.wsClient.on('open', () => {
          this.emit('relay:connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.wsClient.on('message', (data) => {
          this.handleRelayMessage(data.toString());
        });

        this.wsClient.on('error', (error) => {
          this.emit(ORCHESTRATOR_EVENTS.ERROR, { error, context: 'websocket' });
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        });

        this.wsClient.on('close', () => {
          this.emit('relay:disconnected');
          this.handleDisconnect();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket disconnect
   */
  private handleDisconnect(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      this.emit('relay:reconnecting', {
        attempt: this.reconnectAttempts,
        delay,
      });

      this.reconnectTimeout = setTimeout(() => {
        this.connectRelay().catch((error) => {
          this.emit(ORCHESTRATOR_EVENTS.ERROR, {
            error,
            context: 'reconnect',
          });
        });
      }, delay);
    } else {
      this.emit(ORCHESTRATOR_EVENTS.ERROR, {
        error: new Error('Max reconnection attempts reached'),
        context: 'websocket',
      });
    }
  }

  /**
   * Handle incoming relay message
   */
  private handleRelayMessage(message: string): void {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'AGENT_REGISTER':
          this.handleAgentRegistration(data.payload);
          break;
        case 'AGENT_UNREGISTER':
          this.handleAgentUnregistration(data.payload);
          break;
        case 'AGENT_HEARTBEAT':
          this.healthMonitor.recordHeartbeat(data.payload.agentId);
          break;
        case 'TASK_COMPLETE':
          this.taskDistributor.completeTask(data.payload.taskId, data.payload.result);
          break;
        case 'TASK_FAIL':
          this.taskDistributor.failTask(data.payload.taskId, data.payload.error);
          break;
        default:
          this.emit('relay:message', data);
      }
    } catch (error) {
      this.emit(ORCHESTRATOR_EVENTS.ERROR, {
        error: error as Error,
        context: 'message-handling',
        message,
      });
    }
  }

  /**
   * Handle agent registration from relay
   */
  private async handleAgentRegistration(payload: {
    id: string;
    type: string;
    capabilities: KimiCapability[];
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const agent: KimiAgent = {
      id: payload.id,
      type: payload.type || 'kimi-k2.5',
      capabilities: payload.capabilities,
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      status: 'connected',
      tasksCompleted: 0,
      averageResponseTime: 0,
      load: 0,
      health: 'healthy',
      maxConcurrentTasks: 5,
      runningTasks: 0,
      priority: 1,
      lastHealthCheck: new Date().toISOString(),
      metadata: payload.metadata,
    };

    await this.agentPool.registerAgent(agent);
  }

  /**
   * Handle agent unregistration from relay
   */
  private async handleAgentUnregistration(payload: { agentId: string }): Promise<void> {
    await this.agentPool.unregisterAgent(payload.agentId);
  }

  /**
   * Register a KIMI agent
   */
  async registerAgent(
    agentId: string,
    capabilities: KimiCapability[],
    metadata?: Record<string, unknown>
  ): Promise<OperationResult<KimiAgent>> {
    const startTime = Date.now();

    try {
      const agent: KimiAgent = {
        id: agentId,
        type: 'kimi-k2.5',
        capabilities,
        registeredAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        status: 'connected',
        tasksCompleted: 0,
        averageResponseTime: 0,
        load: 0,
        health: 'healthy',
        maxConcurrentTasks: 5,
        runningTasks: 0,
        priority: 1,
        lastHealthCheck: new Date().toISOString(),
        metadata,
      };

      const registered = await this.agentPool.registerAgent(agent);

      if (!registered) {
        return {
          success: false,
          error: 'Failed to register agent - pool may be at capacity',
          metadata: { executionTimeMs: Date.now() - startTime },
        };
      }

      // Broadcast to relay if connected
      this.broadcastToRelay({
        type: 'AGENT_REGISTER',
        payload: { id: agentId, capabilities, metadata },
      });

      return {
        success: true,
        data: agent,
        metadata: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        metadata: { executionTimeMs: Date.now() - startTime },
      };
    }
  }

  /**
   * Unregister a KIMI agent
   */
  async unregisterAgent(agentId: string): Promise<OperationResult<void>> {
    const startTime = Date.now();

    try {
      const unregistered = await this.agentPool.unregisterAgent(agentId);

      if (!unregistered) {
        return {
          success: false,
          error: `Agent ${agentId} not found`,
          metadata: { executionTimeMs: Date.now() - startTime },
        };
      }

      // Broadcast to relay if connected
      this.broadcastToRelay({
        type: 'AGENT_UNREGISTER',
        payload: { agentId },
      });

      return {
        success: true,
        metadata: { executionTimeMs: Date.now() - startTime },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        metadata: { executionTimeMs: Date.now() - startTime },
      };
    }
  }

  /**
   * Submit a task for execution
   */
  async submitTask(
    taskType: string,
    payload: unknown,
    options?: {
      requiredCapabilities?: KimiCapability[];
      priority?: number;
      timeoutMs?: number;
      stickySessionId?: string;
    }
  ): Promise<OperationResult<TaskAssignment>> {
    return this.taskDistributor.distributeTask(taskType, payload, options);
  }

  /**
   * Decompose a complex task into subtasks
   */
  async decomposeTask(
    taskType: string,
    payload: unknown,
    strategy: 'parallel' | 'sequential' | 'dag' = 'parallel'
  ): Promise<OperationResult<TaskDecomposition>> {
    return this.taskDistributor.decomposeTask(taskType, payload, strategy);
  }

  /**
   * Cancel a pending task
   */
  cancelTask(taskId: string): boolean {
    return this.taskDistributor.cancelTask(taskId);
  }

  /**
   * Get task status
   */
  getTask(taskId: string): TaskAssignment | undefined {
    return this.taskDistributor.getTask(taskId);
  }

  /**
   * Get agent information
   */
  getAgent(agentId: string): KimiAgent | undefined {
    return this.agentPool.getAgent(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): KimiAgent[] {
    return this.agentPool.getAllAgents();
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: KimiCapability): KimiAgent[] {
    return this.agentPool.getAgentsByCapability(capability);
  }

  /**
   * Get pool statistics
   */
  getStats(): AgentPoolStats {
    return this.agentPool.getStats();
  }

  /**
   * Get health summary
   */
  getHealthSummary(): ReturnType<typeof this.healthMonitor.getHealthSummary> {
    return this.healthMonitor.getHealthSummary();
  }

  /**
   * Handle task failure with retry logic
   */
  private async handleTaskFailure(task: TaskAssignment, _error: Error): Promise<void> {
    if (task.retryCount < this.config.maxRetries) {
      task.retryCount++;

      // Retry the task
      setTimeout(() => {
        this.taskDistributor.distributeTask(task.type, task.payload, {
          requiredCapabilities: task.requiredCapabilities,
          priority: task.priority,
          timeoutMs: task.timeoutMs,
        });
      }, 1000 * task.retryCount);
    }
  }

  /**
   * Broadcast message to relay
   */
  private broadcastToRelay(message: unknown): void {
    if (this.wsClient?.readyState === WebSocket.OPEN) {
      this.wsClient.send(JSON.stringify(message));
    }
  }

  /**
   * Check if orchestrator is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get orchestrator configuration
   */
  getConfig(): KimiOrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<KimiOrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get agent pool
   */
  getAgentPool(): AgentPool {
    return this.agentPool;
  }

  /**
   * Get task distributor
   */
  getTaskDistributor(): TaskDistributor {
    return this.taskDistributor;
  }

  /**
   * Get health monitor
   */
  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }
}
