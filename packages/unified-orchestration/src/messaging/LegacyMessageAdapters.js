"use strict";
/**
 * Legacy Message Adapters for Backward Compatibility
 *
 * This module provides conversion functions between legacy message formats
 * from existing systems and the new unified message format.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManagementAdapter = exports.SyncSystemAdapter = exports.WorkflowEngineAdapter = exports.CLIAgentAdapter = void 0;
exports.createLegacyMessageMappings = createLegacyMessageMappings;
exports.detectLegacyMessageFormat = detectLegacyMessageFormat;
const uuid_1 = require("uuid");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('tnf:legacy-adapters');
/**
 * CLI Agent Legacy Message Adapters
 */
class CLIAgentAdapter {
    /**
     * Convert CLI agent request to unified format
     */
    static toUnified(cliMessage) {
        debug('Converting CLI message to unified format: %o', cliMessage);
        const baseMessage = {
            id: cliMessage.id || (0, uuid_1.v4)(),
            type: CLIAgentAdapter.mapMessageType(cliMessage.command || cliMessage.type),
            protocol: 'direct',
            priority: CLIAgentAdapter.mapPriority(cliMessage.priority),
            timestamp: new Date(cliMessage.timestamp || Date.now()),
            from: {
                agentId: cliMessage.agentId || 'cli-agent',
                agentType: 'cli',
                instanceId: cliMessage.instanceId,
                tenantId: cliMessage.tenantId,
                workspaceId: cliMessage.workspaceId
            },
            to: {
                agentId: cliMessage.targetAgent,
                capabilities: cliMessage.requiredCapabilities,
                tenantId: cliMessage.tenantId,
                workspaceId: cliMessage.workspaceId
            },
            payload: {
                taskId: cliMessage.taskId || (0, uuid_1.v4)(),
                taskType: cliMessage.command || cliMessage.taskType,
                task: cliMessage.task || cliMessage.data,
                parameters: cliMessage.params || cliMessage.arguments,
                requirements: {
                    capabilities: cliMessage.requiredCapabilities,
                    timeout: cliMessage.timeout
                }
            },
            context: cliMessage.context,
            metadata: {
                originalFormat: 'cli',
                ...cliMessage.metadata
            },
            status: 'pending'
        };
        return baseMessage;
    }
    /**
     * Convert unified message to CLI agent format
     */
    static fromUnified(unifiedMessage) {
        debug('Converting unified message to CLI format: %o', unifiedMessage);
        return {
            id: unifiedMessage.id,
            command: unifiedMessage.payload?.taskType || CLIAgentAdapter.mapToCliCommand(unifiedMessage.type),
            agentId: unifiedMessage.from.agentId,
            targetAgent: unifiedMessage.to.agentId,
            taskId: unifiedMessage.payload?.taskId,
            task: unifiedMessage.payload?.task,
            params: unifiedMessage.payload?.parameters,
            arguments: unifiedMessage.payload?.parameters,
            requiredCapabilities: unifiedMessage.to.capabilities,
            priority: unifiedMessage.priority,
            timestamp: unifiedMessage.timestamp.getTime(),
            timeout: unifiedMessage.payload?.requirements?.timeout,
            context: unifiedMessage.context,
            metadata: unifiedMessage.metadata,
            tenantId: unifiedMessage.from.tenantId,
            workspaceId: unifiedMessage.from.workspaceId
        };
    }
    static mapMessageType(cliCommand) {
        const mapping = {
            'execute': 'task_request',
            'analyze': 'task_request',
            'generate': 'task_request',
            'search': 'task_request',
            'handoff': 'handoff_request',
            'status': 'agent_status',
            'heartbeat': 'agent_heartbeat'
        };
        return mapping[cliCommand] || 'task_request';
    }
    static mapToCliCommand(messageType) {
        const mapping = {
            'task_request': 'execute',
            'handoff_request': 'handoff',
            'agent_status': 'status',
            'agent_heartbeat': 'heartbeat'
        };
        return mapping[messageType] || 'execute';
    }
    static mapPriority(cliPriority) {
        const mapping = {
            '1': 'low',
            '2': 'medium',
            '3': 'high',
            '4': 'critical',
            'low': 'low',
            'medium': 'medium',
            'high': 'high',
            'critical': 'critical'
        };
        return mapping[cliPriority || 'medium'] || 'medium';
    }
}
exports.CLIAgentAdapter = CLIAgentAdapter;
/**
 * Workflow Engine Legacy Message Adapters
 */
