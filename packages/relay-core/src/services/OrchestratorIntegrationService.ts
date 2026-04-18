/**
 * Orchestrator Integration Service
 *
 * Integrates all orchestration components:
 * - Handoff template system
 * - Heartbeat monitoring
 * - Cleanup service
 * - Agent swarm coordination
 * - State preservation with Redis, NestJS, RAG, and Graph systems
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { CleanupService } from './CleanupService';
import { HeartbeatMonitoringService } from './HeartbeatMonitoringService';
import { AgentHandoffTemplateService } from './shared/StubServices';
import { StallDetector } from './stall-detector';

export interface OrchestratorConfig {
  workspaceRoot: string;
  enableHeartbeatMonitoring: boolean;
  enableCleanup: boolean;
  enableStatePreservation: boolean;
  redis: {
    host: string;
    port: number;
    database: number;
  };
  heartbeat: {
    intervalMs: number;
    timeoutMs: number;
    maxRetries: number;
    escalationDelay: number;
    stagnationThresholdMs: number;
  };
  stall: {
    stallThresholdMs: number;
    checkIntervalMs: number;
    maxRecoveryAttempts: number;
    autoRecover: boolean;
  };
  cleanup: {
    backupDirectory: string;
    dryRun: boolean;
    createBackups: boolean;
  };
}

export interface TaskState {
  taskId: string;
  agentId: string;
  status: 'pending' | 'in_progress' | 'stalled' | 'completed' | 'failed';
  startTime: Date;
  lastUpdate: Date;
  context: Record<string, any>;
  handoffHistory: string[];
  stagnationCount: number;
}

export interface OrchestrationMetrics {
  totalTasks: number;
  activeTasks: number;
  stalledTasks: number;
  completedTasks: number;
  averageTaskDuration: number;
  handoffSuccessRate: number;
  stagnationRate: number;
  cleanupEfficiency: number;
}

export class OrchestratorIntegrationService extends EventEmitter {
  private logger: Logger;
  private config: OrchestratorConfig;
  private cleanupService: CleanupService;
  private heartbeatService: HeartbeatMonitoringService;
  private stallDetector: StallDetector;
  private handoffService: AgentHandoffTemplateService;
  private taskStates: Map<string, TaskState> = new Map();
  private isInitialized: boolean = false;
  private pruneInterval?: NodeJS.Timeout;

  constructor(config: OrchestratorConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;

    // Initialize core services
    this.cleanupService = new CleanupService(config.workspaceRoot, logger);
    this.heartbeatService = new HeartbeatMonitoringService(config.heartbeat, logger);
    this.stallDetector = new StallDetector(logger, config.stall);
    this.handoffService = new AgentHandoffTemplateService();

    this.setupEventHandlers();
  }

  /**
   * Initialize all orchestration services
   */
  async initialize(): Promise<boolean> {
    try {
      this.logger.info('Initializing Orchestrator Integration Service');

      // Initialize cleanup service with relay consolidation targets
      if (this.config.enableCleanup) {
        this.cleanupService.addRelayConsolidationTargets();
        this.logger.info('Cleanup service initialized with relay consolidation targets');
      }

      // Start heartbeat monitoring
      if (this.config.enableHeartbeatMonitoring) {
        this.heartbeatService.start();
        this.logger.info('Heartbeat monitoring service started');
      }

      // Start stall detection
      this.stallDetector.start();
      this.logger.info('Stall detection service started');

      // Start periodic pruning of completed/failed tasks
      this.pruneInterval = setInterval(
        () => {
          this.pruneTaskStates();
        },
        30 * 60 * 1000
      ); // Every 30 minutes

      // Initialize state preservation systems
      if (this.config.enableStatePreservation) {
        await this.initializeStatePreservation();
        this.logger.info('State preservation systems initialized');
      }

      this.isInitialized = true;
      this.emit('orchestrator_initialized');
      this.logger.info('Orchestrator Integration Service fully initialized');

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to initialize orchestrator: ${error instanceof Error ? error.message : String(error)}`
      );
      this.emit('orchestrator_error', error);
      return false;
    }
  }

  /**
   * Shutdown all orchestration services
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Orchestrator Integration Service');

    // Stop heartbeat monitoring
    if (this.config.enableHeartbeatMonitoring) {
      this.heartbeatService.stop();
    }
    // Stop stall detection
    this.stallDetector.stop();

    if (this.pruneInterval) {
      clearInterval(this.pruneInterval);
      this.pruneInterval = undefined;
    }

    // Final cleanup if needed
    if (this.config.enableCleanup) {
      await this.performFinalCleanup();
    }

    this.isInitialized = false;
    this.emit('orchestrator_shutdown');
    this.logger.info('Orchestrator Integration Service shutdown complete');
  }

  /**
   * Prune completed and failed tasks from memory to prevent memory leaks
   * Keeps active tasks and recently completed tasks (last 1 hour)
   */
  public pruneTaskStates(maxAgeMs: number = 60 * 60 * 1000): number {
    const now = Date.now();
    let prunedCount = 0;

    for (const [taskId, state] of this.taskStates.entries()) {
      const isTerminal = state.status === 'completed' || state.status === 'failed';
      const age = now - state.lastUpdate.getTime();

      if (isTerminal && age > maxAgeMs) {
        this.taskStates.delete(taskId);
        prunedCount++;
      }
    }

    if (prunedCount > 0) {
      this.logger.info(
        `🧹 Memory Leak Prevention: Pruned ${prunedCount} terminal tasks from orchestrator state`
      );
    }

    return prunedCount;
  }

  /**
   * Setup event handlers for cross-service communication
   */
  private setupEventHandlers(): void {
    // Heartbeat monitoring events
    this.heartbeatService.on('stagnation_detected', (alert) => {
      this.handleStagnationDetected(alert);
    });

    this.heartbeatService.on('agent_ping_required', (data) => {
      this.handleAgentPingRequired(data);
    });

    this.heartbeatService.on('escalation_required', (data) => {
      this.handleEscalationRequired(data);
    });

    this.heartbeatService.on('human_intervention_required', (data) => {
      this.handleHumanInterventionRequired(data);
    });

    this.heartbeatService.on('task_reassignment_required', (data) => {
      this.handleTaskReassignment(data);
    });

    // Stall detector events
    this.stallDetector.on('conversation:stalled', (event) => {
      this.handleConversationStalled(event);
    });

    this.stallDetector.on('conversation:recovered', (data) => {
      this.logger.info(`Conversation ${data.conversationId} recovered from stall`);
    });

    this.stallDetector.on('recovery:message', (data) => {
      this.emit('broadcast_recovery_message', data);
    });

    // Task state management events
    this.on('task_started', (taskData) => {
      this.recordTaskStart(taskData);
    });

    this.on('task_progress', (taskData) => {
      this.recordTaskProgress(taskData);
    });

    this.on('task_completed', (taskData) => {
      this.recordTaskCompletion(taskData);
    });
  }

  /**
   * Initialize state preservation systems (Redis, NestJS, RAG, Graph)
   */
  private async initializeStatePreservation(): Promise<void> {
    // Redis state preservation
    await this.initializeRedisStatePreservation();

    // Todo/Task management integration
    await this.initializeTodoManagement();

    // RAG system integration for context preservation
    await this.initializeRAGIntegration();

    // Graph database integration for relationship mapping
    await this.initializeGraphIntegration();
  }

  /**
   * Initialize Redis for distributed state management
   */
  private async initializeRedisStatePreservation(): Promise<void> {
    this.logger.info('Initializing Redis state preservation');

    // Redis integration would connect to existing RedisTransport
    this.emit('redis_state_preservation_ready', {
      host: this.config.redis.host,
      port: this.config.redis.port,
      features: ['task_state', 'agent_context', 'handoff_history', 'workflow_state'],
    });
  }

  /**
   * Initialize todo/task management integration
   */
  private async initializeTodoManagement(): Promise<void> {
    this.logger.info('Initializing todo/task management integration');

    // Integration with existing todo systems
    this.emit('todo_management_ready', {
      features: ['task_tracking', 'progress_monitoring', 'state_persistence'],
    });
  }

  /**
   * Initialize RAG integration for context preservation
   */
  private async initializeRAGIntegration(): Promise<void> {
    this.logger.info('Initializing RAG integration for context preservation');

    // RAG system for maintaining conversational context across handoffs
    this.emit('rag_integration_ready', {
      features: ['context_embedding', 'semantic_search', 'handoff_context_retrieval'],
    });
  }

  /**
   * Initialize Graph database integration
   */
  private async initializeGraphIntegration(): Promise<void> {
    this.logger.info('Initializing Graph database integration');

    // Graph database for agent relationship mapping and workflow dependencies
    this.emit('graph_integration_ready', {
      features: ['agent_relationships', 'task_dependencies', 'workflow_graphs'],
    });
  }

  /**
   * Handle conversation stall detection
   */
  private async handleConversationStalled(event: any): Promise<void> {
    this.logger.warn(`Conversation stalled: ${event.conversationId} in channel ${event.channelId}`);

    // Log to task history if applicable
    const taskState = this.taskStates.get(event.conversationId);
    if (taskState) {
      taskState.status = 'stalled';
      taskState.stagnationCount++;
    }

    this.emit('conversation_stall_handled', event);
  }

  /**
   * Record conversation activity
   */
  public recordConversationActivity(
    channelId: string,
    agentId?: string,
    hasContent: boolean = true
  ): void {
    if (this.isInitialized) {
      this.stallDetector.recordActivity(channelId, agentId, hasContent);
    }
  }

  /**
   * Get stall statistics
   */
  public getStallStats() {
    return this.stallDetector.getStats();
  }

  /**
   * Handle stagnation detection
   */
  private async handleStagnationDetected(alert: any): Promise<void> {
    this.logger.warn(`Stagnation detected for agent ${alert.agentId}: ${alert.stagnationType}`);

    // Update task state
    const taskState = this.taskStates.get(alert.taskId);
    if (taskState) {
      taskState.status = 'stalled';
      taskState.stagnationCount++;
      taskState.lastUpdate = new Date();
    }

    // Create anti-stagnation handoff prompt
    const handoffPrompt = await this.createAntiStagnationHandoff(alert);

    this.emit('anti_stagnation_handoff_created', {
      agentId: alert.agentId,
      taskId: alert.taskId,
      handoffPrompt,
      stagnationType: alert.stagnationType,
    });
  }

  /**
   * Handle agent ping requirements
   */
  private async handleAgentPingRequired(data: any): Promise<void> {
    this.logger.info(`Ping required for agent ${data.agentId}`);

    // Generate wake-up prompt using handoff template system
    const wakeUpPrompt = await this.handoffService.createHandoffPrompt('agent-wake-up', {
      agentId: data.agentId,
      taskId: data.taskId,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });

    this.emit('agent_wake_up_prompt_created', {
      agentId: data.agentId,
      prompt: wakeUpPrompt,
    });
  }

  /**
   * Handle escalation requirements
   */
  private async handleEscalationRequired(data: any): Promise<void> {
    this.logger.warn(`Escalation required for agent ${data.originalAgent}`);

    // Create escalation handoff with full context preservation
    const escalationHandoff = await this.handoffService.createHandoffPrompt(
      'master-orchestrator-handoff',
      {
        escalationReason: data.escalationReason,
        originalAgent: data.originalAgent,
        taskId: data.taskId,
        severity: data.severity,
        requiresDirectorIntervention: data.requiresDirectorIntervention,
        preservedContext: await this.getTaskContext(data.taskId),
      }
    );

    this.emit('director_broker_handoff_created', {
      originalAgent: data.originalAgent,
      escalationHandoff,
      priority: 'high',
    });
  }

  /**
   * Handle human intervention requirements
   */
  private async handleHumanInterventionRequired(data: any): Promise<void> {
    this.logger.error(`Human intervention required for agent ${data.agentId}`);

    // Create human notification with comprehensive context
    const humanNotification = {
      agentId: data.agentId,
      alert: data.alert,
      urgency: data.urgency,
      message: data.message,
      recommendedActions: await this.generateHumanActionRecommendations(data.alert),
      taskContext: await this.getTaskContext(data.alert.taskId),
      timestamp: new Date().toISOString(),
    };

    this.emit('human_notification_ready', humanNotification);
  }

  /**
   * Handle task reassignment
   */
  private async handleTaskReassignment(data: any): Promise<void> {
    this.logger.info(`Task reassignment required for ${data.originalAgent}`);

    // Preserve task context and create reassignment handoff
    const taskContext = await this.getTaskContext(data.taskId);
    const reassignmentHandoff = await this.handoffService.createHandoffPrompt('task-reassignment', {
      originalAgent: data.originalAgent,
      taskId: data.taskId,
      reason: data.reassignmentReason,
      preservedContext: taskContext,
      contextPreservationEnabled: data.preserveContext,
    });

    this.emit('task_reassignment_handoff_created', {
      originalAgent: data.originalAgent,
      reassignmentHandoff,
      preservedContext: taskContext,
    });
  }

  /**
   * Create anti-stagnation handoff prompt
   */
  private async createAntiStagnationHandoff(alert: any): Promise<string> {
    const stagnationPromptData = {
      agentId: alert.agentId,
      taskId: alert.taskId,
      stagnationType: alert.stagnationType,
      stagnationDuration: Math.round(alert.duration / 60000), // minutes
      severity: alert.severity,
      detectedAt: alert.detectedAt.toISOString(),
      taskContext: await this.getTaskContext(alert.taskId),
      antiStagnationStrategies: this.getAntiStagnationStrategies(alert.stagnationType),
      fallbackOptions: this.getFallbackOptions(alert.severity),
    };

    return await this.handoffService.createHandoffPrompt(
      'anti-stagnation-recovery',
      stagnationPromptData
    );
  }

  /**
   * Get anti-stagnation strategies based on stagnation type
   */
  private getAntiStagnationStrategies(stagnationType: string): string[] {
    const strategies = {
      no_heartbeat: [
        'Send immediate ping/wake-up message',
        'Verify agent connectivity',
        'Check for system resource constraints',
      ],
      no_progress: [
        'Request detailed progress report',
        'Analyze task complexity',
        'Provide additional context or resources',
        'Break task into smaller subtasks',
      ],
      circular_communication: [
        'Analyze communication loop',
        'Introduce external context',
        'Reset conversation state',
        'Apply task reframing',
      ],
      timeout: [
        'Extend timeout parameters',
        'Simplify task requirements',
        'Provide step-by-step guidance',
        'Consider task reassignment',
      ],
    };

    return (
      strategies[stagnationType as keyof typeof strategies] || ['Apply generic recovery protocol']
    );
  }

  /**
   * Get fallback options based on severity
   */
  private getFallbackOptions(severity: string): string[] {
    const options = {
      warning: ['Retry with modified parameters', 'Provide additional guidance'],
      critical: ['Escalate to supervisor', 'Task reassignment', 'Human consultation'],
      emergency: [
        'Immediate human intervention',
        'Emergency stop protocol',
        'System failsafe activation',
      ],
    };

    return options[severity as keyof typeof options] || ['Standard recovery protocol'];
  }

  /**
   * Record task start
   */
  private recordTaskStart(taskData: any): void {
    const taskState: TaskState = {
      taskId: taskData.taskId,
      agentId: taskData.agentId,
      status: 'in_progress',
      startTime: new Date(),
      lastUpdate: new Date(),
      context: taskData.context || {},
      handoffHistory: [],
      stagnationCount: 0,
    };

    this.taskStates.set(taskData.taskId, taskState);
    this.heartbeatService.registerAgent(taskData.agentId, taskData.expectedDuration);
  }

  /**
   * Record task progress
   */
  private recordTaskProgress(taskData: any): void {
    const taskState = this.taskStates.get(taskData.taskId);
    if (taskState) {
      taskState.lastUpdate = new Date();
      taskState.context = { ...taskState.context, ...taskData.progress };

      // Record activity in heartbeat service
      this.heartbeatService.recordActivity(taskState.agentId, 'task_progress', taskData.progress);
    }
  }

  /**
   * Record task completion
   */
  private recordTaskCompletion(taskData: any): void {
    const taskState = this.taskStates.get(taskData.taskId);
    if (taskState) {
      taskState.status = 'completed';
      taskState.lastUpdate = new Date();

      // Record final activity
      this.heartbeatService.recordActivity(taskState.agentId, 'task_completed', taskData.result);
    }
  }

  /**
   * Get task context for handoff preservation
   */
  private async getTaskContext(taskId: string): Promise<Record<string, any>> {
    const taskState = this.taskStates.get(taskId);
    if (!taskState) return {};

    return {
      taskId,
      agentId: taskState.agentId,
      status: taskState.status,
      startTime: taskState.startTime.toISOString(),
      lastUpdate: taskState.lastUpdate.toISOString(),
      duration: Date.now() - taskState.startTime.getTime(),
      context: taskState.context,
      handoffHistory: taskState.handoffHistory,
      stagnationCount: taskState.stagnationCount,
    };
  }

  /**
   * Generate human action recommendations
   */
  private async generateHumanActionRecommendations(alert: any): Promise<string[]> {
    const recommendations = [
      `Review agent ${alert.agentId} current state and logs`,
      `Analyze task ${alert.taskId} requirements and complexity`,
      `Consider manual intervention or task simplification`,
      `Evaluate system resources and agent capabilities`,
    ];

    if (alert.severity === 'emergency') {
      recommendations.unshift('Immediate system review required');
      recommendations.push('Consider emergency protocol activation');
    }

    return recommendations;
  }

  /**
   * Perform final cleanup
   */
  private async performFinalCleanup(): Promise<void> {
    this.logger.info('Performing final orchestrator cleanup');

    const cleanupResult = await this.cleanupService.executeCleanup({
      dryRun: this.config.cleanup.dryRun,
      createBackups: this.config.cleanup.createBackups,
      backupDirectory: this.config.cleanup.backupDirectory,
      confirmationRequired: false,
    });

    this.logger.info(
      `Final cleanup completed: ${cleanupResult.cleaned.length} files cleaned, ${cleanupResult.errors.length} errors`
    );
  }

  /**
   * Get comprehensive orchestration metrics
   */
  getOrchestrationMetrics(): OrchestrationMetrics {
    const tasks = Array.from(this.taskStates.values());
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const stalledTasks = tasks.filter((t) => t.status === 'stalled');

    const avgDuration =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + (Date.now() - t.startTime.getTime()), 0) /
          completedTasks.length
        : 0;

    return {
      totalTasks: tasks.length,
      activeTasks: tasks.filter((t) => t.status === 'in_progress').length,
      stalledTasks: stalledTasks.length,
      completedTasks: completedTasks.length,
      averageTaskDuration: avgDuration,
      handoffSuccessRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      stagnationRate: tasks.length > 0 ? (stalledTasks.length / tasks.length) * 100 : 0,
      cleanupEfficiency: this.cleanupService.getCleanupSummary().totalTargets,
    };
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    initialized: boolean;
    heartbeatMonitoring: any;
    cleanup: any;
    taskStates: number;
    metrics: OrchestrationMetrics;
  } {
    return {
      initialized: this.isInitialized,
      heartbeatMonitoring: this.heartbeatService.getMonitoringStatus(),
      cleanup: this.cleanupService.getCleanupSummary(),
      taskStates: this.taskStates.size,
      metrics: this.getOrchestrationMetrics(),
    };
  }
}
