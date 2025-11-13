/**
 * Master Orchestrator for The New Fuse Framework
 *
 * This orchestrator serves as the central coordination point for all agent systems,
 * unifying CLI agents, Workflow engines, Sync orchestrators, and custom agents
 * while maintaining backward compatibility and enabling advanced multi-agent workflows.
 */
import { EventEmitter } from 'events';
export type CoordinationStrategy = 'sequential' | 'parallel' | 'dependency_graph' | 'handoff_chain';
export type MasterOrchestratorEvents = 'execution_started' | 'execution_completed' | 'execution_failed' | 'execution_cancelled' | 'metrics_updated' | 'agent_registry_event';
import { UnifiedAgentRegistry } from '../registry/UnifiedAgentRegistry';
import { AgentExecutionRequest, AgentExecutionResult, AgentSelectionCriteria } from '../types/UnifiedAgentTypes';
export interface MasterOrchestrationRequest {
    id: string;
    type: 'single_agent' | 'multi_agent' | 'workflow' | 'federated';
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeout?: number;
    agentRequest?: AgentExecutionRequest;
    multiAgentRequest?: MultiAgentRequest;
    workflowRequest?: WorkflowExecutionRequest;
    federatedRequest?: FederatedExecutionRequest;
    context?: Record<string, any>;
    metadata?: {
        userId?: string;
        tenantId?: string;
        sessionId?: string;
        source?: string;
        tags?: string[];
    };
}
export interface MultiAgentRequest {
    tasks: Array<{
        id: string;
        agentCriteria: AgentSelectionCriteria;
        task: any;
        dependencies?: string[];
        timeout?: number;
    }>;
    coordination: 'sequential' | 'parallel' | 'dependency_graph' | 'handoff_chain';
    failureStrategy: 'fail_fast' | 'continue_on_error' | 'retry_failed';
    maxRetries?: number;
}
export interface WorkflowExecutionRequest {
    workflowId: string;
    parameters?: Record<string, any>;
    executionMode?: 'standard' | 'debug' | 'dry_run';
    agentOverrides?: Record<string, string>;
}
export interface FederatedExecutionRequest {
    targetSystems: string[];
    task: any;
    coordinationStrategy: 'broadcast' | 'primary_backup' | 'consensus';
    requireAllSuccess?: boolean;
}
export interface MasterOrchestrationResult {
    requestId: string;
    success: boolean;
    type: MasterOrchestrationRequest['type'];
    startTime: Date;
    endTime: Date;
    executionTime: number;
    agentResult?: AgentExecutionResult;
    multiAgentResult?: {
        tasksCompleted: number;
        tasksTotal: number;
        results: Array<{
            taskId: string;
            agentId: string;
            success: boolean;
            result?: any;
            error?: string;
        }>;
    };
    workflowResult?: {
        workflowId: string;
        executionId: string;
        nodesExecuted: number;
        nodesTotal: number;
        result?: any;
    };
    federatedResult?: {
        systemsResponded: number;
        systemsTotal: number;
        results: Array<{
            systemId: string;
            success: boolean;
            result?: any;
            error?: string;
        }>;
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metrics: {
        agentsInvolved: number;
        handoffsPerformed: number;
        resourcesUsed: Record<string, number>;
        costsIncurred?: number;
    };
}
export declare class MasterOrchestrator extends EventEmitter {
    private agentRegistry;
    private activeExecutions;
    private cliOrchestrator?;
    private syncOrchestrator?;
    private workflowEngine?;
    private handoffFlywheel?;
    private config;
    private metrics;
    constructor(agentRegistry: UnifiedAgentRegistry);
    /**
     * Initialize the master orchestrator with all subsystems
     */
    initialize(): Promise<void>;
    /**
     * Execute a master orchestration request
     */
    execute(request: MasterOrchestrationRequest): Promise<MasterOrchestrationResult>;
    /**
     * Execute workflow request
     */
    private executeWorkflow;
    /**
     * Execute federated request
     */
    private executeFederated;
    catch(error: any): void;
}
//# sourceMappingURL=MasterOrchestrator.d.ts.map