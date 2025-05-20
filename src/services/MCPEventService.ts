import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.js';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { AnalyticsIntegrationService } from './AnalyticsIntegrationService.js';
import { MCPErrorHandlingService } from './MCPErrorHandlingService.js';
import { Logger } from '../common/logger.service.js';

export interface MCPEvent {
  type: string;
  source: string;
  timestamp: number;
  payload: any;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MCPEventService implements OnModuleInit {
  private readonly eventHandlers: Map<string, Set<(event: MCPEvent) => Promise<void>>> = new Map();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly mcpBroker: MCPBrokerService,
    private readonly workflowMonitor: WorkflowMonitoringService,
    private readonly analytics: AnalyticsIntegrationService,
    private readonly errorHandler: MCPErrorHandlingService,
    private readonly logger: Logger
  ) {}

  async onModuleInit(): Promise<void> {
    this.registerSystemEventHandlers();
    await this.initializeEventListeners();
  }

  private registerSystemEventHandlers(): void {
    // Workflow events
    this.on('workflow.started', this.handleWorkflowStart.bind(this));
    this.on('workflow.completed', this.handleWorkflowComplete.bind(this));
    this.on('workflow.failed', this.handleWorkflowFailure.bind(this));

    // Task events
    this.on('task.started', this.handleTaskStart.bind(this));
    this.on('task.completed', this.handleTaskComplete.bind(this));
    this.on('task.failed', this.handleTaskFailure.bind(this));

    // Agent events
    this.on('agent.registered', this.handleAgentRegistration.bind(this));
    this.on('agent.capability.added', this.handleCapabilityUpdate.bind(this));
    this.on('agent.status.changed', this.handleAgentStatusChange.bind(this));

    // Error events
    this.on('error.*', this.handleSystemError.bind(this));
  }

  private async initializeEventListeners(): Promise<void> {
    try {
      await this.mcpBroker.executeDirective('events', 'subscribe', {
        patterns: [
          'workflow.*',
          'task.*',
          'agent.*',
          'error.*'
        ],
        callback: (event: MCPEvent) => this.processEvent(event)
      });
    } catch (error) {
      this.logger.error('Failed to initialize event listeners:', error);
      throw error;
    }
  }

  async emit(eventType: string, payload: any, metadata?: Record<string, unknown>): Promise<void> {
    const event: MCPEvent = {
      type: eventType,
      source: 'mcp-event-service',
      timestamp: Date.now(),
      payload,
      metadata
    };

    try {
      await this.processEvent(event);
      await this.mcpBroker.executeDirective('events', 'publish', { event });
    } catch (error) {
      this.logger.error(`Error emitting event ${eventType}:`, error);
      throw error;
    }
  }

  on(eventPattern: string, handler: (event: MCPEvent) => Promise<void>): void {
    if (!this.eventHandlers.has(eventPattern)) {
      this.eventHandlers.set(eventPattern, new Set());
    }
    this.eventHandlers.get(eventPattern)?.add(handler);
  }

  off(eventPattern: string, handler: (event: MCPEvent) => Promise<void>): void {
    this.eventHandlers.get(eventPattern)?.delete(handler);
  }

  private async processEvent(event: MCPEvent): Promise<void> {
    try {
      const handlers = this.findMatchingHandlers(event.type);
      await Promise.all(
        Array.from(handlers).map(handler => 
          handler(event).catch(error => 
            this.handleEventProcessingError(error, event)
          )
        )
      );
    } catch (error) {
      await this.handleEventProcessingError(error, event);
    }
  }

  private findMatchingHandlers(eventType: string): Set<(event: MCPEvent) => Promise<void>> {
    const handlers = new Set<(event: MCPEvent) => Promise<void>>();
    
    this.eventHandlers.forEach((eventHandlers, pattern) => {
      if (this.matchesPattern(eventType, pattern)) {
        eventHandlers.forEach(handler => handlers.add(handler));
      }
    });

    return handlers;
  }

  private matchesPattern(eventType: string, pattern: string): boolean {
    const patternParts = pattern.split('.');
    const eventParts = eventType.split('.');

    if (patternParts.length !== eventParts.length && patternParts[patternParts.length - 1] !== '*') {
      return false;
    }

    return patternParts.every((part, index) => 
      part === '*' || part === eventParts[index]
    );
  }

  private async handleEventProcessingError(error: Error, event: MCPEvent): Promise<void> {
    await this.errorHandler.handleWorkflowError({
      error,
      timestamp: Date.now(),
      context: {
        eventType: event.type,
        eventPayload: event.payload
      }
    });
  }

  // Event handlers
  private async handleWorkflowStart(event: MCPEvent): Promise<void> {
    const { workflowId } = event.payload;
    await this.workflowMonitor.trackWorkflowExecution(workflowId, {
      type: 'STARTED',
      timestamp: event.timestamp
    });
  }

  private async handleWorkflowComplete(event: MCPEvent): Promise<void> {
    const { workflowId } = event.payload;
    await Promise.all([
      this.workflowMonitor.trackWorkflowExecution(workflowId, {
        type: 'COMPLETED',
        timestamp: event.timestamp
      }),
      this.analytics.trackWorkflowPerformance(workflowId)
    ]);
  }

  private async handleWorkflowFailure(event: MCPEvent): Promise<void> {
    const { workflowId, error } = event.payload;
    await this.errorHandler.handleWorkflowError({
      workflowId,
      error,
      timestamp: event.timestamp
    });
  }

  private async handleTaskStart(event: MCPEvent): Promise<void> {
    const { workflowId, taskId } = event.payload;
    await this.workflowMonitor.trackWorkflowExecution(workflowId, {
      type: 'TASK_STARTED',
      taskId,
      timestamp: event.timestamp
    });
  }

  private async handleTaskComplete(event: MCPEvent): Promise<void> {
    const { workflowId, taskId, result } = event.payload;
    await this.workflowMonitor.trackWorkflowExecution(workflowId, {
      type: 'TASK_COMPLETED',
      taskId,
      result,
      timestamp: event.timestamp
    });
  }

  private async handleTaskFailure(event: MCPEvent): Promise<void> {
    const { workflowId, taskId, error } = event.payload;
    await this.errorHandler.handleWorkflowError({
      workflowId,
      taskId,
      error,
      timestamp: event.timestamp
    });
  }

  private async handleAgentRegistration(event: MCPEvent): Promise<void> {
    const { agentId, capabilities } = event.payload;
    await this.analytics.trackToolUsage('agent_registration');
    this.logger.info(`Agent registered: ${agentId}`, { capabilities });
  }

  private async handleCapabilityUpdate(event: MCPEvent): Promise<void> {
    const { agentId, capability } = event.payload;
    await this.analytics.trackToolUsage('capability_update');
    this.logger.info(`Agent capability updated: ${agentId}`, { capability });
  }

  private async handleAgentStatusChange(event: MCPEvent): Promise<void> {
    const { agentId, status } = event.payload;
    await this.analytics.trackToolUsage('agent_status_change');
    this.logger.info(`Agent status changed: ${agentId}`, { status });
  }

  private async handleSystemError(event: MCPEvent): Promise<void> {
    await this.errorHandler.handleWorkflowError({
      error: event.payload,
      timestamp: event.timestamp,
      context: event.metadata
    });
  }
}