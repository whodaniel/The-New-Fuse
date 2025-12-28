import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@the-new-fuse/database';

export interface SwarmConfiguration {
  maxConcurrentExecutions: number;
  defaultQualityThreshold: number;
  enableAutoScaling: boolean;
  agentSelectionStrategy: 'round_robin' | 'quality_based' | 'load_balanced';
  coordinationMode: 'centralized' | 'distributed' | 'hybrid';
}

export interface SwarmAgent {
  id: string;
  agencyId: string;
  name: string;
  type: 'specialized' | 'generalist' | 'coordinator';
  capabilities: string[];
  currentLoad: number;
  maxLoad: number;
  qualityScore: number;
  status: 'active' | 'busy' | 'offline' | 'error';
  lastHeartbeat: Date;
}

export interface SwarmTask {
  id: string;
  agencyId: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  requirements: string[];
  assignedAgents: string[];
  status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  errors?: string[];
}

export interface SwarmExecution {
  id: string;
  taskId: string;
  agencyId: string;
  coordinatorAgent: string;
  participatingAgents: SwarmAgent[];
  executionPlan: {
    phases: Array<{
      name: string;
      agents: string[];
      dependencies: string[];
      estimatedDuration: number;
    }>;
  };
  status: 'planning' | 'executing' | 'completed' | 'failed';
  metrics: {
    startTime: Date;
    endTime?: Date;
    totalDuration?: number;
    agentUtilization: Record<string, number>;
    qualityScore?: number;
  };
}

export interface SwarmStatus {
  agencyId: string;
  isSwarmEnabled: boolean;
  activeExecutions: number;
  totalProviders: number;
  activeProviders: number;
  availableCategories: string[];
  recentActivity: {
    totalRequests: number;
    completedRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
  healthMetrics: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    agentConnectivity: number;
    systemLoad: number;
    errorRate: number;
  };
}

@Injectable()
export class AgentSwarmOrchestrationService {
  private readonly logger = new Logger(AgentSwarmOrchestrationService.name);
  private swarmConfigurations = new Map<string, SwarmConfiguration>();
  private activeAgents = new Map<string, SwarmAgent[]>();
  private activeExecutions = new Map<string, SwarmExecution[]>();
  private taskQueue = new Map<string, SwarmTask[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.initializeHeartbeatMonitoring();
  }

  /**
   * Initialize swarm (global initialization for compatibility with EnhancedAgencyService)
   */
  async initializeSwarm(): Promise<{ message: string; agentCount: number }> {
    this.logger.log('Global swarm initialization');
    
    let totalAgents = 0;
    for (const agents of this.activeAgents.values()) {
      totalAgents += agents.length;
    }
    
    return {
      message: 'Swarm orchestration service initialized',
      agentCount: totalAgents,
    };
  }

  /**
   * Get global swarm status (aggregated across all agencies)
   * Note: Use getSwarmStatus(agencyId) for agency-specific status
   */
  async getGlobalSwarmStatus(): Promise<{
    totalAgents: number;
    onlineAgents: number;
    busyAgents: number;
    offlineAgents: number;
    activeExecutions: number;
    completedExecutions: number;
  }> {
    let totalAgents = 0;
    let onlineAgents = 0;
    let busyAgents = 0;
    let offlineAgents = 0;
    let activeExecutions = 0;
    let completedExecutions = 0;

    // Aggregate across all agencies
    for (const agents of this.activeAgents.values()) {
      totalAgents += agents.length;
      onlineAgents += agents.filter(a => a.status === 'active').length;
      busyAgents += agents.filter(a => a.status === 'busy').length;
      offlineAgents += agents.filter(a => a.status === 'offline').length;
    }

    for (const executions of this.activeExecutions.values()) {
      activeExecutions += executions.filter(e => e.status === 'executing').length;
      completedExecutions += executions.filter(e => e.status === 'completed').length;
    }

    return {
      totalAgents,
      onlineAgents,
      busyAgents,
      offlineAgents,
      activeExecutions,
      completedExecutions,
    };
  }