class WorkflowEngineAdapter {
    /**
     * Convert workflow message to unified format
     */
    static toUnified(workflowMessage) {
        debug('Converting workflow message to unified format: %o', workflowMessage);
        const messageType = WorkflowEngineAdapter.mapWorkflowEventType(workflowMessage.eventType);
        const baseMessage = {
            id: workflowMessage.id || (0, uuid_1.v4)(),
            type: messageType,
            protocol: workflowMessage.protocol || 'websocket',
            priority: WorkflowEngineAdapter.mapPriority(workflowMessage.priority),
            timestamp: new Date(workflowMessage.timestamp || Date.now()),
            from: {
                agentId: workflowMessage.workflowId || workflowMessage.nodeId,
                agentType: 'workflow',
                instanceId: workflowMessage.executionId,
                tenantId: workflowMessage.tenantId,
                workspaceId: workflowMessage.workspaceId
            },
            to: {
                agentId: workflowMessage.targetNodeId,
                capabilities: workflowMessage.requiredCapabilities,
                tenantId: workflowMessage.tenantId,
                workspaceId: workflowMessage.workspaceId
            },
            payload: {
                workflowId: workflowMessage.workflowId,
                workflowType: workflowMessage.workflowType,
                stepId: workflowMessage.nodeId || workflowMessage.stepId,
                stepType: workflowMessage.nodeType || workflowMessage.stepType,
                stepData: workflowMessage.nodeData || workflowMessage.data,
                workflowContext: workflowMessage.context,
                variables: workflowMessage.variables || workflowMessage.state,
                nextSteps: workflowMessage.nextNodes || workflowMessage.nextSteps,
                error: workflowMessage.error ? {
                    stepId: workflowMessage.nodeId,
                    error: workflowMessage.error
                } : undefined
            },
            context: {
                execution: workflowMessage.execution,
                ...workflowMessage.metadata
            },
            status: WorkflowEngineAdapter.mapStatus(workflowMessage.status)
        };
        return baseMessage;
    }
    /**
     * Convert unified message to workflow format
     */
    static fromUnified(unifiedMessage) {
        debug('Converting unified message to workflow format: %o', unifiedMessage);
        const payload = unifiedMessage.payload;
        return {
            id: unifiedMessage.id,
            eventType: WorkflowEngineAdapter.mapToWorkflowEvent(unifiedMessage.type),
            workflowId: payload?.workflowId,
            workflowType: payload?.workflowType,
            executionId: unifiedMessage.from.instanceId,
            nodeId: payload?.stepId,
            nodeType: payload?.stepType,
            nodeData: payload?.stepData,
            targetNodeId: unifiedMessage.to.agentId,
            requiredCapabilities: unifiedMessage.to.capabilities,
            context: payload?.workflowContext,
            variables: payload?.variables,
            state: payload?.variables,
            nextNodes: payload?.nextSteps,
            nextSteps: payload?.nextSteps,
            error: payload?.error?.error,
            priority: unifiedMessage.priority,
            timestamp: unifiedMessage.timestamp.getTime(),
            status: unifiedMessage.status,
            protocol: unifiedMessage.protocol,
            tenantId: unifiedMessage.from.tenantId,
            workspaceId: unifiedMessage.from.workspaceId,
            metadata: unifiedMessage.context,
            execution: unifiedMessage.context?.execution
        };
    }
    static mapWorkflowEventType(eventType) {
        const mapping = {
            'workflow.started': 'workflow_start',
            'workflow.step': 'workflow_step',
            'workflow.completed': 'workflow_complete',
            'workflow.failed': 'workflow_error',
            'node.executed': 'workflow_step',
            'node.failed': 'workflow_error'
        };
        return mapping[eventType] || 'workflow_step';
    }
    static mapToWorkflowEvent(messageType) {
        const mapping = {
            'workflow_start': 'workflow.started',
            'workflow_step': 'workflow.step',
            'workflow_complete': 'workflow.completed',
            'workflow_error': 'workflow.failed'
        };
        return mapping[messageType] || 'workflow.step';
    }
    static mapPriority(priority) {
        if (typeof priority === 'number') {
            if (priority <= 1)
                return 'low';
            if (priority <= 3)
                return 'medium';
            if (priority <= 5)
                return 'high';
            return 'critical';
        }
        const mapping = {
            'low': 'low',
            'normal': 'medium',
            'medium': 'medium',
            'high': 'high',
            'urgent': 'critical',
            'critical': 'critical'
        };
        return mapping[priority || 'medium'] || 'medium';
    }
    static mapStatus(status) {
        const mapping = {
            'pending': 'pending',
            'running': 'processing',
            'executing': 'processing',
            'completed': 'completed',
            'finished': 'completed',
            'failed': 'failed',
            'error': 'failed',
            'cancelled': 'cancelled'
        };
        return mapping[status || 'pending'] || 'pending';
    }
}
exports.WorkflowEngineAdapter = WorkflowEngineAdapter;
/**
 * Sync System Legacy Message Adapters
 */
