import { VSCodeTerminalService } from './vscode-terminal.service';
import { SecureSubprocessService } from './secure-subprocess.service';
import { GitTransactionService } from './git-transaction.service';
export interface AgentTask {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedDuration: number;
    dependencies: string[];
    assignedAgent?: string;
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'timeout';
    createdAt: Date;
    assignedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
}
export interface GeminiAgent {
    id: string;
    terminalSessionId: string;
    status: 'idle' | 'busy' | 'error' | 'quota_exceeded' | 'dormant';
    capabilities: string[];
    currentTask?: string;
    lastActivity: Date;
    totalTasksCompleted: number;
    averageTaskDuration: number;
    quotaStatus: {
        model: 'pro' | 'flash';
        quotaExceeded: boolean;
        lastQuotaCheck: Date;
    };
    performance: {
        successRate: number;
        averageResponseTime: number;
        errorCount: number;
    };
}
export interface CoordinationStrategy {
    type: 'round_robin' | 'priority_based' | 'capability_match' | 'load_balanced';
    parameters: Record<string, any>;
}
export interface WorkflowExecution {
    id: string;
    name: string;
    tasks: AgentTask[];
    strategy: CoordinationStrategy;
    status: 'planning' | 'executing' | 'completed' | 'failed' | 'paused';
    startTime: Date;
    endTime?: Date;
    progress: {
        total: number;
        completed: number;
        failed: number;
        percentage: number;
    };
    agents: string[];
    results: Record<string, any>;
}
export declare class EnhancedGeminiCoordinatorService {
    private readonly terminalService;
    private readonly subprocessService;
    private readonly gitService;
    private readonly logger;
    private agents;
    private tasks;
    private workflows;
    private taskQueue;
    private monitoringInterval?;
    constructor(terminalService: VSCodeTerminalService, subprocessService: SecureSubprocessService, gitService: GitTransactionService);
    /**
     * Initialize multiple Gemini agents
     */
    initializeAgentPool(count?: number): Promise<string[]>;
    /**
     * Assign task to best available agent
     */
    assignTask(taskId: string, agentId?: string): Promise<boolean>;
}
//# sourceMappingURL=enhanced-gemini-coordinator.service.d.ts.map