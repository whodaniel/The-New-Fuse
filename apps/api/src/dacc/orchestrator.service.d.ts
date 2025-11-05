import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AgentFactory } from '../agents/agent.factory';
import { DACCStreamingService } from './streaming.service';
import { DACCDataResolverService } from './data-resolver.service';
import { DACCWorkflowDefinition, DACCExecutionState, OrchestratorConfig } from '@the-new-fuse/types';
export declare class DACCOrchestratorService {
    private configService;
    private prismaService;
    private agentFactory;
    private streamingService;
    private dataResolverService;
    private readonly logger;
    private activeExecutions;
    private orchestratorConfig;
    constructor(configService: ConfigService, prismaService: PrismaService, agentFactory: AgentFactory, streamingService: DACCStreamingService, dataResolverService: DACCDataResolverService);
    /**
     * Start workflow execution
     */
    executeWorkflow(workflowDefinition: DACCWorkflowDefinition, input?: any, sessionId?: string): Promise<string>;
    /**
     * Execute workflow steps
     */
    private executeWorkflowSteps;
    /**
     * Execute individual workflow step
     */
    private executeStep;
    /**
     * Execute tool call
     */
    private executeToolCall;
    /**
     * Route tool call to appropriate executor
     */
    private routeToolCall;
    /**
     * Get or create agent instance
     */
    private getOrCreateAgent;
    /**
     * Load agent definition from database
     */
    private loadAgentDefinition;
    /**
     * Prepare step input based on input mapping
     */
    private prepareStepInput;
    /**
     * Resolve value from execution state using dot notation
     */
    private resolveValue;
    /**
     * Determine next step based on conditions
     */
    private determineNextStep;
    /**
     * Evaluate step condition
     */
    private evaluateCondition;
    /**
     * Create workflow execution record in database
     */
    private createWorkflowExecutionRecord;
    /**
     * Persist execution state to database
     */
    private persistExecutionState;
    /**
     * Complete workflow execution
     */
    private completeWorkflowExecution;
    /**
     * Handle workflow error
     */
    private handleWorkflowError;
    /**
     * Create timeout promise
     */
    private createTimeoutPromise;
    /**
     * Generate unique execution ID
     */
    private generateExecutionId;
    /**
     * Get execution status
     */
    getExecutionStatus(executionId: string): Promise<DACCExecutionState | null>;
    /**
     * Cancel workflow execution
     */
    cancelExecution(executionId: string): Promise<boolean>;
    /**
     * Extract validation hints from DACC agent definition for POML processing
     */
    private extractValidationHints;
    /**
     * Get orchestrator configuration
     */
    getOrchestratorConfig(): OrchestratorConfig;
}
//# sourceMappingURL=orchestrator.service.d.ts.map