class SyncSystemAdapter {
    /**
     * Convert sync message to unified format
     */
    static toUnified(syncMessage) {
        debug('Converting sync message to unified format: %o', syncMessage);
        const messageType = syncMessage.operation === 'request' ? 'sync_request' : 'sync_response';
        const baseMessage = {
            id: syncMessage.id || (0, uuid_1.v4)(),
            type: messageType,
            protocol: 'redis',
            priority: 'medium',
            timestamp: new Date(syncMessage.timestamp || Date.now()),
            correlationId: syncMessage.correlationId,
            from: {
                agentId: syncMessage.sourceAgent || syncMessage.source?.agentId,
                agentType: 'sync',
                instanceId: syncMessage.source?.instanceId,
                tenantId: syncMessage.tenantId,
                workspaceId: syncMessage.workspaceId
            },
            to: {
                agentId: syncMessage.targetAgent || syncMessage.target?.agentId,
                tenantId: syncMessage.tenantId,
                workspaceId: syncMessage.workspaceId
            },
            payload: {
                syncId: syncMessage.syncId || syncMessage.id,
                syncType: syncMessage.syncType || 'state',
                source: {
                    agentId: syncMessage.sourceAgent || syncMessage.source?.agentId,
                    instanceId: syncMessage.source?.instanceId,
                    version: syncMessage.source?.version
                },
                target: syncMessage.target ? {
                    agentId: syncMessage.target.agentId,
                    instanceId: syncMessage.target.instanceId,
                    scope: syncMessage.target.scope
                } : undefined,
                data: syncMessage.data || syncMessage.payload,
                delta: syncMessage.delta || syncMessage.changes,
                conflicts: syncMessage.conflicts,
                syncResult: syncMessage.result
            },
            context: {
                operation: syncMessage.operation,
                ...syncMessage.context
            },
            status: SyncSystemAdapter.mapStatus(syncMessage.status)
        };
        return baseMessage;
    }
    /**
     * Convert unified message to sync format
     */
    static fromUnified(unifiedMessage) {
        debug('Converting unified message to sync format: %o', unifiedMessage);
        const payload = unifiedMessage.payload;
        const operation = unifiedMessage.type === 'sync_request' ? 'request' : 'response';
        return {
            id: unifiedMessage.id,
            syncId: payload?.syncId,
            correlationId: unifiedMessage.correlationId,
            operation,
            syncType: payload?.syncType,
            sourceAgent: unifiedMessage.from.agentId,
            targetAgent: unifiedMessage.to.agentId,
            source: payload?.source,
            target: payload?.target,
            data: payload?.data,
            payload: payload?.data,
            delta: payload?.delta,
            changes: payload?.delta,
            conflicts: payload?.conflicts,
            result: payload?.syncResult,
            timestamp: unifiedMessage.timestamp.getTime(),
            status: unifiedMessage.status,
            tenantId: unifiedMessage.from.tenantId,
            workspaceId: unifiedMessage.from.workspaceId,
            context: unifiedMessage.context
        };
    }
    static mapStatus(status) {
        const mapping = {
            'pending': 'pending',
            'syncing': 'processing',
            'completed': 'completed',
            'failed': 'failed',
            'cancelled': 'cancelled'
        };
        return mapping[status || 'pending'] || 'pending';
    }
}
exports.SyncSystemAdapter = SyncSystemAdapter;
/**
 * Task Management Legacy Message Adapters
 */
