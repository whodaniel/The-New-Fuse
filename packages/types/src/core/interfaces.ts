/**
 * Core interface definitions for The New Fuse
 */

// Import enums to avoid duplication
import { TaskStatus } from './enums.js';
import { AgentCapability, AgentRole, AgentStatus } from '../agent-types.d.js';

// Re-export required enums to maintain backward compatibility
export { TaskStatus, AgentCapability, AgentRole, AgentStatus };

/**
 * Agent interface representing an AI agent in the system
 */
export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  role?: string;
  capabilities: string[];
  metadata: Record<string, unknown>;
  userId?: string;
  deletedAt?: Date | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Workflow interface for defining series of operations
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: string;
  steps: WorkflowStep[];
  metadata?: Record<string, unknown>;
  deletedAt?: Date | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Workflow step interface
 */
export interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  connections: Array<{
    stepId: string;
    inputName?: string;
    outputName?: string;
  }>;
  order?: number;
  status?: string;
  result?: Record<string, unknown>;
}

/**
 * Workflow execution interface tracking the execution of a workflow
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date | null;
  result?: unknown;
  error?: string | null;
  stepResults: Record<string, unknown>;
  deletedAt?: Date | null;
  createdAt: string;
  updatedAt: string;
}