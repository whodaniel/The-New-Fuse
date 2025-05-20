import { Injectable } from '@nestjs/common';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.js';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { Logger } from '../common/logger.service.js';

export interface ErrorContext {
  workflowId?: string;
  taskId?: string;
  toolName?: string;
  error: Error | unknown;
  timestamp: number;
  context?: Record<string, unknown>;
}

@Injectable()
export class MCPErrorHandlingService {
  constructor(
    private readonly mcpBroker: MCPBrokerService,
    private readonly workflowMonitor: WorkflowMonitoringService,
    private readonly logger: Logger
  ) {}

  async handleWorkflowError(context: ErrorContext): Promise<void> {
    try {
      // Log the error
      this.logger.error('Workflow execution error:', {
        ...context,
        error: context.error instanceof Error ? context.error.message : String(context.error)
      });

      // Update workflow status
      if (context.workflowId) {
        await this.workflowMonitor.trackWorkflowExecution(context.workflowId, {
          type: 'ERROR',
          taskId: context.taskId,
          toolName: context.toolName,
          error: context.error instanceof Error ? context.error.message : String(context.error),
          timestamp: context.timestamp
        });
      }

      // Notify relevant agents
      await this.notifyAgents(context);

      // Attempt recovery if possible
      await this.attemptRecovery(context);
    } catch (error) {
      this.logger.error('Error in error handler:', error);
    }
  }

  private async notifyAgents(context: ErrorContext): Promise<void> {
    try {
      await this.mcpBroker.executeDirective('agent', 'notifyError', {
        workflowId: context.workflowId,
        taskId: context.taskId,
        error: context.error instanceof Error ? context.error.message : String(context.error),
        timestamp: context.timestamp
      });
    } catch (error) {
      this.logger.error('Failed to notify agents:', error);
    }
  }

  private async attemptRecovery(context: ErrorContext): Promise<void> {
    if (!context.workflowId) return;

    try {
      // Check if the error is recoverable
      const recoveryStrategy = await this.determineRecoveryStrategy(context);
      if (!recoveryStrategy) {
        this.logger.warn('No recovery strategy available for error:', context);
        return;
      }

      // Execute recovery strategy
      await this.executeRecoveryStrategy(context, recoveryStrategy);
    } catch (error) {
      this.logger.error('Recovery attempt failed:', error);
    }
  }

  private async determineRecoveryStrategy(context: ErrorContext): Promise<string | null> {
    // Analyze error and context to determine appropriate recovery strategy
    const error = context.error;
    
    if (error instanceof Error) {
      // Handle specific error types
      switch (error.name) {
        case 'MCPConnectionError':
          return 'retry';
        case 'TaskExecutionError':
          return 'fallback';
        case 'ResourceUnavailableError':
          return 'alternate_resource';
        default:
          return null;
      }
    }

    return null;
  }

  private async executeRecoveryStrategy(
    context: ErrorContext,
    strategy: string
  ): Promise<void> {
    switch (strategy) {
      case 'retry':
        await this.retryExecution(context);
        break;
      case 'fallback':
        await this.executeFallback(context);
        break;
      case 'alternate_resource':
        await this.findAlternateResource(context);
        break;
      default:
        this.logger.warn('Unknown recovery strategy:', strategy);
    }
  }

  private async retryExecution(context: ErrorContext): Promise<void> {
    if (!context.workflowId || !context.taskId) return;

    try {
      await this.mcpBroker.executeDirective('workflow', 'retryTask', {
        workflowId: context.workflowId,
        taskId: context.taskId,
        context: context.context
      });

      this.logger.info('Successfully initiated task retry:', {
        workflowId: context.workflowId,
        taskId: context.taskId
      });
    } catch (error) {
      this.logger.error('Retry attempt failed:', error);
    }
  }

  private async executeFallback(context: ErrorContext): Promise<void> {
    if (!context.workflowId || !context.taskId) return;

    try {
      await this.mcpBroker.executeDirective('workflow', 'executeFallback', {
        workflowId: context.workflowId,
        taskId: context.taskId,
        context: context.context
      });

      this.logger.info('Successfully executed fallback:', {
        workflowId: context.workflowId,
        taskId: context.taskId
      });
    } catch (error) {
      this.logger.error('Fallback execution failed:', error);
    }
  }

  private async findAlternateResource(context: ErrorContext): Promise<void> {
    if (!context.workflowId || !context.taskId) return;

    try {
      const alternateResource = await this.mcpBroker.executeDirective(
        'resource',
        'findAlternative',
        {
          workflowId: context.workflowId,
          taskId: context.taskId,
          currentResource: context.context?.resource
        }
      );

      if (alternateResource) {
        await this.mcpBroker.executeDirective('workflow', 'updateTaskResource', {
          workflowId: context.workflowId,
          taskId: context.taskId,
          resource: alternateResource
        });

        this.logger.info('Successfully found and assigned alternate resource:', {
          workflowId: context.workflowId,
          taskId: context.taskId,
          resource: alternateResource
        });
      }
    } catch (error) {
      this.logger.error('Failed to find alternate resource:', error);
    }
  }
}