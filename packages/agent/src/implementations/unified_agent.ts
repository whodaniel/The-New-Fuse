/**
 * Unified Agent - Single agent that unifies all capabilities
 *
 * A unified agent that combines:
 * - Enhanced agent capabilities
 * - Bridge integration
 * - BMAD method support
 * - Swarm participation
 * - Protocol compliance (A2A, MCP)
 */

import { EventEmitter } from 'events';

// ============================================================
// TYPES
// ============================================================

export interface UnifiedAgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: string[];
  bridges: BridgeConnection[];
  protocols: SupportedProtocol[];
  swarmConfig?: SwarmConfig;
}

export type AgentRole =
  | 'worker'
  | 'supervisor'
  | 'coordinator'
  | 'specialist'
  | 'researcher'
  | 'analyst';

export interface BridgeConnection {
  type: 'universal' | 'redis' | 'protocol' | 'mcp' | 'vscode' | 'electron';
  config?: Record<string, unknown>;
}

export interface SupportedProtocol {
  name: 'a2a' | 'mcp' | 'tnf';
  version: string;
}

export interface SwarmConfig {
  enabled: boolean;
  role: 'leader' | 'follower' | 'peer';
  groupId?: string;
}

export interface TaskRequest {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: unknown;
  requester: string;
  deadline?: Date;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
  metadata: Record<string, unknown>;
}

export interface AgentState {
  status: 'idle' | 'busy' | 'error' | 'offline';
  currentTask?: string;
  queueLength: number;
  lastActivity: Date;
  uptime: number;
}

// ============================================================
// UNIFIED AGENT
// ============================================================

interface UnifiedAgentMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  totalDuration: number;
  averageDuration: number;
}

import { ClawdEngine } from './ClawdEngine';

// ... (previous imports)

export class UnifiedAgent extends EventEmitter {
  private config: UnifiedAgentConfig;
  private state: AgentState;
  private taskQueue: TaskRequest[] = [];
  private processing = false;
  private startTime: Date;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private metrics: UnifiedAgentMetrics;
  private clawdEngine: ClawdEngine;

  constructor(config: UnifiedAgentConfig) {
    super();
    this.config = config;
    this.startTime = new Date();
    this.state = {
      status: 'idle',
      queueLength: 0,
      lastActivity: new Date(),
      uptime: 0,
    };
    this.metrics = {
      tasksCompleted: 0,
      tasksFailed: 0,
      totalDuration: 0,
      averageDuration: 0,
    };
    this.clawdEngine = new ClawdEngine();
  }

  // ============================================================
  // LIFECYCLE
  // ============================================================

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    this.startTime = new Date();
    this.state.status = 'idle';

    // Start heartbeat
    this.startHeartbeat();

    // Start task processing
    this.startProcessing();

    this.emit('started', { id: this.config.id });
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    this.state.status = 'offline';
    this.stopHeartbeat();
    this.processing = false;

