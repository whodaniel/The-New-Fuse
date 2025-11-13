import { AgentService } from '../services/agent.service';
import { WorkflowService } from '../services/workflow.service';
interface UserModel {
    id: string;
    [key: string]: any;
}
export interface BatchOperationRequest<T> {
    operations: Array<{
        id?: string;
        action: 'create' | 'update' | 'delete';
        data: T;
    }>;
}
export interface BatchOperationResponse<T> {
    results: Array<{
        id: string;
        action: string;
        success: boolean;
        data?: T;
        error?: string;
    }>;
    summary: {
        total: number;
        successful: number;
        failed: number;
        duration: number;
    };
}
export interface ResourceWithRelations {
    id: string;
    include?: string[];
    fields?: string[];
}
export declare class ConsolidatedApiController {
    private readonly agentService;
    private readonly workflowService;
    constructor(agentService: AgentService, workflowService: WorkflowService);
    batchAgentOperations(request: BatchOperationRequest<any>, user: UserModel): Promise<BatchOperationResponse<any>>;
    multiFetch(request: {
        agents?: ResourceWithRelations[];
        workflows?: ResourceWithRelations[];
        tasks?: ResourceWithRelations[];
    }, user: UserModel): Promise<{
        agents?: any[];
        workflows?: any[];
        tasks?: any[];
        meta: {
            totalQueries: number;
            duration: number;
        };
    }>;
    getDashboardData(user: UserModel): Promise<{
        summary: {
            agentCount: number;
            activeWorkflows: number;
            pendingTasks: number;
            recentActivity: number;
        };
        recentAgents: any[];
        activeWorkflows: any[];
        urgentTasks: any[];
        systemHealth: {
            status: string;
            uptime: number;
            lastCheck: Date;
        };
        performance: {
            averageResponseTime: number;
            successRate: number;
            activeConnections: number;
        };
    }>;
    bulkStatusUpdate(request: {
        agents?: Array<{
            id: string;
            status: string;
        }>;
        workflows?: Array<{
            id: string;
            status: string;
        }>;
        tasks?: Array<{
            id: string;
            status: string;
        }>;
    }, user: UserModel): Promise<{
        updated: {
            agents: number;
            workflows: number;
            tasks: number;
        };
        errors: Array<{
            type: string;
            id: string;
            error: string;
        }>;
    }>;
    globalSearch(query: string, types: string | undefined, limit: number | undefined, user: UserModel): Promise<{
        agents: any[];
        workflows: any[];
        tasks: any[];
        total: number;
        searchTime: number;
    }>;
    getAnalyticsSummary(period: string | undefined, user: UserModel): Promise<{
        period: string;
        metrics: {
            agentMetrics: any;
            workflowMetrics: any;
            taskMetrics: any;
            performanceMetrics: any;
        };
        trends: {
            agentCreation: number[];
            workflowExecution: number[];
            taskCompletion: number[];
        };
        topPerformers: {
            agents: any[];
            workflows: any[];
        };
    }>;
    private getRecentActivityCount;
    private getSystemHealth;
    private getPerformanceMetrics;
}
export {};
//# sourceMappingURL=ConsolidatedApiController.d.ts.map