  /**
   * Initialize swarm orchestration for an agency
   */
  async initializeAgencySwarm(agencyId: string, config?: Partial<SwarmConfiguration>): Promise<void> {
    this.logger.log(`Initializing swarm orchestration for agency: ${agencyId}`);

    const defaultConfig: SwarmConfiguration = {
      maxConcurrentExecutions: 10,
      defaultQualityThreshold: 0.8,
      enableAutoScaling: true,
      agentSelectionStrategy: 'quality_based',
      coordinationMode: 'hybrid'
    };

    const swarmConfig = { ...defaultConfig, ...config };
    this.swarmConfigurations.set(agencyId, swarmConfig);

    if (!this.activeAgents.has(agencyId)) this.activeAgents.set(agencyId, []);
    if (!this.activeExecutions.has(agencyId)) this.activeExecutions.set(agencyId, []);
    if (!this.taskQueue.has(agencyId)) this.taskQueue.set(agencyId, []);

    // Emit swarm initialization event
    this.eventEmitter.emit('swarm.initialized', {
      agencyId,
      configuration: swarmConfig,
      timestamp: new Date()
    });

    this.logger.log(`Swarm orchestration initialized for agency: ${agencyId}`);
  }

  /**
   * Disable swarm orchestration for an agency
   */
  async disableAgencySwarm(agencyId: string): Promise<void> {
    this.logger.log(`Disabling swarm orchestration for agency: ${agencyId}`);

    // Complete any active executions gracefully
    const activeExecutions = this.activeExecutions.get(agencyId) || [];
    for (const execution of activeExecutions) {
      await this.terminateExecution(execution.id, 'swarm_disabled');
    }

    // Remove agency from all maps
    this.swarmConfigurations.delete(agencyId);
    this.activeAgents.delete(agencyId);
    this.activeExecutions.delete(agencyId);
    this.taskQueue.delete(agencyId);

    // Emit swarm disabled event
    this.eventEmitter.emit('swarm.disabled', {
      agencyId,
      timestamp: new Date()
    });

    this.logger.log(`Swarm orchestration disabled for agency: ${agencyId}`);
  }

  /**
   * Register an agent with the swarm
   */
  async registerAgent(agencyId: string, agent: Omit<SwarmAgent, 'id' | 'agencyId' | 'lastHeartbeat'>): Promise<string> {
    this.logger.log(`Registering agent for agency: ${agencyId}, name: ${agent.name}`);

    // Ensure swarm is initialized
    if (!this.swarmConfigurations.has(agencyId)) {
        await this.initializeAgencySwarm(agencyId);
    }

    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const swarmAgent: SwarmAgent = {
      id: agentId,
      agencyId,
      ...agent,
      lastHeartbeat: new Date()
    };

    const agents = this.activeAgents.get(agencyId) || [];
    agents.push(swarmAgent);
    this.activeAgents.set(agencyId, agents);

    // Emit agent registration event
    this.eventEmitter.emit('agent.registered', {
      agencyId,
      agent: swarmAgent,
      timestamp: new Date()
    });

    this.logger.log(`Agent registered: ${agentId} for agency: ${agencyId}`);
    return agentId;
  }

  /**
   * Submit a task for swarm execution
   */
  async submitTask(agencyId: string, task: Omit<SwarmTask, 'id' | 'agencyId' | 'status' | 'progress' | 'createdAt'>): Promise<string> {
    this.logger.log(`Submitting task for agency: ${agencyId}, type: ${task.type}`);

    // Ensure swarm is initialized
    if (!this.swarmConfigurations.has(agencyId)) {
        await this.initializeAgencySwarm(agencyId);
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const swarmTask: SwarmTask = {
      id: taskId,
      agencyId,
      ...task,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      assignedAgents: []
    };

    const tasks = this.taskQueue.get(agencyId) || [];
    tasks.push(swarmTask);
    this.taskQueue.set(agencyId, tasks);

    // Trigger task assignment
    await this.processTaskQueue(agencyId);

    this.logger.log(`Task submitted: ${taskId}`);
    return taskId;
  }

  /**
   * Get swarm status for an agency
   */
  async getSwarmStatus(agencyId: string): Promise<SwarmStatus> {
    const agents = this.activeAgents.get(agencyId) || [];
    const executions = this.activeExecutions.get(agencyId) || [];
    const tasks = this.taskQueue.get(agencyId) || [];

    const activeAgents = agents.filter(a => a.status === 'active');
    const recentTasks = tasks.filter(t =>
      t.createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const completedTasks = recentTasks.filter(t => t.status === 'completed');
    const failedTasks = recentTasks.filter(t => t.status === 'failed');

    const averageResponseTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          const duration = task.completedAt && task.startedAt
            ? task.completedAt.getTime() - task.startedAt.getTime()
            : 0;
          return sum + duration;
        }, 0) / completedTasks.length
      : 0;

    return {
      agencyId,
      isSwarmEnabled: this.swarmConfigurations.has(agencyId),
      activeExecutions: executions.filter(e => e.status === 'executing').length,
      totalProviders: agents.length,
      activeProviders: activeAgents.length,
      availableCategories: [...new Set(agents.flatMap(a => a.capabilities))],
      recentActivity: {
        totalRequests: recentTasks.length,
        completedRequests: completedTasks.length,
        failedRequests: failedTasks.length,
        averageResponseTime: Math.round(averageResponseTime)
      },
      healthMetrics: {
        overallHealth: this.calculateOverallHealth(agencyId),
        agentConnectivity: agents.length > 0 ? activeAgents.length / agents.length : 0,
        systemLoad: this.calculateSystemLoad(agencyId),
        errorRate: recentTasks.length > 0 ? failedTasks.length / recentTasks.length : 0
      }
    };
  }

