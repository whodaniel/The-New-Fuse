/**
 * @the-new-fuse/api-client
 * API client for The New Fuse
 *
 * This package provides a unified API client for interacting with The New Fuse backend services.
 * It includes authentication, workflow management, agent management, and user management services.
 */
// Core client exports
export { ApiClient } from './client/ApiClient';
// Token storage exports
export { TokenStorage } from './auth/TokenStorage';
// Base service exports
export { BaseService } from './services/BaseService';
// Authentication service exports
export { AuthService, createAuthService } from './services/auth.service';
// Workflow service exports
export { WorkflowService, createWorkflowService, WorkflowExecutionStatus } from './services/workflow.service';
// Agent service exports
export { AgentService, createAgentService, AgentStatus } from './services/agent.service';
// User service exports
export { UserService, createUserService } from './services/user.service';
/**
 * Create a new API client with the given configuration
 * @param config API client configuration
 * @returns API client instance
 *
 * @example
 * `typescript
 * import { createApiClient } from '@the-new-fuse/api-client';
 *
 * const api = createApiClient({
 *   baseURL: 'https://api.example.com',
 *   timeout: 5000,
 * });
 * `
 */
export async function createApiClient(config) {
    const { baseURL, timeout, headers, options, tokenStorage } = config;
    const ApiClientModule = await import('./client/ApiClient');
    return new ApiClientModule.ApiClient({
        baseURL,
        timeout,
        headers,
        tokenStorage,
        ...options
    });
}
//# sourceMappingURL=index.js.map