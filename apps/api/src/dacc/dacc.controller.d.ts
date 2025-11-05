import { Observable } from 'rxjs';
import { DACCOrchestratorService } from './orchestrator.service';
import { DACCStreamingService } from './streaming.service';
import { AgentFactory } from '../agents/agent.factory';
import { PrismaService } from '../modules/prisma/prisma.service';
import { DACCAgentDefinition, DACCWorkflowDefinition, SystemBlueprint } from '@the-new-fuse/types';
interface CreateAgentRequest {
    agentDefinition: DACCAgentDefinition;
}
interface CreateWorkflowRequest {
    workflowDefinition: DACCWorkflowDefinition;
}
interface ExecuteWorkflowRequest {
    workflowName?: string;
    workflowDefinition?: DACCWorkflowDefinition;
    input?: any;
    sessionId?: string;
}
interface DeploySystemBlueprintRequest {
    blueprint: SystemBlueprint;
}
export declare class DACCController {
    private readonly orchestratorService;
    private readonly streamingService;
    private readonly agentFactory;
    private readonly prismaService;
    private readonly logger;
    constructor(orchestratorService: DACCOrchestratorService, streamingService: DACCStreamingService, agentFactory: AgentFactory, prismaService: PrismaService);
    /**
     * Create a new DACC agent from definition
     */
    createAgent(request: CreateAgentRequest): Promise<{
        success: boolean;
        agent: {
            id: any;
            name: any;
            status: any;
            instance_id: any;
        };
        message: string;
    }>;
    /**
     * Get all available agents
     */
    getAgents(): Promise<{
        success: boolean;
        agents: any;
    }>;
    /**
     * Get specific agent definition
     */
    getAgent(name: string): Promise<{
        success: boolean;
        agent: any;
    }>;
    /**
     * Create a new workflow definition
     */
    createWorkflow(request: CreateWorkflowRequest): Promise<{
        success: boolean;
        workflow: {
            id: any;
            name: any;
            description: any;
            status: any;
        };
        message: string;
    }>;
    /**
     * Get all workflows
     */
    getWorkflows(): Promise<{
        success: boolean;
        workflows: any;
    }>;
    /**
     * Execute a workflow
     */
    executeWorkflow(request: ExecuteWorkflowRequest): Promise<{
        success: boolean;
        executionId: any;
        message: string;
        streamUrl: string;
    }>;
    /**
     * Get workflow execution status
     */
    getExecutionStatus(executionId: string): Promise<{
        success: boolean;
        execution: any;
    }>;
    /**
     * Cancel workflow execution
     */
    cancelExecution(executionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Server-Sent Events stream for workflow execution
     */
    streamWorkflowExecution(executionId: string): Observable<{
        data: string;
        type?: string;
        id?: string;
        retry?: number;
    }>;
    /**
     * Deploy a system blueprint (Genesis Layer)
     */
    deploySystemBlueprint(request: DeploySystemBlueprintRequest): Promise<{
        success: boolean;
        results: {
            agents: never[];
            workflow: null;
        };
        message: string;
    }>;
    /**
     * Get system health and configuration
     */
    getHealth(): Promise<{
        success: boolean;
        status: string;
        agents: {
            active: any;
            maxConcurrent: any;
        };
        orchestrator: {
            maxConcurrentWorkflows: any;
            stepTimeoutMs: any;
            streamingEnabled: any;
        };
        timestamp: string;
    }>;
}
export {};
//# sourceMappingURL=dacc.controller.d.ts.map