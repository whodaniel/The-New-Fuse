/**
 * @the-new-fuse/api-client
 * API client for The New Fuse
 *
 * This package provides a unified API client for interacting with The New Fuse backend services.
 * It includes authentication, workflow management, agent management, and user management services.
 */

// Core client exports — the synchronous ApiClient that owns token handling
// (Authorization header injection, auto-refresh via `refreshToken`, and
// `onUnauthorized` handling). Services extend BaseService against the same
// HTTP surface (get/post/put/patch/delete).
export {
  ApiClient,
  createApiClient,
  type ApiClientConfig,
  type ApiResponse,
} from './api-client.js';
// Shared error type from the client lineage
export type { ApiError } from './client/ApiClient.js';

// Token storage exports
export { TokenStorage, type TokenStorage as TokenStorageInterface } from './auth/TokenStorage.js';

// Base service exports
export { BaseService } from './services/BaseService.js';

// Configuration exports
export { type ApiConfig } from './config/ApiConfig.js';

// Authentication service exports
export {
  AuthService,
  createAuthService,
  type AuthResponse,
  type UserData,
} from './services/auth.service.js';

// Workflow service exports
export {
  WorkflowExecutionStatus,
  WorkflowService,
  createWorkflowService,
  type Workflow,
  type WorkflowCreateData,
  type WorkflowExecution,
  type WorkflowStep,
  type WorkflowStepExecution,
  type WorkflowUpdateData,
} from './services/workflow.service.js';

// Agent service exports
export {
  AgentService,
  AgentStatus,
  createAgentService,
  type Agent,
  type AgentCapability,
  type AgentCreateData,
  type AgentExecutionResult,
  type AgentUpdateData,
} from './services/agent.service.js';

// User service exports
export {
  UserService,
  createUserService,
  type User,
  type UserProfile,
  type UserUpdateData,
} from './services/user.service.js';

// Backup service exports
export {
  BackupService,
  createBackupService,
  type BackupConfig,
  type BackupResult,
  type BackupSnapshot,
  type StorageInventory,
  type StorageItem,
} from './services/BackupService.js';

/**
 * `createApiClient` is re-exported above from `./api-client.js` — a
 * synchronous factory that returns the client directly (no dynamic import),
 * so `useApi`-style consumers can create it inside `useMemo` and call
 * `api.get(...)` immediately.
 */
