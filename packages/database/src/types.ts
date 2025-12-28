// Re-export all Prisma types and enums
import type * as PrismaTypes from '../generated/prisma';
import {
  AgentStatus as _AgentStatus,
  AgentType as _AgentType,
  PrismaClient as _PrismaClient,
  TaskPriority as _TaskPriority,
  TaskStatus as _TaskStatus,
  UserRole as _UserRole,
  WorkflowExecutionStatus as _WorkflowExecutionStatus,
  WorkflowStatus as _WorkflowStatus,
} from '../generated/prisma';

// Export enums as values
export const TaskStatus = _TaskStatus;
export const TaskPriority = _TaskPriority;
export const AgentStatus = _AgentStatus;
export const AgentType = _AgentType;
export const UserRole = _UserRole;
export const WorkflowStatus = _WorkflowStatus;
export const WorkflowExecutionStatus = _WorkflowExecutionStatus;
export const PrismaClient = _PrismaClient;

// Export PrismaClient as a type for type annotations
export type PrismaClient = _PrismaClient;

// Export Prisma both as value and namespace
export { Prisma } from '../generated/prisma';

// Export model types
export type Agent = PrismaTypes.Agent;
export type Task = PrismaTypes.Task;
export type User = PrismaTypes.User;
export type Workflow = PrismaTypes.Workflow;
export type WorkflowExecution = PrismaTypes.WorkflowExecution;

// Export enum types (for use in type annotations)
export type TaskStatus = PrismaTypes.TaskStatus;
export type TaskPriority = PrismaTypes.TaskPriority;
export type AgentStatus = PrismaTypes.AgentStatus;
export type AgentType = PrismaTypes.AgentType;
export type UserRole = PrismaTypes.UserRole;
export type WorkflowStatus = PrismaTypes.WorkflowStatus;
export type WorkflowExecutionStatus = PrismaTypes.WorkflowExecutionStatus;
