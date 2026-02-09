/**
 * TypeScript Type Definitions Index
 * Central export point for all type definitions
 */

// Core common types
export * from './common';

// Domain-specific types
export * from './api';
export * from './react';
export * from './database';

// Re-export commonly used individual types for convenience
export type {
  ID,
  Timestamp,
  JSONValue,
  ApiResponse,
  ApiError,
  User,
  Workspace,
  Agent,
  Workflow,
  Task,
  ValidationResult,
  ComponentState,
  DatabaseEntity
} from './common';

// Utility types for easier importing
export type {
  ExpressRequest,
  ExpressResponse,
  PrismaClient,
  DatabaseQuery,
  DatabaseResult,
  WorkflowDefinition,
  AgentExecution,
  WorkflowExecution,
  ReactComponentProps
} from './api';

// Development utilities
export type {
  MockService,
  TestFixture,
  AsyncAction
} from './common';