class TaskManagementAdapter {
    /**
     * Convert task management message to unified format
     */
    static toUnified(taskMessage) {
        debug('Converting task message to unified format: %o', taskMessage);
        const messageType = TaskManagementAdapter.mapTaskEventType(taskMessage.event || taskMessage.type);
        const baseMessage = {
            id: taskMessage.id || (0, uuid_1.v4)(),
            type: messageType,
            protocol: taskMessage.protocol || 'websocket',
            priority: TaskManagementAdapter.mapPriority(taskMessage.priority),
            timestamp: new Date(taskMessage.timestamp || taskMessage.createdAt || Date.now()),
            correlationId: taskMessage.correlationId || taskMessage.taskId,
            from: {
                agentId: taskMessage.assignerId || taskMessage.from,
                agentType: 'custom',
                tenantId: taskMessage.tenantId,
                workspaceId: taskMessage.workspaceId
            },
            to: {
                agentId: taskMessage.assigneeId || taskMessage.to,
                capabilities: taskMessage.requiredSkills || taskMessage.capabilities,
                tenantId: taskMessage.tenantId,
                workspaceId: taskMessage.workspaceId
            },
            payload: {
                taskId: taskMessage.taskId,
                taskType: taskMessage.taskType || taskMessage.category,
                task: taskMessage.task || taskMessage.description,
                parameters: taskMessage.params || taskMessage.requirements,
                requirements: {
                    capabilities: taskMessage.requiredSkills || taskMessage.capabilities,
                    timeout: taskMessage.deadline ? new Date(taskMessage.deadline).getTime() - Date.now() : undefined
                }
            },
            context: {
                projectId: taskMessage.projectId,
                status: taskMessage.status,
                progress: taskMessage.progress,
                ...taskMessage.context
            },
            status: TaskManagementAdapter.mapStatus(taskMessage.status)
        };
        return baseMessage;
    }
    /**
     * Convert unified message to task management format
     */
    static fromUnified(unifiedMessage) {
        debug('Converting unified message to task format: %o', unifiedMessage);
        const payload = unifiedMessage.payload;
        return {
            id: unifiedMessage.id,
            taskId: payload?.taskId,
            correlationId: unifiedMessage.correlationId,
            event: TaskManagementAdapter.mapToTaskEvent(unifiedMessage.type),
            type: unifiedMessage.type,
            taskType: payload?.taskType,
            category: payload?.taskType,
            task: payload?.task,
            description: payload?.task,
            assignerId: unifiedMessage.from.agentId,
            assigneeId: unifiedMessage.to.agentId,
            from: unifiedMessage.from.agentId,
            to: unifiedMessage.to.agentId,
            requiredSkills: unifiedMessage.to.capabilities,
            capabilities: unifiedMessage.to.capabilities,
            params: payload?.parameters,
            requirements: payload?.parameters,
            priority: unifiedMessage.priority,
            timestamp: unifiedMessage.timestamp.getTime(),
            createdAt: unifiedMessage.timestamp.toISOString(),
            deadline: payload?.requirements?.timeout ?
                new Date(Date.now() + payload.requirements.timeout).toISOString() : undefined,
            status: unifiedMessage.status,
            progress: unifiedMessage.context?.progress,
            projectId: unifiedMessage.context?.projectId,
            protocol: unifiedMessage.protocol,
            tenantId: unifiedMessage.from.tenantId,
            workspaceId: unifiedMessage.from.workspaceId,
            context: unifiedMessage.context
        };
    }
    static mapTaskEventType(eventType) {
        const mapping = {
            'task.created': 'task_request',
            'task.assigned': 'task_request',
            'task.started': 'task_progress',
            'task.progress': 'task_progress',
            'task.completed': 'task_response',
            'task.failed': 'task_error'
        };
        return mapping[eventType] || 'task_request';
    }
    static mapToTaskEvent(messageType) {
        const mapping = {
            'task_request': 'task.created',
            'task_progress': 'task.progress',
            'task_response': 'task.completed',
            'task_error': 'task.failed'
        };
        return mapping[messageType] || 'task.created';
    }
    static mapPriority(priority) {
        if (typeof priority === 'number') {
            if (priority <= 1)
                return 'low';
            if (priority <= 3)
                return 'medium';
            if (priority <= 5)
                return 'high';
            return 'critical';
        }
        const mapping = {
            'low': 'low',
            'normal': 'medium',
            'medium': 'medium',
            'high': 'high',
            'urgent': 'critical',
            'critical': 'critical'
        };
        return mapping[priority || 'medium'] || 'medium';
    }
    static mapStatus(status) {
        const mapping = {
            'created': 'pending',
            'assigned': 'pending',
            'in-progress': 'processing',
            'completed': 'completed',
            'failed': 'failed',
            'cancelled': 'cancelled'
        };
        return mapping[status || 'pending'] || 'pending';
    }
}
exports.TaskManagementAdapter = TaskManagementAdapter;
/**
 * Create the complete legacy message mappings
 */
