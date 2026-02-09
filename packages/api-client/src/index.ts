/**
 * @the-new-fuse/api-client
 * API client for The New Fuse
 *
 * This package provides a unified API client for interacting with The New Fuse backend services.
 * It includes authentication, workflow management, agent management, and user management services.
 */

// Core client exports
export {
  ApiClient,
  type ApiClientOptions,
  type ApiResponse,
  type ApiError
} from './client/ApiClient';

// Token storage exports
export {
  TokenStorage,
  type TokenStorage as TokenStorageInterface
} from './auth/TokenStorage';

// Base service exports
export {
  BaseService
} from './services/BaseService';

// Configuration exports
export {
  type ApiConfig
} from './config/ApiConfig';

// Authentication service exports
export {
  AuthService,
  createAuthService,
  type AuthResponse,
  type UserData
} from './services/auth.service';

// Workflow service exports
export {
  WorkflowService,
  createWorkflowService,
  type Workflow,
  type WorkflowStep,
  type WorkflowExecution,
  type WorkflowStepExecution,
  type WorkflowCreateData,
  type WorkflowUpdateData,
  WorkflowExecutionStatus
} from './services/workflow.service';

// Agent service exports
export {
  AgentService,
  createAgentService,
  type Agent,
  type AgentCapability,
  type AgentCreateData,
  type AgentUpdateData,
  type AgentExecutionResult,
  AgentStatus
} from './services/agent.service';

// User service exports
export {
  UserService,
  createUserService,
  type User,
  type UserProfile,
  type UserUpdateData
} from './services/user.service';

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
export async function createApiClient(config: {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  options?: Record<string, any>;
  tokenStorage?: import('./auth/TokenStorage').TokenStorage;
}) {
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
