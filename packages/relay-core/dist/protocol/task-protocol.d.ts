export interface OrchestrationTask {
    id: string;
    type: 'question' | 'generation' | 'analysis' | 'review' | 'continuation';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    instructions: string[];
    targetAgents?: string[];
    requiredCapabilities?: string[];
    requiresResponse: boolean;
    responseTimeout: number;
    maxRetries: number;
    dependencies?: string[];
    nextTasks?: string[];
    correlationId: string;
    parentTaskId?: string;
    createdAt: number;
    createdBy: string;
}
export interface TaskResult {
    taskId: string;
    status: 'completed' | 'failed' | 'timeout' | 'cancelled';
    result?: unknown;
    error?: string;
    completedBy: string;
    completedAt: number;
    duration: number;
}
//# sourceMappingURL=task-protocol.d.ts.map