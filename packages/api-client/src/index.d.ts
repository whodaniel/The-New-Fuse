/**
 * @the-new-fuse/api-client
 * API client for The New Fuse
 *
 * This package provides a unified API client for interacting with The New Fuse backend services.
 * It includes authentication, workflow management, agent management, and user management services.
 */
export { ApiClient, type ApiClientOptions, type ApiResponse, type ApiError } from './client/ApiClient';
export { TokenStorage, type TokenStorage as TokenStorageInterface } from './auth/TokenStorage';
export { BaseService } from './services/BaseService';
export { type ApiConfig } from './config/ApiConfig';
export { AuthService, createAuthService, type AuthResponse, type UserData } from './services/auth.service';
export { WorkflowService, createWorkflowService, type Workflow, type WorkflowStep, type WorkflowExecution, type WorkflowStepExecution, type WorkflowCreateData, type WorkflowUpdateData, WorkflowExecutionStatus } from './services/workflow.service';
export { AgentService, createAgentService, type Agent, type AgentCapability, type AgentCreateData, type AgentUpdateData, type AgentExecutionResult, AgentStatus } from './services/agent.service';
export { UserService, createUserService, type User, type UserProfile, type UserUpdateData } from './services/user.service';
/**
 * Create a new API client with the given configuration
 * @param config API client configuration
 * @returns API client instance
 *
 * @example
 * ```typescript
 * import { createApiClient } from '@the-new-fuse/api-client';
 *
 * const api = createApiClient({
 *   baseURL: 'https://api.example.com',
 *   timeout: 5000,
 * });
 * ```
 */
export declare function createApiClient(config: {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    options?: Record<string, any>;
    tokenStorage?: import('./auth/TokenStorage').TokenStorage;
}): Promise<import(".").ApiClient>;
