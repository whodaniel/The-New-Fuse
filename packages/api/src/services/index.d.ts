/**
 * API services module
 */
import type { Agent, Workflow, WorkflowExecution } from '@the-new-fuse/types';
import { RedisService } from './redis.service';
import type { ApiResponse, PaginationParams, PaginatedResponse } from '../types/index';
/**
 * Base API service with common functionality
 */
export declare class BaseService {
    protected redisService?: RedisService;
    constructor(redisService?: RedisService);
    /**
     * Format a success response
     */
    protected formatSuccess<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T>;
    /**
     * Format an error response
     */
    protected formatError(error: Error | string): ApiResponse;
}
/**
 * Agent Service for managing agents
 */
export declare class AgentService extends BaseService {
    /**
     * Get all agents with pagination
     */
    getAgents(params?: PaginationParams): Promise<PaginatedResponse<Agent>>;
    /**
     * Get an agent by ID
     */
    getAgentById(_id: string): Promise<ApiResponse<Agent | null>>;
}
/**
 * Workflow Service for managing workflows
 */
export declare class WorkflowService extends BaseService {
    /**
     * Get all workflows with pagination
     */
    getWorkflows(params?: PaginationParams): Promise<PaginatedResponse<Workflow>>;
    /**
     * Get a workflow execution by ID
     */
    getWorkflowExecutionById(_id: string): Promise<ApiResponse<WorkflowExecution | null>>;
}
/**
 * API Services Factory
 */
export declare function createServices(redisService?: RedisService): {
    agentService: AgentService;
    workflowService: WorkflowService;
};
//# sourceMappingURL=index.d.ts.map