function createLegacyMessageMappings() {
    return {
        cliFormats: {
            'cli-v1': {
                toUnified: CLIAgentAdapter.toUnified,
                fromUnified: CLIAgentAdapter.fromUnified
            }
        },
        workflowFormats: {
            'workflow-v1': {
                toUnified: WorkflowEngineAdapter.toUnified,
                fromUnified: WorkflowEngineAdapter.fromUnified
            }
        },
        syncFormats: {
            'sync-v1': {
                toUnified: SyncSystemAdapter.toUnified,
                fromUnified: SyncSystemAdapter.fromUnified
            }
        },
        taskFormats: {
            'task-v1': {
                toUnified: TaskManagementAdapter.toUnified,
                fromUnified: TaskManagementAdapter.fromUnified
            }
        }
    };
}
/**
 * Auto-detect legacy message format
 */
function detectLegacyMessageFormat(message) {
    // CLI format detection
    if (message.command || (message.agentId && message.task)) {
        return 'cli-v1';
    }
    // Workflow format detection
    if (message.workflowId || message.nodeId || message.eventType) {
        return 'workflow-v1';
    }
    // Sync format detection
    if (message.syncId || message.operation || (message.source && message.target)) {
        return 'sync-v1';
    }
    // Task format detection
    if (message.taskId || message.assignerId || message.assigneeId) {
        return 'task-v1';
    }
    return null;
}
//# sourceMappingURL=LegacyMessageAdapters.js.map