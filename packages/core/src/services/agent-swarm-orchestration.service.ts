/**
 * Agent Swarm Orchestration Service
 * Implements hierarchical agent organization, communication flows, and service routing
 *
 * CONNECTS TO:
 * - CascadeService: For step-by-step execution pipelines
 * - CapabilityDiscoveryService: For finding agents by capability
 * - PrismaService: For persistence
 * - EventEmitter2: For pub/sub communication
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CascadeService, CascadeMode, CascadeState } from './CascadeService';
import { CapabilityDiscoveryService } from './CapabilityDiscoveryService';
import { Observable, Subject, interval, takeUntil } from 'rxjs';

// Types for Swarm Orchestration
export interface SwarmAgent {
  id: string;
  name: string;
  capabilities: string[];
  status: 'online' | 'busy' | 'offline' | 'error';
  lastHeartbeat: Date;
  currentTask?: string;
  metadata?: Record<string, any>;
}

export interface SwarmTask {
  id: string;
  name: string;
  requiredCapabilities: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  payload: any;
  timeout?: number;
  retries?: number;
}

export interface SwarmExecution {
  id: string;
  taskId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  steps: SwarmExecutionStep[];
}

export interface SwarmExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  output?: any;
}

export interface SwarmMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  type: 'task' | 'result' | 'heartbeat' | 'error' | 'coordination';
  payload: any;
  timestamp: Date;
}

@Injectable()
export class AgentSwarmOrchestrationService implements OnModuleInit {
  private readonly logger = new Logger(AgentSwarmOrchestrationService.name);

  // In-memory registries (backed by events for distribution)
  private agents: Map<string, SwarmAgent> = new Map();
  private executions: Map<string, SwarmExecution> = new Map();
  private messages: Map<string, SwarmMessage[]> = new Map();

  // Heartbeat tracking
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL_MS = 30000;
  private readonly AGENT_TIMEOUT_MS = 90000;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cascadeService: CascadeService,
    private readonly capabilityDiscovery: CapabilityDiscoveryService,
  ) {}

  async onModuleInit() {
    this.logger.log('AgentSwarmOrchestrationService initializing...');
    await this.initializeSwarm();
  }

  /**
   * Initialize the swarm orchestration system
   */
  async initializeSwarm(): Promise<{ message: string; agentCount: number }> {
    this.logger.log('Initializing agent swarm...');

    // Setup event listeners for distributed coordination
    this.setupEventListeners();

    // Start heartbeat monitoring
    this.startHeartbeatMonitor();

    // Load any persisted agents from database
    try {
      const dbAgents = await this.prisma.agent.findMany({
        where: { status: { not: 'deleted' } },
      });

      for (const agent of dbAgents) {
        this.agents.set(agent.id, {
          id: agent.id,
          name: agent.name,
          capabilities: (agent.capabilities as string[]) || [],
          status: 'offline', // They'll come online when they heartbeat
          lastHeartbeat: new Date(0),
          metadata: (agent.config as Record<string, any>) || {},
        });
      }

      this.logger.log(`Loaded ${dbAgents.length} agents from database`);
    } catch (error) {
      this.logger.warn('Could not load agents from database, starting fresh');
    }

    this.eventEmitter.emit('swarm.initialized', {
      agentCount: this.agents.size,
      timestamp: new Date(),
    });

    return {
      message: 'Swarm initialized successfully',
      agentCount: this.agents.size,
    };
  }

  private setupEventListeners(): void {
    // Agent lifecycle events
    this.eventEmitter.on('agent.registered', (agent: SwarmAgent) => {
      this.agents.set(agent.id, agent);
      this.logger.log(`Agent registered: ${agent.name} (${agent.id})`);
    });

    this.eventEmitter.on('agent.heartbeat', (data: { agentId: string; status: string }) => {
      const agent = this.agents.get(data.agentId);
      if (agent) {
        agent.lastHeartbeat = new Date();
        agent.status = (data.status as SwarmAgent['status']) || 'online';
      }
    });

    // Execution events
    this.eventEmitter.on('execution.started', (execution: SwarmExecution) => {
      this.executions.set(execution.id, execution);
    });

    this.eventEmitter.on('execution.completed', (data: { executionId: string; result: any }) => {
      const execution = this.executions.get(data.executionId);
      if (execution) {
        execution.status = 'completed';
        execution.completedAt = new Date();
        execution.result = data.result;
      }
    });
  }

  private startHeartbeatMonitor(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.checkAgentHealth();
    }, this.HEARTBEAT_INTERVAL_MS);

    this.logger.log('Heartbeat monitor started');
  }

  private checkAgentHealth(): void {
    const now = Date.now();

    for (const [id, agent] of this.agents) {
      const lastSeen = agent.lastHeartbeat.getTime();
      if (now - lastSeen > this.AGENT_TIMEOUT_MS && agent.status !== 'offline') {
        agent.status = 'offline';
        this.logger.warn(`Agent ${agent.name} (${id}) marked offline - no heartbeat`);
        this.eventEmitter.emit('agent.offline', { agentId: id, agent });
      }
    }
  }

  /**
   * Execute a swarm task by finding suitable agents and orchestrating execution
   */
  async executeSwarmTask(task: SwarmTask): Promise<SwarmExecution> {
    this.logger.log(`Executing swarm task: ${task.name} (${task.id})`);

    // 1. Find capable agents using CapabilityDiscoveryService
    const capabilities = await this.capabilityDiscovery.discoverCapabilities(
      task.requiredCapabilities,
    );

    // 2. Find online agents that match
    const suitableAgents = Array.from(this.agents.values()).filter(
      (agent) =>
        agent.status === 'online' &&
        task.requiredCapabilities.every((cap) => agent.capabilities.includes(cap)),
    );

    if (suitableAgents.length === 0) {
      throw new Error(
        `No suitable agents found for capabilities: ${task.requiredCapabilities.join(', ')}`,
      );
    }

    // 3. Select best agent (simplest: first available, could be more sophisticated)
    const selectedAgent = suitableAgents[0];
    selectedAgent.status = 'busy';
    selectedAgent.currentTask = task.id;

    // 4. Create execution record
    const execution: SwarmExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId: task.id,
      agentId: selectedAgent.id,
      status: 'running',
      startedAt: new Date(),
      steps: [],
    };

    this.executions.set(execution.id, execution);
    this.eventEmitter.emit('execution.started', execution);

    // 5. Create cascade controller for step execution
    const controller = this.cascadeService.createController(
      `task-${task.id}`,
      CascadeMode.SEQUENTIAL,
      { timeout: task.timeout || 60000, retries: task.retries || 3 },
    );

    // 6. Add task execution as a cascade step
    this.cascadeService.addStep(controller.id, {
      name: 'execute-task',
      handler: async (input, context) => {
        // This is where the actual agent execution would happen
        // For now, emit an event that agents can subscribe to
        this.eventEmitter.emit('agent.task.assigned', {
          agentId: selectedAgent.id,
          task,
          executionId: execution.id,
        });

        // Return the task for the next step
        return { task, agentId: selectedAgent.id };
      },
    });

    // 7. Execute the cascade
    try {
      const result = await this.cascadeService.executeController(controller.id, task.payload);

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.result = result;

      // Release the agent
      selectedAgent.status = 'online';
      selectedAgent.currentTask = undefined;

      this.eventEmitter.emit('execution.completed', {
        executionId: execution.id,
        result,
      });

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = error instanceof Error ? error.message : String(error);

      selectedAgent.status = 'online';
      selectedAgent.currentTask = undefined;

      this.eventEmitter.emit('execution.failed', {
        executionId: execution.id,
        error: execution.error,
      });

      throw error;
    }
  }

  /**
   * Get the current status of the swarm
   */
  async getSwarmStatus(): Promise<{
    totalAgents: number;
    onlineAgents: number;
    busyAgents: number;
    offlineAgents: number;
    activeExecutions: number;
    completedExecutions: number;
  }> {
    const agents = Array.from(this.agents.values());
    const executions = Array.from(this.executions.values());

    return {
      totalAgents: agents.length,
      onlineAgents: agents.filter((a) => a.status === 'online').length,
      busyAgents: agents.filter((a) => a.status === 'busy').length,
      offlineAgents: agents.filter((a) => a.status === 'offline').length,
      activeExecutions: executions.filter((e) => e.status === 'running').length,
      completedExecutions: executions.filter((e) => e.status === 'completed').length,
    };
  }

  /**
   * Get detailed swarm metrics
   */
  async getSwarmMetrics(): Promise<{
    agents: SwarmAgent[];
    executionStats: {
      total: number;
      pending: number;
      running: number;
      completed: number;
      failed: number;
      averageDurationMs: number;
    };
  }> {
    const executions = Array.from(this.executions.values());
    const completedExecs = executions.filter((e) => e.status === 'completed' && e.completedAt);

    let avgDuration = 0;
    if (completedExecs.length > 0) {
      const totalDuration = completedExecs.reduce(
        (sum, e) => sum + (e.completedAt!.getTime() - e.startedAt.getTime()),
        0,
      );
      avgDuration = totalDuration / completedExecs.length;
    }

    return {
      agents: Array.from(this.agents.values()),
      executionStats: {
        total: executions.length,
        pending: executions.filter((e) => e.status === 'pending').length,
        running: executions.filter((e) => e.status === 'running').length,
        completed: completedExecs.length,
        failed: executions.filter((e) => e.status === 'failed').length,
        averageDurationMs: avgDuration,
      },
    };
  }

  /**
   * Register a new agent with the swarm
   */
  async registerAgent(agent: Omit<SwarmAgent, 'lastHeartbeat'>): Promise<SwarmAgent> {
    const swarmAgent: SwarmAgent = {
      ...agent,
      lastHeartbeat: new Date(),
    };

    this.agents.set(agent.id, swarmAgent);
    this.eventEmitter.emit('agent.registered', swarmAgent);

    // Persist to database
    try {
      await this.prisma.agent.upsert({
        where: { id: agent.id },
        create: {
          id: agent.id,
          name: agent.name,
          type: 'SWARM',
          capabilities: agent.capabilities,
          config: agent.metadata || {},
          status: 'active',
        },
        update: {
          name: agent.name,
          capabilities: agent.capabilities,
          config: agent.metadata || {},
        },
      });
    } catch (error) {
      this.logger.warn(`Could not persist agent ${agent.id} to database`);
    }

    return swarmAgent;
  }

  /**
   * Send a message between agents
   */
  async sendMessage(message: Omit<SwarmMessage, 'id' | 'timestamp'>): Promise<SwarmMessage> {
    const fullMessage: SwarmMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    // Store message
    const agentMessages = this.messages.get(message.toAgent) || [];
    agentMessages.push(fullMessage);
    this.messages.set(message.toAgent, agentMessages);

    // Emit for real-time delivery
    this.eventEmitter.emit('agent.message', fullMessage);
    this.eventEmitter.emit(`agent.message.${message.toAgent}`, fullMessage);

    return fullMessage;
  }

  /**
   * Get messages for an agent
   */
  async getMessages(agentId: string, since?: Date): Promise<SwarmMessage[]> {
    const messages = this.messages.get(agentId) || [];
    if (since) {
      return messages.filter((m) => m.timestamp > since);
    }
    return messages;
  }

  /**
   * Create a new execution
   */
  async createExecution(taskId: string, agentId: string): Promise<SwarmExecution> {
    const execution: SwarmExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      agentId,
      status: 'pending',
      startedAt: new Date(),
      steps: [],
    };

    this.executions.set(execution.id, execution);
    return execution;
  }

  /**
   * Get all executions
   */
  async getExecutions(filter?: { status?: string; agentId?: string }): Promise<SwarmExecution[]> {
    let executions = Array.from(this.executions.values());

    if (filter?.status) {
      executions = executions.filter((e) => e.status === filter.status);
    }
    if (filter?.agentId) {
      executions = executions.filter((e) => e.agentId === filter.agentId);
    }

    return executions;
  }

  /**
   * Get execution details
   */
  async getExecutionDetails(executionId: string): Promise<SwarmExecution | null> {
    return this.executions.get(executionId) || null;
  }

  /**
   * Update execution status
   */
  async updateExecutionStatus(
    executionId: string,
    status: SwarmExecution['status'],
    result?: any,
    error?: string,
  ): Promise<SwarmExecution | null> {
    const execution = this.executions.get(executionId);
    if (!execution) return null;

    execution.status = status;
    if (result) execution.result = result;
    if (error) execution.error = error;
    if (status === 'completed' || status === 'failed') {
      execution.completedAt = new Date();
    }

    this.eventEmitter.emit(`execution.${status}`, { executionId, result, error });

    return execution;
  }

  /**
   * Update execution step
   */
  async updateExecutionStep(
    executionId: string,
    stepId: string,
    update: Partial<SwarmExecutionStep>,
  ): Promise<SwarmExecution | null> {
    const execution = this.executions.get(executionId);
    if (!execution) return null;

    const step = execution.steps.find((s) => s.id === stepId);
    if (step) {
      Object.assign(step, update);
    }

    return execution;
  }

  /**
   * Stream execution progress
   */
  streamExecutionProgress(executionId: string): Observable<SwarmExecution | null> {
    const subject = new Subject<SwarmExecution | null>();

    // Initial emission
    subject.next(this.executions.get(executionId) || null);

    // Subscribe to execution updates
    const listener = (data: { executionId: string }) => {
      if (data.executionId === executionId) {
        subject.next(this.executions.get(executionId) || null);
      }
    };

    this.eventEmitter.on('execution.completed', listener);
    this.eventEmitter.on('execution.failed', listener);
    this.eventEmitter.on('execution.step.updated', listener);

    // Also poll at regular intervals
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const exec = this.executions.get(executionId);
        if (exec) {
          subject.next(exec);
          if (exec.status === 'completed' || exec.status === 'failed') {
            subject.complete();
          }
        }
      });

    return subject.asObservable();
  }

  /**
   * Perform health check on the swarm
   */
  async performHealthCheck(): Promise<{
    healthy: boolean;
    checks: Array<{ name: string; status: 'pass' | 'fail'; message: string }>;
  }> {
    const checks: Array<{ name: string; status: 'pass' | 'fail'; message: string }> = [];

    // Check agent availability
    const onlineAgents = Array.from(this.agents.values()).filter((a) => a.status === 'online');
    checks.push({
      name: 'agent-availability',
      status: onlineAgents.length > 0 ? 'pass' : 'fail',
      message: `${onlineAgents.length} agents online`,
    });

    // Check execution queue
    const runningExecs = Array.from(this.executions.values()).filter((e) => e.status === 'running');
    checks.push({
      name: 'execution-queue',
      status: 'pass',
      message: `${runningExecs.length} executions in progress`,
    });

    // Check heartbeat monitor
    checks.push({
      name: 'heartbeat-monitor',
      status: this.heartbeatInterval ? 'pass' : 'fail',
      message: this.heartbeatInterval ? 'Running' : 'Stopped',
    });

    const healthy = checks.every((c) => c.status === 'pass');

    return { healthy, checks };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    uptime: number;
    totalExecutions: number;
    successRate: number;
    averageExecutionTimeMs: number;
    agentUtilization: number;
  }> {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter((e) => e.status === 'completed');
    const failed = executions.filter((e) => e.status === 'failed');

    const successRate = executions.length > 0 ? (completed.length / executions.length) * 100 : 100;

    let avgTime = 0;
    if (completed.length > 0) {
      const totalTime = completed.reduce(
        (sum, e) => sum + (e.completedAt!.getTime() - e.startedAt.getTime()),
        0,
      );
      avgTime = totalTime / completed.length;
    }

    const agents = Array.from(this.agents.values());
    const busyAgents = agents.filter((a) => a.status === 'busy').length;
    const utilization = agents.length > 0 ? (busyAgents / agents.length) * 100 : 0;

    return {
      uptime: process.uptime() * 1000,
      totalExecutions: executions.length,
      successRate,
      averageExecutionTimeMs: avgTime,
      agentUtilization: utilization,
    };
  }

  /**
   * Manage agent communication (coordination)
   */
  async manageAgentCommunication(coordination: {
    type: 'sync' | 'broadcast' | 'delegate';
    agents: string[];
    payload: any;
  }): Promise<{ success: boolean; responses: any[] }> {
    const responses: any[] = [];

    switch (coordination.type) {
      case 'broadcast':
        // Send to all specified agents
        for (const agentId of coordination.agents) {
          await this.sendMessage({
            fromAgent: 'orchestrator',
            toAgent: agentId,
            type: 'coordination',
            payload: coordination.payload,
          });
          responses.push({ agentId, status: 'sent' });
        }
        break;

      case 'sync':
        // Emit synchronization event
        this.eventEmitter.emit('swarm.sync', {
          agents: coordination.agents,
          payload: coordination.payload,
        });
        responses.push({ type: 'sync', status: 'emitted' });
        break;

      case 'delegate':
        // Delegate work to first available agent
        const available = coordination.agents
          .map((id) => this.agents.get(id))
          .filter((a) => a && a.status === 'online')[0];

        if (available) {
          await this.sendMessage({
            fromAgent: 'orchestrator',
            toAgent: available.id,
            type: 'task',
            payload: coordination.payload,
          });
          responses.push({ agentId: available.id, status: 'delegated' });
        } else {
          return { success: false, responses: [{ error: 'No available agents' }] };
        }
        break;
    }

    return { success: true, responses };
  }

  /**
   * Orchestrate a service request
   */
  async orchestrateServiceRequest(request: {
    service: string;
    method: string;
    params: any;
    requiredCapabilities?: string[];
  }): Promise<{ success: boolean; result: any }> {
    this.logger.log(`Orchestrating service request: ${request.service}.${request.method}`);

    // Find agents that can handle this service
    const capabilities = request.requiredCapabilities || [request.service];
    const suitableAgents = Array.from(this.agents.values()).filter(
      (agent) =>
        agent.status === 'online' && capabilities.some((cap) => agent.capabilities.includes(cap)),
    );

    if (suitableAgents.length === 0) {
      return { success: false, result: { error: 'No suitable agents available' } };
    }

    // Create a task for this service request
    const task: SwarmTask = {
      id: `svc-${Date.now()}`,
      name: `${request.service}.${request.method}`,
      requiredCapabilities: capabilities,
      priority: 'medium',
      payload: { service: request.service, method: request.method, params: request.params },
    };

    try {
      const execution = await this.executeSwarmTask(task);
      return { success: true, result: execution.result };
    } catch (error) {
      return {
        success: false,
        result: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Get execution metrics
   */
  async getExecutionMetrics(): Promise<{
    totalExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    executionsByStatus: Record<string, number>;
  }> {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter((e) => e.completedAt);

    let avgTime = 0;
    if (completed.length > 0) {
      const totalTime = completed.reduce(
        (sum, e) => sum + (e.completedAt!.getTime() - e.startedAt.getTime()),
        0,
      );
      avgTime = totalTime / completed.length;
    }

    const byStatus: Record<string, number> = {};
    for (const exec of executions) {
      byStatus[exec.status] = (byStatus[exec.status] || 0) + 1;
    }

    return {
      totalExecutions: executions.length,
      completedExecutions: executions.filter((e) => e.status === 'completed').length,
      failedExecutions: executions.filter((e) => e.status === 'failed').length,
      averageExecutionTime: avgTime,
      executionsByStatus: byStatus,
    };
  }
}
