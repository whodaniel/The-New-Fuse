/**
 * @the-new-fuse/api-client
 * API client for The New Fuse
 *
 * This package provides a unified API client for interacting with The New Fuse backend services.
 * It includes authentication, workflow management, agent management, and user management services.
 */
export { ApiClient, type ApiClientOptions, type ApiResponse, type ApiError } from './client/ApiClient.js';
export { TokenStorage, type TokenStorage as TokenStorageInterface } from './auth/TokenStorage.js';
export { BaseService } from './services/BaseService.js';
export { type ApiConfig } from './config/ApiConfig.js';
export { AuthService, createAuthService, type AuthResponse, type UserData } from './services/auth.service.js';
export { WorkflowService, createWorkflowService, type Workflow, type WorkflowStep, type WorkflowExecution, type WorkflowStepExecution, type WorkflowCreateData, type WorkflowUpdateData, WorkflowExecutionStatus } from './services/workflow.service.js';
export { AgentService, createAgentService, type Agent, type AgentCapability, type AgentCreateData, type AgentUpdateData, type AgentExecutionResult, AgentStatus } from './services/agent.service.js';
export { UserService, createUserService, type User, type UserProfile, type UserUpdateData } from './services/user.service.js';
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
    tokenStorage?: import('./auth/TokenStorage.js').TokenStorage;
}): Promise<import("./client/ApiClient.js").ApiClient>;
//# sourceMappingURL=index.d.ts.map