  /**
   * Get execution metrics for an agency
   */
  async getExecutionMetrics(agencyId: string): Promise<any> {
    const executions = this.activeExecutions.get(agencyId) || [];
    const tasks = this.taskQueue.get(agencyId) || [];

    return {
      totalExecutions: executions.length,
      activeExecutions: executions.filter(e => e.status === 'executing').length,
      completedExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
      averageExecutionTime: this.calculateAverageExecutionTime(executions),
      taskBacklog: tasks.filter(t => t.status === 'pending').length,
      agentUtilization: this.calculateAgentUtilization(agencyId)
    };
  }

  /**
   * Process task queue and assign tasks to available agents
   */
  private async processTaskQueue(agencyId: string): Promise<void> {
    const config = this.swarmConfigurations.get(agencyId);
    const agents = this.activeAgents.get(agencyId) || [];
    const executions = this.activeExecutions.get(agencyId) || [];
    const tasks = this.taskQueue.get(agencyId) || [];

    if (!config) return;

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const activeExecutionsCount = executions.filter(e => e.status === 'executing').length;

    for (const task of pendingTasks) {
      if (activeExecutionsCount >= config.maxConcurrentExecutions) break;

      const suitableAgents = this.findSuitableAgents(agents, task);
      if (suitableAgents.length > 0) {
        await this.assignTaskToAgents(task, suitableAgents);
      }
    }
  }

  /**
   * Find suitable agents for a task based on capabilities and availability
   */
  private findSuitableAgents(agents: SwarmAgent[], task: SwarmTask): SwarmAgent[] {
    return agents.filter(agent =>
      agent.status === 'active' &&
      agent.currentLoad < agent.maxLoad &&
      task.requirements.some(req => agent.capabilities.includes(req))
    ).sort((a, b) => {
      // Sort by quality score and current load
      const aScore = a.qualityScore * (1 - a.currentLoad / a.maxLoad);
      const bScore = b.qualityScore * (1 - b.currentLoad / b.maxLoad);
      return bScore - aScore;
    });
  }

  /**
   * Assign a task to selected agents
   */
  private async assignTaskToAgents(task: SwarmTask, agents: SwarmAgent[]): Promise<void> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Simulate updating load
    agents.forEach(agent => {
        agent.currentLoad += 1;
        // agent.status = 'busy'; // Consider logic for when to mark as busy
    });

    const execution: SwarmExecution = {
      id: executionId,
      taskId: task.id,
      agencyId: task.agencyId,
      coordinatorAgent: agents[0].id,
      participatingAgents: agents,
      executionPlan: {
        phases: [{
          name: 'execution',
          agents: agents.map(a => a.id),
          dependencies: [],
          estimatedDuration: 5000 // 5 seconds default
        }]
      },
      status: 'executing',
      metrics: {
        startTime: new Date(),
        agentUtilization: {}
      }
    };

    // Update task status
    task.status = 'assigned';
    task.assignedAgents = agents.map(a => a.id);
    task.startedAt = new Date();

    // Add to active executions
    const executions = this.activeExecutions.get(task.agencyId) || [];
    executions.push(execution);
    this.activeExecutions.set(task.agencyId, executions);

    // Emit task assignment event
    this.eventEmitter.emit('task.assigned', {
      task,
      execution,
      timestamp: new Date()
    });

    this.logger.log(`Task ${task.id} assigned to ${agents.length} agents in execution ${executionId}`);

