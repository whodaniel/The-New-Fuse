/**
 * Prompt Handoff Flywheel System
 *
 * Implements a seamless prompt handoff system that maintains context and execution state
 * as prompts move between agents, integrating with existing template and orchestration systems.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { EventEmitter } from 'events';
import { ConflictManager } from '../services/ConflictManager';
import { MasterClockService } from '../services/MasterClockService';
import { SyncOrchestrator } from '../services/SyncOrchestrator';

export interface HandoffContext {
  id: string;
  sessionId: string;
  sourceAgentId: string;
  targetAgentId?: string;
  templateId: string;
  templateVersion: string;
  executionHistory: HandoffExecution[];
  variables: Record<string, any>;
  metadata: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
}

export interface HandoffExecution {
  id: string;
  agentId: string;
  startTime: Date;
  endTime?: Date;
  input: any;
  output?: any;
  error?: string;
  metrics: {
    processingTime: number;
    tokenUsage?: number;
    memoryUsage?: number;
  };
  contextPreservation: number; // 0-100 percentage
}

export interface HandoffTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  content: string;
  variables: Record<string, any>;
  contextRequirements: string[];
  agentCapabilities: string[];
  successCriteria: string[];
  backpressureThreshold: number;
  loadBalancingWeight: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HandoffQueue {
  id: string;
  name: string;
  agentCapability: string;
  maxSize: number;
  currentSize: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  backpressureEnabled: boolean;
  loadBalancingEnabled: boolean;
  contexts: HandoffContext[];
  metrics: {
    totalProcessed: number;
    averageProcessingTime: number;
    successRate: number;
    backpressureEvents: number;
  };
}

export interface AgentCapability {
  agentId: string;
  capabilities: string[];
  currentLoad: number;
  maxLoad: number;
  averageProcessingTime: number;
  successRate: number;
  lastSeen: Date;
  status: 'available' | 'busy' | 'offline' | 'error';
}

export class PromptHandoffFlywheel extends EventEmitter {
  private handoffContexts = new Map<string, HandoffContext>();
  private handoffTemplates = new Map<string, HandoffTemplate>();
  private handoffQueues = new Map<string, HandoffQueue>();
  private agentCapabilities = new Map<string, AgentCapability>();
  private activeHandoffs = new Map<string, HandoffContext>();

  constructor(
    private syncOrchestrator: SyncOrchestrator,
    private masterClock: MasterClockService,
    private conflictManager: ConflictManager
  ) {
    super();
    this.initializeDefaultTemplates();
    this.setupBackpressureMonitoring();
    this.setupLoadBalancing();
  }

  /**
   * Requirement 4.1: Complete execution context and history preservation
   */
  async initiateHandoff(
    sourceAgentId: string,
    templateId: string,
    variables: Record<string, any>,
    options: {
      targetAgentId?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      timeout?: number;
      maxRetries?: number;
      sessionId?: string;
    } = {}
  ): Promise<string> {
    const contextId = this.generateId();
    const now = await this.masterClock.now();

    const template = this.handoffTemplates.get(templateId);
    if (!template) {
      throw new Error(`Handoff template not found: ${templateId}`);
    }

    const context: HandoffContext = {
      id: contextId,
      sessionId: options.sessionId || this.generateSessionId(),
      sourceAgentId,
      targetAgentId: options.targetAgentId,
      templateId,
      templateVersion: template.version,
      executionHistory: [],
      variables: { ...template.variables, ...variables },
      metadata: {
        initiatedBy: sourceAgentId,
        templateName: template.name,
        contextRequirements: template.contextRequirements,
      },
      priority: options.priority || 'normal',
      timeout: options.timeout || 300000, // 5 minutes default
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      createdAt: now,
      updatedAt: now,
      status: 'pending',
    };

    this.handoffContexts.set(contextId, context);

    // Sync context across all instances
    await this.syncOrchestrator.syncGlobalData('handoff_context', {
      action: 'create',
      context,
    });

    this.emit('handoffInitiated', context);

    // Start handoff processing
    await this.processHandoff(context);

    return contextId;
  }

  /**
   * Requirement 4.2: Latest template versions with automatic updates
   */
  async updateHandoffTemplate(
    templateId: string,
    updates: Partial<HandoffTemplate>
  ): Promise<void> {
    const template = this.handoffTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const updatedTemplate: HandoffTemplate = {
      ...template,
      ...updates,
      version: this.incrementVersion(template.version),
      updatedAt: await this.masterClock.now(),
    };

    this.handoffTemplates.set(templateId, updatedTemplate);

    // Sync template update across all instances
    await this.syncOrchestrator.syncGlobalData('handoff_template', {
      action: 'update',
      template: updatedTemplate,
    });

    // Update all active handoffs using this template
    for (const context of this.activeHandoffs.values()) {
      if (context.templateId === templateId) {
        context.templateVersion = updatedTemplate.version;
        await this.syncOrchestrator.syncGlobalData('handoff_context', {
          action: 'update',
          context,
        });
      }
    }

    this.emit('templateUpdated', updatedTemplate);
  }

  /**
   * Requirement 4.3: Backpressure and load balancing
   */
  private async processHandoff(context: HandoffContext): Promise<void> {
    try {
      context.status = 'in_progress';
      this.activeHandoffs.set(context.id, context);

      // Select target agent if not specified
      if (!context.targetAgentId) {
        const template = this.handoffTemplates.get(context.templateId)!;
        context.targetAgentId = await this.selectOptimalAgent(
          template.agentCapabilities,
          context.priority
        );
      }

      if (!context.targetAgentId) {
        throw new Error('No available agents for handoff');
      }

      // Check backpressure
      const queue = await this.getOrCreateQueue(context.targetAgentId);
      if (await this.shouldApplyBackpressure(queue, context)) {
        await this.handleBackpressure(context, queue);
        return;
      }

      // Add to queue
      queue.contexts.push(context);
      queue.currentSize++;

      // Execute handoff
      await this.executeHandoff(context);
    } catch (error) {
      await this.handleHandoffFailure(context, error);
    }
  }

  /**
   * Requirement 4.4: Exponential backoff and escalation
   */
  private async handleHandoffFailure(context: HandoffContext, error: any): Promise<void> {
    context.retryCount++;

    if (context.retryCount <= context.maxRetries) {
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, context.retryCount), 30000);

      this.emit('handoffRetry', context, error, delay);

      setTimeout(async () => {
        await this.processHandoff(context);
      }, delay);
    } else {
      // Escalate to human intervention
      context.status = 'failed';
      context.updatedAt = await this.masterClock.now();

      await this.syncOrchestrator.syncGlobalData('handoff_context', {
        action: 'failed',
        context,
        error: error.message,
      });

      this.emit('handoffEscalated', context, error);
      this.activeHandoffs.delete(context.id);
    }
  }

  /**
   * Requirement 4.5: Unified analytics and metrics
   */
  private async executeHandoff(context: HandoffContext): Promise<void> {
    const startTime = await this.masterClock.now();
    const template = this.handoffTemplates.get(context.templateId)!;

    try {
      // Compile template with current context
      const compiledPrompt = await this.compileHandoffTemplate(template, context);

      // Create execution record
      const execution: HandoffExecution = {
        id: this.generateId(),
        agentId: context.targetAgentId!,
        startTime,
        input: {
          prompt: compiledPrompt,
          context: context.variables,
          metadata: context.metadata,
        },
        metrics: {
          processingTime: 0,
          tokenUsage: 0,
          memoryUsage: 0,
        },
        contextPreservation: 100, // Will be calculated based on output
      };

      // Send to target agent via sync orchestrator
      const result = await this.syncOrchestrator.syncAgentState(context.targetAgentId!, {
        type: 'handoff_execution',
        contextId: context.id,
        execution,
        template: compiledPrompt,
      });

      // Record completion
      execution.endTime = await this.masterClock.now();
      execution.output = result;
      execution.metrics.processingTime =
        execution.endTime.getTime() - execution.startTime.getTime();

      // Calculate context preservation score
      execution.contextPreservation = await this.calculateContextPreservation(context, execution);

      context.executionHistory.push(execution);
      context.status = 'completed';
      context.updatedAt = execution.endTime;

      // Update metrics
      await this.updateHandoffMetrics(context, execution);

      // Sync completion
      await this.syncOrchestrator.syncGlobalData('handoff_context', {
        action: 'complete',
        context,
      });

      this.emit('handoffCompleted', context, execution);
      this.activeHandoffs.delete(context.id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load balancing implementation
   */
  private async selectOptimalAgent(
    requiredCapabilities: string[],
    priority: string
  ): Promise<string | null> {
    const availableAgents = Array.from(this.agentCapabilities.values()).filter(
      (agent) =>
        agent.status === 'available' &&
        requiredCapabilities.every((cap) => agent.capabilities.includes(cap)) &&
        agent.currentLoad < agent.maxLoad
    );

    if (availableAgents.length === 0) {
      return null;
    }

    // Sort by load and success rate
    availableAgents.sort((a, b) => {
      const aScore = (1 - a.currentLoad / a.maxLoad) * a.successRate;
      const bScore = (1 - b.currentLoad / b.maxLoad) * b.successRate;
      return bScore - aScore;
    });

    return availableAgents[0].agentId;
  }

  /**
   * Backpressure management
   */
  private async shouldApplyBackpressure(
    queue: HandoffQueue,
    context: HandoffContext
  ): Promise<boolean> {
    if (!queue.backpressureEnabled) {
      return false;
    }

    const template = this.handoffTemplates.get(context.templateId)!;
    return queue.currentSize >= template.backpressureThreshold;
  }

  private async handleBackpressure(context: HandoffContext, queue: HandoffQueue): Promise<void> {
    queue.metrics.backpressureEvents++;

    // Try to find alternative agent
    const template = this.handoffTemplates.get(context.templateId)!;
    const alternativeAgent = await this.selectOptimalAgent(
      template.agentCapabilities,
      context.priority
    );

    if (alternativeAgent && alternativeAgent !== context.targetAgentId) {
      context.targetAgentId = alternativeAgent;
      await this.processHandoff(context);
    } else {
      // Queue with delay
      const delay = Math.min(5000 * queue.currentSize, 30000);
      setTimeout(async () => {
        await this.processHandoff(context);
      }, delay);
    }

    this.emit('backpressureApplied', context, queue);
  }

  /**
   * Template compilation with context preservation
   */
  private async compileHandoffTemplate(
    template: HandoffTemplate,
    context: HandoffContext
  ): Promise<string> {
    let compiled = template.content;

    // Replace variables
    Object.entries(context.variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      compiled = compiled.replace(regex, String(value));
    });

    // Add execution history context
    if (context.executionHistory.length > 0) {
      const historyContext = context.executionHistory
        .map((exec) => `Previous execution by ${exec.agentId}: ${exec.output}`)
        .join('\n\n');

      compiled = compiled.replace('{{execution_history}}', historyContext);
    }

    // Add metadata context
    const metadataContext = Object.entries(context.metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    compiled = compiled.replace('{{metadata_context}}', metadataContext);

    return compiled;
  }

  /**
   * Context preservation calculation
   */
  private async calculateContextPreservation(
    context: HandoffContext,
    execution: HandoffExecution
  ): Promise<number> {
    // Simple implementation - can be enhanced with ML models
    let score = 100;

    // Check if required context elements are preserved
    const template = this.handoffTemplates.get(context.templateId)!;
    for (const requirement of template.contextRequirements) {
      if (!execution.output || !execution.output.includes(requirement)) {
        score -= 10;
      }
    }

    // Check execution history continuity
    if (context.executionHistory.length > 1) {
      const previousExecution = context.executionHistory[context.executionHistory.length - 2];
      if (!execution.output || !execution.output.includes(previousExecution.output)) {
        score -= 15;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Metrics and analytics
   */
  private async updateHandoffMetrics(
    context: HandoffContext,
    execution: HandoffExecution
  ): Promise<void> {
    // Update agent metrics
    const agent = this.agentCapabilities.get(context.targetAgentId!);
    if (agent) {
      agent.averageProcessingTime =
        (agent.averageProcessingTime + execution.metrics.processingTime) / 2;

      // Update success rate (simple moving average)
      const success = execution.error ? 0 : 1;
      agent.successRate = agent.successRate * 0.9 + success * 0.1;
    }

    // Update queue metrics
    const queue = this.handoffQueues.get(context.targetAgentId!);
    if (queue) {
      queue.metrics.totalProcessed++;
      queue.metrics.averageProcessingTime =
        (queue.metrics.averageProcessingTime + execution.metrics.processingTime) / 2;

      const success = execution.error ? 0 : 1;
      queue.metrics.successRate = queue.metrics.successRate * 0.9 + success * 0.1;

      queue.currentSize--;
    }

    // Sync metrics across instances
    await this.syncOrchestrator.syncGlobalData('handoff_metrics', {
      contextId: context.id,
      execution,
      agentMetrics: agent,
      queueMetrics: queue?.metrics,
    });
  }

  /**
   * Queue management
   */
  private async getOrCreateQueue(agentId: string): Promise<HandoffQueue> {
    let queue = this.handoffQueues.get(agentId);

    if (!queue) {
      queue = {
        id: this.generateId(),
        name: `Queue-${agentId}`,
        agentCapability: agentId,
        maxSize: 100,
        currentSize: 0,
        priority: 'normal',
        backpressureEnabled: true,
        loadBalancingEnabled: true,
        contexts: [],
        metrics: {
          totalProcessed: 0,
          averageProcessingTime: 0,
          successRate: 100,
          backpressureEvents: 0,
        },
      };

      this.handoffQueues.set(agentId, queue);
    }

    return queue;
  }

  /**
   * Setup monitoring and optimization
   */
  private setupBackpressureMonitoring(): void {
    setInterval(async () => {
      for (const queue of this.handoffQueues.values()) {
        if (queue.currentSize > queue.maxSize * 0.8) {
          this.emit('queueCongestion', queue);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  private setupLoadBalancing(): void {
    setInterval(async () => {
      await this.rebalanceQueues();
    }, 30000); // Rebalance every 30 seconds
  }

  private async rebalanceQueues(): Promise<void> {
    const overloadedQueues = Array.from(this.handoffQueues.values()).filter(
      (q) => q.currentSize > q.maxSize * 0.7
    );

    const underloadedQueues = Array.from(this.handoffQueues.values()).filter(
      (q) => q.currentSize < q.maxSize * 0.3
    );

    for (const overloaded of overloadedQueues) {
      const contexts = overloaded.contexts.splice(0, 5); // Move 5 contexts

      for (const context of contexts) {
        const template = this.handoffTemplates.get(context.templateId)!;
        const newAgent = await this.selectOptimalAgent(
          template.agentCapabilities,
          context.priority
        );

        if (newAgent && newAgent !== context.targetAgentId) {
          context.targetAgentId = newAgent;
          await this.processHandoff(context);
        }
      }
    }
  }

  /**
   * Default templates initialization
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplate: HandoffTemplate = {
      id: 'default-handoff',
      name: 'Default Handoff Template',
      description: 'Standard template for agent-to-agent handoffs',
      version: '1.0.0',
      content: `# Agent Handoff Context

## Previous Context
{{execution_history}}

## Current Task
{{task_description}}

## Required Capabilities
{{required_capabilities}}

## Success Criteria
{{success_criteria}}

## Metadata
{{metadata_context}}

Please continue the task with full context preservation.`,
      variables: {
        task_description: 'Continue the current task',
        required_capabilities: 'General assistance',
        success_criteria: 'Task completion with context preservation',
      },
      contextRequirements: ['task_description', 'execution_history'],
      agentCapabilities: ['general'],
      successCriteria: ['context_preserved', 'task_continued'],
      backpressureThreshold: 10,
      loadBalancingWeight: 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.handoffTemplates.set(defaultTemplate.id, defaultTemplate);
  }

  /**
   * Utility methods
   */
  private generateId(): string {
    return `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  /**
   * Public API methods
   */
  async getHandoffContext(contextId: string): Promise<HandoffContext | null> {
    return this.handoffContexts.get(contextId) || null;
  }

  async getHandoffTemplate(templateId: string): Promise<HandoffTemplate | null> {
    return this.handoffTemplates.get(templateId) || null;
  }

  async getQueueStatus(agentId: string): Promise<HandoffQueue | null> {
    return this.handoffQueues.get(agentId) || null;
  }

  async registerAgent(agentId: string, capabilities: string[]): Promise<void> {
    const capability: AgentCapability = {
      agentId,
      capabilities,
      currentLoad: 0,
      maxLoad: 100,
      averageProcessingTime: 0,
      successRate: 100,
      lastSeen: await this.masterClock.now(),
      status: 'available',
    };

    this.agentCapabilities.set(agentId, capability);

    await this.syncOrchestrator.syncGlobalData('agent_capability', {
      action: 'register',
      capability,
    });

    this.emit('agentRegistered', capability);
  }

  async updateAgentStatus(
    agentId: string,
    status: 'available' | 'busy' | 'offline' | 'error',
    load?: number
  ): Promise<void> {
    const capability = this.agentCapabilities.get(agentId);
    if (capability) {
      capability.status = status;
      capability.lastSeen = await this.masterClock.now();
      if (load !== undefined) {
        capability.currentLoad = load;
      }

      await this.syncOrchestrator.syncGlobalData('agent_capability', {
        action: 'update',
        capability,
      });

      this.emit('agentStatusUpdated', capability);
    }
  }
}