    this.emit('stopped', { id: this.config.id });
  }

  /**
   * Get agent info
   */
  getInfo(): {
    id: string;
    name: string;
    role: AgentRole;
    capabilities: string[];
    protocols: SupportedProtocol[];
    state: AgentState;
    metrics: UnifiedAgentMetrics;
  } {
    return {
      id: this.config.id,
      name: this.config.name,
      role: this.config.role,
      capabilities: this.config.capabilities,
      protocols: this.config.protocols,
      state: this.getState(),
      metrics: { ...this.metrics },
    };
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return {
      ...this.state,
      queueLength: this.taskQueue.length,
      uptime: (Date.now() - this.startTime.getTime()) / 1000,
    };
  }

  // ============================================================
  // TASK MANAGEMENT
  // ============================================================

  /**
   * Submit a task
   */
  async submitTask(task: TaskRequest): Promise<void> {
    this.taskQueue.push(task);
    this.state.lastActivity = new Date();
    this.emit('task:submitted', task);

    // Sort by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Execute a task directly
   */
  async executeTask(task: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();
    this.state.status = 'busy';
    this.state.currentTask = task.id;

    try {
      this.emit('task:started', task);

      // Execute based on task type
      const result = await this.processTask(task);

      const duration = Date.now() - startTime;

      // Update metrics
      this.metrics.tasksCompleted++;
      this.metrics.totalDuration += duration;
      this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.tasksCompleted;

      const taskResult: TaskResult = {
        taskId: task.id,
        success: true,
        result,
        duration,
        metadata: { agentId: this.config.id },
      };

      this.emit('task:completed', taskResult);
      return taskResult;
    } catch (error) {
      this.metrics.tasksFailed++;

      const taskResult: TaskResult = {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        metadata: { agentId: this.config.id },
      };

      this.emit('task:failed', taskResult);
      return taskResult;
    } finally {
      this.state.status = 'idle';
      this.state.currentTask = undefined;
      this.state.lastActivity = new Date();
    }
  }

  /**
   * Process task based on type
   */
  private async processTask(task: TaskRequest): Promise<unknown> {
    switch (task.type) {
      case 'analyze':
        return this.handleAnalyze(task);
      case 'generate':
        return this.handleGenerate(task);
      case 'transform':
        return this.handleTransform(task);
      case 'search':
        return this.handleSearch(task);
      case 'execute':
        return this.handleExecute(task);
      case 'clawd':
        return this.handleClawd(task);
      default:
        return this.handleCustom(task);
    }
  }

  // Task handlers
  private async handleAnalyze(task: TaskRequest): Promise<unknown> {
    // Simulate analysis
    await this.delay(100);
    return { analysis: 'completed', input: task.payload };
  }

  private async handleClawd(task: TaskRequest): Promise<unknown> {
    // Payload should look like { method: 'node.invoke', params: { ... } }
    // Or simplified: { skill: 'name', args: {} }
    const payload = task.payload as any;

    // Auto-wrap into Protocol Request
    const req = {
      type: 'req' as const,
      id: task.id,
      method: payload.method || 'node.invoke',
      params: payload.params || { skillName: payload.skill, args: payload.args },
    };

    const res = await this.clawdEngine.handleRequest(req);
    if (!res.ok) {
      throw new Error(res.error?.message || 'Clawd Engine Error');
    }
    return res.payload;
  }

  private async handleGenerate(task: TaskRequest): Promise<unknown> {
    await this.delay(150);
    return { generated: true, content: 'Generated content' };
  }

  private async handleTransform(task: TaskRequest): Promise<unknown> {
    await this.delay(50);
    return { transformed: true, data: task.payload };
  }

  private async handleSearch(task: TaskRequest): Promise<unknown> {
    await this.delay(100);
    return { results: [], query: task.payload };
  }

  private async handleExecute(task: TaskRequest): Promise<unknown> {
    await this.delay(200);
    return { executed: true };
  }

  private async handleCustom(task: TaskRequest): Promise<unknown> {
    await this.delay(100);
    return { handled: true, type: task.type };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    this.processing = true;

    const processLoop = async () => {
      while (this.processing) {
        if (this.taskQueue.length > 0 && this.state.status === 'idle') {
          const task = this.taskQueue.shift();
          if (task) {
            await this.executeTask(task);
          }
        }
        await this.delay(100);
      }
    };

    processLoop().catch((err) => this.emit('error', err));
  }

  // ============================================================
  // COMMUNICATION
  // ============================================================

  /**
   * Send message to another agent
   */
  async sendMessage(
    targetAgent: string,
    message: unknown,
    options: {
      priority?: 'low' | 'medium' | 'high';
      waitForResponse?: boolean;
      timeout?: number;
    } = {}
  ): Promise<unknown> {
    this.emit('message:sending', { target: targetAgent, message });

    // In production, route through bridges
    if (options.waitForResponse) {
      // Wait for response with timeout
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Response timeout'));
        }, options.timeout || 30000);

        this.once(`response:${targetAgent}`, (response) => {
          clearTimeout(timeout);
          resolve(response);
        });
      });
    }

    return { sent: true, target: targetAgent };
  }

  /**
   * Handle incoming message
   */
  handleMessage(from: string, message: unknown): void {
    this.emit('message:received', { from, message });
    this.state.lastActivity = new Date();

    // Process based on message type
    if (typeof message === 'object' && message !== null) {
      const msg = message as { type?: string; payload?: unknown };
      if (msg.type === 'task') {
        this.submitTask(msg.payload as TaskRequest);
      }
    }
  }

  // ============================================================
  // SWARM
  // ============================================================

  /**
   * Join a swarm
   */
  async joinSwarm(groupId: string): Promise<void> {
    if (!this.config.swarmConfig) {
      this.config.swarmConfig = {
        enabled: true,
        role: 'peer',
        groupId,
      };
    } else {
      this.config.swarmConfig.enabled = true;
      this.config.swarmConfig.groupId = groupId;
    }

    this.emit('swarm:joined', { groupId });
  }

  /**
   * Leave swarm
   */
  async leaveSwarm(): Promise<void> {
    if (this.config.swarmConfig) {
      const groupId = this.config.swarmConfig.groupId;
      this.config.swarmConfig.enabled = false;
      this.config.swarmConfig.groupId = undefined;
      this.emit('swarm:left', { groupId });
    }
  }

  /**
   * Get swarm status
   */
  getSwarmStatus(): SwarmConfig | null {
    return this.config.swarmConfig || null;
  }

  // ============================================================
  // HEARTBEAT
  // ============================================================

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      this.emit('heartbeat', {
        agentId: this.config.id,
        timestamp: new Date(),
        state: this.getState(),
      });
    }, 30000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ============================================================
  // CAPABILITIES
  // ============================================================

  /**
   * Check capability
   */
  hasCapability(capability: string): boolean {
    return this.config.capabilities.includes(capability);
  }

  /**
   * Add capability
   */
  addCapability(capability: string): void {
    if (!this.config.capabilities.includes(capability)) {
      this.config.capabilities.push(capability);
      this.emit('capability:added', { capability });
    }
  }

  /**
   * Remove capability
   */
  removeCapability(capability: string): void {
    const index = this.config.capabilities.indexOf(capability);
    if (index !== -1) {
      this.config.capabilities.splice(index, 1);
      this.emit('capability:removed', { capability });
    }
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createUnifiedAgent(
  id: string,
  name: string,
  role: AgentRole,
  options: Partial<UnifiedAgentConfig> = {}
): UnifiedAgent {
  const config: UnifiedAgentConfig = {
    id,
    name,
    role,
    capabilities: options.capabilities || ['chat', 'analyze', 'generate', 'transform', 'search'],
    bridges: options.bridges || [{ type: 'universal' }],
    protocols: options.protocols || [
      { name: 'a2a', version: '0.3.0' },
      { name: 'tnf', version: '1.0.0' },
    ],
    swarmConfig: options.swarmConfig,
  };

  return new UnifiedAgent(config);
}

export default UnifiedAgent;
