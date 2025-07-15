var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.tsx';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { Logger } from '../common/logger.service.js';
let MCPErrorHandlingService = class MCPErrorHandlingService {
    mcpBroker;
    workflowMonitor;
    logger;
    constructor(mcpBroker, workflowMonitor, logger) {
        this.mcpBroker = mcpBroker;
        this.workflowMonitor = workflowMonitor;
        this.logger = logger;
    }
    async handleWorkflowError(context) {
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
        }
        catch (error) {
            this.logger.error('Error in error handler:', error);
        }
    }
    async notifyAgents(context) {
        try {
            await this.mcpBroker.executeDirective('agent', 'notifyError', {
                workflowId: context.workflowId,
                taskId: context.taskId,
                error: context.error instanceof Error ? context.error.message : String(context.error),
                timestamp: context.timestamp
            });
        }
        catch (error) {
            this.logger.error('Failed to notify agents:', error);
        }
    }
    async attemptRecovery(context) {
        if (!context.workflowId)
            return;
        try {
            // Check if the error is recoverable
            const recoveryStrategy = await this.determineRecoveryStrategy(context);
            if (!recoveryStrategy) {
                this.logger.warn('No recovery strategy available for error:', context);
                return;
            }
            // Execute recovery strategy
            await this.executeRecoveryStrategy(context, recoveryStrategy);
        }
        catch (error) {
            this.logger.error('Recovery attempt failed:', error);
        }
    }
    async determineRecoveryStrategy(context) {
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
    async executeRecoveryStrategy(context, strategy) {
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
    async retryExecution(context) {
        if (!context.workflowId || !context.taskId)
            return;
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
        }
        catch (error) {
            this.logger.error('Retry attempt failed:', error);
        }
    }
    async executeFallback(context) {
        if (!context.workflowId || !context.taskId)
            return;
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
        }
        catch (error) {
            this.logger.error('Fallback execution failed:', error);
        }
    }
    async findAlternateResource(context) {
        if (!context.workflowId || !context.taskId)
            return;
        try {
            const alternateResource = await this.mcpBroker.executeDirective('resource', 'findAlternative', {
                workflowId: context.workflowId,
                taskId: context.taskId,
                currentResource: context.context?.resource
            });
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
        }
        catch (error) {
            this.logger.error('Failed to find alternate resource:', error);
        }
    }
};
MCPErrorHandlingService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MCPBrokerService,
        WorkflowMonitoringService,
        Logger])
], MCPErrorHandlingService);
export { MCPErrorHandlingService };
