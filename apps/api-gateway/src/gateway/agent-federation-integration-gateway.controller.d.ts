/**
 * AgentFederationIntegration Gateway Controller
 * Dedicated endpoint for AgentFederationIntegration-style agent communication and orchestration
 */
import { MessageEvent } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { ProxyService } from '../proxy/proxy.service';
interface PlanExecutionRequest {
    planId: string;
    context?: Record<string, any>;
    workspace?: {
        path?: string;
        files?: string[];
        metadata?: Record<string, any>;
    };
    options?: {
        timeout?: number;
        retries?: number;
        parallel?: boolean;
    };
}
interface VerificationRequest {
    verificationId: string;
    context?: Record<string, any>;
    targetFiles?: string[];
    criteria?: Record<string, any>;
}
interface StructuredPromptRequest {
    prompt: string;
    workspace?: {
        path?: string;
        files?: string[];
        context?: Record<string, any>;
    };
    metadata?: Record<string, any>;
    format?: 'json' | 'xml' | 'yaml' | 'markdown';
    streaming?: boolean;
}
interface WorkflowOrchestrationRequest {
    workflowId: string;
    agents: string[];
    tasks: Array<{
        agentId: string;
        taskType: string;
        payload: Record<string, any>;
        dependencies?: string[];
    }>;
    options?: {
        parallel?: boolean;
        failFast?: boolean;
        retryPolicy?: Record<string, any>;
    };
}
interface ExportRequest {
    format: 'json' | 'markdown' | 'csv' | 'xml';
    agentIds?: string[];
    dateRange?: {
        start: string;
        end: string;
    };
    includeMetadata?: boolean;
    filters?: Record<string, any>;
}
export declare class AgentFederationIntegrationGatewayController {
    private readonly proxyService;
    private readonly taskStreams;
    private readonly streamCreationTimes;
    private cleanupTimer;
    constructor(proxyService: ProxyService);
    executePlan(body: PlanExecutionRequest, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    executeVerification(body: VerificationRequest, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    executeAllVerifications(body: {
        context?: any;
        parallel?: boolean;
        filters?: any;
    }, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    sendStructuredPrompt(body: StructuredPromptRequest, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    discoverAgents(query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    configureAgent(agentId: string, body: {
        configPath?: string;
        settings?: any;
        capabilities?: string[];
    }, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getAgentStatus(agentId: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    orchestrateWorkflow(body: WorkflowOrchestrationRequest, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getWorkflowStatus(workflowId: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    exportMarkdown(body: ExportRequest & {
        template?: string;
    }, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    exportJson(body: ExportRequest & {
        schema?: string;
    }, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getWorkspaceContext(query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getWorkspaceFiles(query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    streamTaskUpdates(agentId?: string, workflowId?: string, eventTypes?: string): Observable<MessageEvent>;
    /**
     * Emit task update to all connected streams
     */
    private emitTaskUpdate;
    /**
     * Clean up stale streams (older than 10 minutes)
     */
    private cleanupStaleStreams;
    spawnAICoderInstance(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    coordinateAICoders(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    delegateTask(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getAICoderStatus(query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    initiateCodeReview(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    initiateConsensusVoting(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getCollaborationStatus(collaborationId: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    stopAICoderInstance(agentId: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Cleanup when controller is destroyed
     */
    onDestroy(): void;
}
export {};
//# sourceMappingURL=agent-federation-integration-gateway.controller.d.ts.map