    // NOTE: In a real implementation, we would now dispatch messages to the agents via A2A
    // e.g. this.a2aService.sendMessage(agents[0].id, { type: 'TASK_ASSIGNED', payload: task });
    // For now, we simulate completion after a delay
    setTimeout(() => {
        this.completeExecution(executionId, task.agencyId);
    }, 5000);
  }

  private async completeExecution(executionId: string, agencyId: string): Promise<void> {
      const executions = this.activeExecutions.get(agencyId);
      const execution = executions?.find(e => e.id === executionId);
      if (execution) {
          execution.status = 'completed';
          execution.metrics.endTime = new Date();

          // Release agents
          execution.participatingAgents.forEach(agent => {
              if (agent.currentLoad > 0) agent.currentLoad -= 1;
              agent.status = 'active';
          });

          const tasks = this.taskQueue.get(agencyId);
          const task = tasks?.find(t => t.id === execution.taskId);
          if (task) {
              task.status = 'completed';
              task.completedAt = new Date();
          }

          this.eventEmitter.emit('execution.completed', {
             execution,
             timestamp: new Date()
          });
      }
  }

  /**
   * Terminate an execution
   */
  private async terminateExecution(executionId: string, reason: string): Promise<void> {
    for (const [, executions] of this.activeExecutions.entries()) {
      const execution = executions.find(e => e.id === executionId);
      if (execution) {
        execution.status = 'failed';
        execution.metrics.endTime = new Date();

        execution.participatingAgents.forEach(agent => {
             if (agent.currentLoad > 0) agent.currentLoad -= 1;
        });

        this.eventEmitter.emit('execution.terminated', {
          execution,
          reason,
          timestamp: new Date()
        });

        this.logger.log(`Execution ${executionId} terminated: ${reason}`);
        break;
      }
    }
  }

  /**
   * Initialize heartbeat monitoring for agents
   */
  private initializeHeartbeatMonitoring(): void {
    setInterval(() => {
      this.monitorAgentHeartbeats();
    }, 30000); // Check every 30 seconds
    this.logger.log('Heartbeat monitoring initialized');
  }

  /**
   * Monitor agent heartbeats and update status
   */
  private monitorAgentHeartbeats(): void {
    const now = new Date();
    const heartbeatTimeout = 60000; // 60 seconds

    for (const [agencyId, agents] of this.activeAgents.entries()) {
      for (const agent of agents) {
        const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
        if (timeSinceHeartbeat > heartbeatTimeout && agent.status !== 'offline') {
          agent.status = 'offline';
          this.eventEmitter.emit('agent.offline', {
            agencyId,
            agent,
            timestamp: now
          });
          this.logger.warn(`Agent ${agent.id} marked as offline`);
        }
      }
    }
  }

  /**
   * Calculate overall health for an agency's swarm
   */
  private calculateOverallHealth(agencyId: string): 'excellent' | 'good' | 'fair' | 'poor' {
    const agents = this.activeAgents.get(agencyId) || [];
    if (agents.length === 0) return 'poor';

    const activeAgents = agents.filter(a => a.status === 'active');
    const connectivity = activeAgents.length / agents.length;
    const systemLoad = this.calculateSystemLoad(agencyId);

    if (connectivity > 0.9 && systemLoad < 0.7) return 'excellent';
    if (connectivity > 0.7 && systemLoad < 0.8) return 'good';
    if (connectivity > 0.5 && systemLoad < 0.9) return 'fair';
    return 'poor';
  }

  /**
   * Calculate system load for an agency
   */
  private calculateSystemLoad(agencyId: string): number {
    const agents = this.activeAgents.get(agencyId) || [];
    if (agents.length === 0) return 0;

    const totalLoad = agents.reduce((sum, agent) => sum + (agent.currentLoad / agent.maxLoad), 0);
    return totalLoad / agents.length;
  }

  /**
   * Calculate average execution time
   */
  private calculateAverageExecutionTime(executions: SwarmExecution[]): number {
    const completedExecutions = executions.filter(e =>
      e.status === 'completed' && e.metrics.endTime
    );

    if (completedExecutions.length === 0) return 0;

    const totalTime = completedExecutions.reduce((sum, exec) => {
      const duration = exec.metrics.endTime!.getTime() - exec.metrics.startTime.getTime();
      return sum + duration;
    }, 0);

    return Math.round(totalTime / completedExecutions.length);
  }

  /**
   * Calculate agent utilization
   */
  private calculateAgentUtilization(agencyId: string): Record<string, number> {
    const agents = this.activeAgents.get(agencyId) || [];
    const utilization: Record<string, number> = {};

    for (const agent of agents) {
      utilization[agent.id] = agent.currentLoad / agent.maxLoad;
    }

    return utilization;
  }
}
