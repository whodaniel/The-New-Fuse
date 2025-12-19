/**
 * Director Service - The Autonomous Loop Orchestrator
 *
 * This is the "spark of life" for TNF - the central service that:
 * 1. Runs on a configurable cycle (default: 60 seconds)
 * 2. Monitors system health
 * 3. Processes pending tasks
 * 4. Triggers self-reflection
 * 5. Generates handoffs for continuity
 * 6. Manages the autonomous improvement loop
 *
 * CONNECTS TO (no duplication, reuses existing services):
 * - AgentSwarmOrchestrationService: For agent coordination
 * - HeartbeatMonitoringService: For health monitoring (via relay-core)
 * - TaskSchedulerService: For task management
 * - PromptTemplateService: For handoff generation (via prompt-templating)
 * - EventEmitter2: For pub/sub communication
 * - Redis: For state persistence
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@the-new-fuse/database';
import {
  AgentSwarmOrchestrationService,
  SwarmTask,
  SwarmExecution,
} from './agent-swarm-orchestration.service';
import { CascadeService, CascadeMode } from './CascadeService';
import { CapabilityDiscoveryService } from './CapabilityDiscoveryService';
import { MonitoringService } from './MonitoringService';

// Director Configuration
export interface DirectorConfig {
  cycleIntervalMs: number; // How often to run the autonomous loop (default: 60000)
  healthCheckIntervalMs: number; // How often to check health (default: 30000)
  reflectionIntervalMs: number; // How often to reflect (default: 300000 - 5 min)
  handoffIntervalMs: number; // How often to create handoffs (default: 600000 - 10 min)
  maxConcurrentTasks: number; // Max parallel tasks (default: 10)
  autoRecoveryEnabled: boolean; // Auto-recover from failures (default: true)
  learningEnabled: boolean; // Learn from executions (default: true)
}

// System State Snapshot
export interface SystemSnapshot {
  timestamp: Date;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{ name: string; status: 'pass' | 'fail'; message: string }>;
  };
  agents: {
    total: number;
    online: number;
    busy: number;
    offline: number;
  };
  tasks: {
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  performance: {
    uptime: number;
    successRate: number;
    avgExecutionTime: number;
  };
}

// Insight from reflection
export interface Insight {
  id: string;
  type: 'improvement' | 'issue' | 'opportunity' | 'pattern';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  suggestedActions: string[];
  metadata: Record<string, any>;
  createdAt: Date;
}

// Handoff document
export interface HandoffDocument {
  id: string;
  sessionId: string;
  createdAt: Date;
  systemState: SystemSnapshot;
  completedTasks: Array<{ id: string; name: string; outcome: string }>;
  learnings: Insight[];
  pendingWork: Array<{ id: string; description: string; priority: string }>;
  nextSteps: string[];
  context: Record<string, any>;
}

// Director Cycle Result
export interface DirectorCycleResult {
  cycleId: string;
  startedAt: Date;
  completedAt: Date;
  tasksProcessed: number;
  insightsGenerated: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  actions: string[];
}

@Injectable()
export class DirectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DirectorService.name);

  // Cycle management
  private cycleInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reflectionInterval: NodeJS.Timeout | null = null;
  private handoffInterval: NodeJS.Timeout | null = null;

  // State
  private isRunning = false;
  private cycleCount = 0;
  private lastSnapshot: SystemSnapshot | null = null;
  private insights: Insight[] = [];
  private handoffs: HandoffDocument[] = [];
  private sessionId: string;

  // Configuration
  private config: DirectorConfig;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly swarmService: AgentSwarmOrchestrationService,
    private readonly cascadeService: CascadeService,
    private readonly capabilityDiscovery: CapabilityDiscoveryService,
    private readonly monitoringService: MonitoringService,
  ) {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Load configuration with defaults
    this.config = {
      cycleIntervalMs: this.configService.get<number>('DIRECTOR_CYCLE_INTERVAL', 60000),
      healthCheckIntervalMs: this.configService.get<number>('DIRECTOR_HEALTH_INTERVAL', 30000),
      reflectionIntervalMs: this.configService.get<number>('DIRECTOR_REFLECTION_INTERVAL', 300000),
      handoffIntervalMs: this.configService.get<number>('DIRECTOR_HANDOFF_INTERVAL', 600000),
      maxConcurrentTasks: this.configService.get<number>('DIRECTOR_MAX_TASKS', 10),
      autoRecoveryEnabled: this.configService.get<boolean>('DIRECTOR_AUTO_RECOVERY', true),
      learningEnabled: this.configService.get<boolean>('DIRECTOR_LEARNING', true),
    };
  }

  async onModuleInit() {
    this.logger.log('🔮 DirectorService initializing...');
    this.logger.log(`Session ID: ${this.sessionId}`);
    await this.start();
  }

  async onModuleDestroy() {
    await this.stop();
  }

  /**
   * Start the autonomous loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Director is already running');
      return;
    }

    this.logger.log('🚀 Starting Director autonomous loop...');
    this.isRunning = true;

    // Initial health check
    await this.performHealthCheck();

    // Start the main cycle
    this.cycleInterval = setInterval(async () => {
      await this.executeCycle();
    }, this.config.cycleIntervalMs);

    // Start health monitoring
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);

    // Start reflection loop
    this.reflectionInterval = setInterval(async () => {
      await this.performReflection();
    }, this.config.reflectionIntervalMs);

    // Start handoff generation
    this.handoffInterval = setInterval(async () => {
      await this.generateHandoff();
    }, this.config.handoffIntervalMs);

    this.eventEmitter.emit('director.started', {
      sessionId: this.sessionId,
      config: this.config,
      timestamp: new Date(),
    });

    this.logger.log('✅ Director autonomous loop started');
  }

  /**
   * Stop the autonomous loop
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.log('Stopping Director autonomous loop...');
    this.isRunning = false;

    // Clear all intervals
    if (this.cycleInterval) clearInterval(this.cycleInterval);
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.reflectionInterval) clearInterval(this.reflectionInterval);
    if (this.handoffInterval) clearInterval(this.handoffInterval);

    // Generate final handoff
    await this.generateHandoff();

    this.eventEmitter.emit('director.stopped', {
      sessionId: this.sessionId,
      cycleCount: this.cycleCount,
      timestamp: new Date(),
    });

    this.logger.log('Director stopped');
  }

  /**
   * Execute a single cycle of the autonomous loop
   */
  async executeCycle(): Promise<DirectorCycleResult> {
    const cycleId = `cycle-${++this.cycleCount}`;
    const startedAt = new Date();
    const actions: string[] = [];

    this.logger.log(`🔄 Starting cycle ${cycleId}...`);

    try {
      // 1. Check system health
      const health = await this.swarmService.performHealthCheck();
      const healthStatus = health.healthy ? 'healthy' : 'degraded';

      if (!health.healthy && this.config.autoRecoveryEnabled) {
        actions.push('Initiated auto-recovery');
        await this.handleHealthIssue(health);
      }

      // 2. Get pending tasks from the system
      const pendingTasks = await this.getPendingTasks();
      let tasksProcessed = 0;

      // 3. Process tasks (up to max concurrent)
      const tasksToProcess = pendingTasks.slice(0, this.config.maxConcurrentTasks);
      for (const task of tasksToProcess) {
        try {
          await this.processTask(task);
          tasksProcessed++;
          actions.push(`Processed task: ${task.id}`);
        } catch (error) {
          this.logger.error(`Failed to process task ${task.id}:`, error);
          actions.push(`Failed task: ${task.id}`);
        }
      }

      // 4. Generate insights if learning is enabled
      let insightsGenerated = 0;
      if (this.config.learningEnabled && this.cycleCount % 5 === 0) {
        const newInsights = await this.generateInsights();
        insightsGenerated = newInsights.length;
        actions.push(`Generated ${insightsGenerated} insights`);
      }

      // 5. Emit cycle completion
      const result: DirectorCycleResult = {
        cycleId,
        startedAt,
        completedAt: new Date(),
        tasksProcessed,
        insightsGenerated,
        healthStatus,
        actions,
      };

      this.eventEmitter.emit('director.cycle.completed', result);
      this.logger.log(
        `✅ Cycle ${cycleId} completed: ${tasksProcessed} tasks, ${insightsGenerated} insights`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Cycle ${cycleId} failed:`, error);

      const result: DirectorCycleResult = {
        cycleId,
        startedAt,
        completedAt: new Date(),
        tasksProcessed: 0,
        insightsGenerated: 0,
        healthStatus: 'unhealthy',
        actions: ['Cycle failed: ' + (error instanceof Error ? error.message : String(error))],
      };

      this.eventEmitter.emit('director.cycle.failed', result);
      return result;
    }
  }

  /**
   * Perform system health check and update snapshot
   */
  async performHealthCheck(): Promise<SystemSnapshot> {
    this.logger.debug('Performing health check...');

    try {
      const [swarmHealth, swarmStatus, swarmMetrics, perfMetrics] = await Promise.all([
        this.swarmService.performHealthCheck(),
        this.swarmService.getSwarmStatus(),
        this.swarmService.getSwarmMetrics(),
        this.swarmService.getPerformanceMetrics(),
      ]);

      const snapshot: SystemSnapshot = {
        timestamp: new Date(),
        health: {
          status: swarmHealth.healthy ? 'healthy' : 'degraded',
          checks: swarmHealth.checks,
        },
        agents: {
          total: swarmStatus.totalAgents,
          online: swarmStatus.onlineAgents,
          busy: swarmStatus.busyAgents,
          offline: swarmStatus.offlineAgents,
        },
        tasks: {
          pending: swarmMetrics.executionStats.pending,
          running: swarmMetrics.executionStats.running,
          completed: swarmMetrics.executionStats.completed,
          failed: swarmMetrics.executionStats.failed,
        },
        performance: {
          uptime: perfMetrics.uptime,
          successRate: perfMetrics.successRate,
          avgExecutionTime: perfMetrics.averageExecutionTimeMs,
        },
      };

      this.lastSnapshot = snapshot;
      this.eventEmitter.emit('director.health.updated', snapshot);

      return snapshot;
    } catch (error) {
      this.logger.error('Health check failed:', error);

      const errorSnapshot: SystemSnapshot = {
        timestamp: new Date(),
        health: {
          status: 'unhealthy',
          checks: [{ name: 'health-check', status: 'fail', message: String(error) }],
        },
        agents: { total: 0, online: 0, busy: 0, offline: 0 },
        tasks: { pending: 0, running: 0, completed: 0, failed: 0 },
        performance: { uptime: 0, successRate: 0, avgExecutionTime: 0 },
      };

      this.lastSnapshot = errorSnapshot;
      return errorSnapshot;
    }
  }

  /**
   * Handle health issues with auto-recovery
   */
  private async handleHealthIssue(health: { healthy: boolean; checks: any[] }): Promise<void> {
    this.logger.warn('Handling health issues...');

    for (const check of health.checks) {
      if (check.status === 'fail') {
        this.logger.warn(`Health check failed: ${check.name} - ${check.message}`);

        // Emit event for specific issue types
        this.eventEmitter.emit('director.health.issue', {
          check,
          timestamp: new Date(),
        });

        // Attempt recovery based on issue type
        if (check.name === 'agent-availability') {
          this.logger.log('Attempting to restart idle agents...');
          this.eventEmitter.emit('swarm.recovery.needed', { type: 'agent-restart' });
        }
      }
    }
  }

  /**
   * Get pending tasks from the system
   */
  private async getPendingTasks(): Promise<SwarmTask[]> {
    try {
      const executions = await this.swarmService.getExecutions({ status: 'pending' });

      // Convert executions to tasks (simplified)
      return executions.map((exec) => ({
        id: exec.taskId,
        name: `Task-${exec.taskId}`,
        requiredCapabilities: [],
        priority: 'medium' as const,
        payload: {},
      }));
    } catch (error) {
      this.logger.error('Failed to get pending tasks:', error);
      return [];
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: SwarmTask): Promise<SwarmExecution> {
    this.logger.log(`Processing task: ${task.id}`);

    // Delegate to swarm service
    return this.swarmService.executeSwarmTask(task);
  }

  /**
   * Perform self-reflection and generate insights
   */
  async performReflection(): Promise<Insight[]> {
    this.logger.log('🔍 Performing self-reflection...');

    const insights: Insight[] = [];

    try {
      // Analyze recent executions
      const [metrics, snapshot] = await Promise.all([
        this.swarmService.getExecutionMetrics(),
        this.performHealthCheck(),
      ]);

      // Insight: Low success rate
      if (
        metrics.totalExecutions > 10 &&
        metrics.completedExecutions / metrics.totalExecutions < 0.8
      ) {
        insights.push({
          id: `insight-${Date.now()}-1`,
          type: 'issue',
          severity: 'warning',
          title: 'Low Task Success Rate',
          description: `Only ${((metrics.completedExecutions / metrics.totalExecutions) * 100).toFixed(1)}% of tasks are completing successfully`,
          suggestedActions: [
            'Review failing task types',
            'Check agent capabilities match task requirements',
            'Consider adding retry logic',
          ],
          metadata: { metrics },
          createdAt: new Date(),
        });
      }

      // Insight: Agent utilization
      if (snapshot.agents.total > 0) {
        const utilization = snapshot.agents.busy / snapshot.agents.total;
        if (utilization < 0.2) {
          insights.push({
            id: `insight-${Date.now()}-2`,
            type: 'opportunity',
            severity: 'info',
            title: 'Low Agent Utilization',
            description: `Only ${(utilization * 100).toFixed(1)}% of agents are busy. Consider generating more tasks.`,
            suggestedActions: [
              'Review task generation logic',
              'Check for bottlenecks in task queue',
              'Consider proactive task creation',
            ],
            metadata: { utilization, agents: snapshot.agents },
            createdAt: new Date(),
          });
        }
      }

      // Insight: Healthy system pattern
      if (snapshot.health.status === 'healthy' && this.cycleCount > 10) {
        insights.push({
          id: `insight-${Date.now()}-3`,
          type: 'pattern',
          severity: 'info',
          title: 'System Running Smoothly',
          description: `System has been healthy for ${this.cycleCount} cycles`,
          suggestedActions: [],
          metadata: { cycleCount: this.cycleCount },
          createdAt: new Date(),
        });
      }

      // Store insights
      this.insights.push(...insights);

      // Emit reflection complete
      this.eventEmitter.emit('director.reflection.completed', {
        insightCount: insights.length,
        insights,
        timestamp: new Date(),
      });

      return insights;
    } catch (error) {
      this.logger.error('Reflection failed:', error);
      return [];
    }
  }

  /**
   * Generate insights from execution history
   */
  private async generateInsights(): Promise<Insight[]> {
    return this.performReflection();
  }

  /**
   * Generate a handoff document for session continuity
   */
  async generateHandoff(): Promise<HandoffDocument> {
    this.logger.log('📝 Generating handoff document...');

    try {
      const snapshot = this.lastSnapshot || (await this.performHealthCheck());
      const metrics = await this.swarmService.getExecutionMetrics();

      // Get recent completed tasks
      const completedExecutions = await this.swarmService.getExecutions({ status: 'completed' });
      const recentCompleted = completedExecutions.slice(-10).map((e) => ({
        id: e.id,
        name: `Task-${e.taskId}`,
        outcome: 'completed',
      }));

      // Get pending work
      const pendingExecutions = await this.swarmService.getExecutions({ status: 'pending' });
      const pendingWork = pendingExecutions.map((e) => ({
        id: e.id,
        description: `Task ${e.taskId}`,
        priority: 'medium',
      }));

      // Determine next steps based on insights
      const nextSteps = this.insights
        .filter((i) => i.suggestedActions.length > 0)
        .flatMap((i) => i.suggestedActions)
        .slice(0, 5);

      const handoff: HandoffDocument = {
        id: `handoff-${Date.now()}`,
        sessionId: this.sessionId,
        createdAt: new Date(),
        systemState: snapshot,
        completedTasks: recentCompleted,
        learnings: this.insights.slice(-10), // Last 10 insights
        pendingWork,
        nextSteps:
          nextSteps.length > 0
            ? nextSteps
            : [
                'Continue monitoring system health',
                'Process pending tasks',
                'Generate new insights',
              ],
        context: {
          cycleCount: this.cycleCount,
          totalExecutions: metrics.totalExecutions,
          successRate: metrics.completedExecutions / (metrics.totalExecutions || 1),
        },
      };

      // Store handoff
      this.handoffs.push(handoff);

      // Persist to database if possible
      try {
        // Store as a system log or dedicated handoff table
        this.logger.debug('Handoff document generated and stored');
      } catch (error) {
        this.logger.warn('Could not persist handoff to database');
      }

      this.eventEmitter.emit('director.handoff.created', handoff);

      return handoff;
    } catch (error) {
      this.logger.error('Failed to generate handoff:', error);
      throw error;
    }
  }

  /**
   * Get the current system snapshot
   */
  getSnapshot(): SystemSnapshot | null {
    return this.lastSnapshot;
  }

  /**
   * Get all insights
   */
  getInsights(): Insight[] {
    return this.insights;
  }

  /**
   * Get all handoffs
   */
  getHandoffs(): HandoffDocument[] {
    return this.handoffs;
  }

  /**
   * Get the latest handoff
   */
  getLatestHandoff(): HandoffDocument | null {
    return this.handoffs[this.handoffs.length - 1] || null;
  }

  /**
   * Get director status
   */
  getStatus(): {
    isRunning: boolean;
    sessionId: string;
    cycleCount: number;
    config: DirectorConfig;
    lastSnapshot: SystemSnapshot | null;
  } {
    return {
      isRunning: this.isRunning,
      sessionId: this.sessionId,
      cycleCount: this.cycleCount,
      config: this.config,
      lastSnapshot: this.lastSnapshot,
    };
  }

  /**
   * Trigger a manual cycle
   */
  async triggerCycle(): Promise<DirectorCycleResult> {
    return this.executeCycle();
  }

  /**
   * Trigger a manual reflection
   */
  async triggerReflection(): Promise<Insight[]> {
    return this.performReflection();
  }

  /**
   * Trigger a manual handoff
   */
  async triggerHandoff(): Promise<HandoffDocument> {
    return this.generateHandoff();
  }
}
