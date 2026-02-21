import { Injectable } from '@nestjs/common';
import { AgentMetricsService } from './AgentMetricsService.js';
import { AgentWebSocketService } from './AgentWebSocketService.js';

@Injectable()
export class WorkflowExecutionTracker {
    private activeExecutions = new Map<string, ExecutionState>();

    constructor(
        private metricsService: AgentMetricsService,
        private wsService: AgentWebSocketService
    ) {}

    startExecution(workflowId: string, nodes: string[]) {
        this.activeExecutions.set(workflowId, {
            startTime: Date.now(),
            nodes: new Map(nodes.map(id => [id, { status: 'pending' }])),
            status: 'running'
        });
    }

    updateNodeStatus(workflowId: string, nodeId: string, status: string) {
        const execution = this.activeExecutions.get(workflowId);
        if (execution) {
            execution.nodes.get(nodeId).status = status;
            this.checkWorkflowCompletion(workflowId);
        }
    }

    private checkWorkflowCompletion(workflowId: string) {
        const execution = this.activeExecutions.get(workflowId);
        if (Array.from(execution.nodes.values()).every(n => n.status === 'completed')) {
            execution.status = 'completed';
            this.finalizeExecution(workflowId);
        }
    }

    private async finalizeExecution(workflowId: string) {
        const execution = this.activeExecutions.get(workflowId);
        const duration = Date.now() - execution.startTime;
        
        await this.metricsService.trackMetric('workflow_execution', duration);
        this.wsService.broadcastWorkflowComplete(workflowId, {
            duration,
            nodeStatuses: Object.fromEntries(execution.nodes)
        });
        
        this.activeExecutions.delete(workflowId);
    }
}