import type * as PrismaTypes from '../generated/prisma';
export declare const TaskStatus: {
    PENDING: "PENDING";
    IN_PROGRESS: "IN_PROGRESS";
    COMPLETED: "COMPLETED";
    FAILED: "FAILED";
    CANCELLED: "CANCELLED";
};
export declare const TaskPriority: {
    LOW: "LOW";
    MEDIUM: "MEDIUM";
    HIGH: "HIGH";
    URGENT: "URGENT";
};
export declare const AgentStatus: {
    ACTIVE: "ACTIVE";
    INACTIVE: "INACTIVE";
    IDLE: "IDLE";
    BUSY: "BUSY";
    ERROR: "ERROR";
    OFFLINE: "OFFLINE";
    INITIALIZING: "INITIALIZING";
    READY: "READY";
    TERMINATED: "TERMINATED";
};
export declare const AgentType: {
    BASIC: "BASIC";
    CHAT: "CHAT";
    WORKFLOW: "WORKFLOW";
    TASK: "TASK";
    ASSISTANT: "ASSISTANT";
    ANALYSIS: "ANALYSIS";
    CONVERSATIONAL: "CONVERSATIONAL";
    IDE_EXTENSION: "IDE_EXTENSION";
    API: "API";
};
export declare const UserRole: {
    USER: "USER";
    ADMIN: "ADMIN";
    SUPER_ADMIN: "SUPER_ADMIN";
    AGENCY_OWNER: "AGENCY_OWNER";
    AGENCY_ADMIN: "AGENCY_ADMIN";
    AGENCY_MANAGER: "AGENCY_MANAGER";
    AGENT_OPERATOR: "AGENT_OPERATOR";
};
export declare const WorkflowStatus: {
    DRAFT: "DRAFT";
    PUBLISHED: "PUBLISHED";
    ARCHIVED: "ARCHIVED";
    ACTIVE: "ACTIVE";
    PAUSED: "PAUSED";
    COMPLETED: "COMPLETED";
    FAILED: "FAILED";
};
export declare const WorkflowExecutionStatus: {
    PENDING: "PENDING";
    RUNNING: "RUNNING";
    COMPLETED: "COMPLETED";
    FAILED: "FAILED";
    CANCELLED: "CANCELLED";
};
export declare const PrismaClient: typeof PrismaTypes.PrismaClient;
export { Prisma } from '../generated/prisma';
export type Agent = PrismaTypes.Agent;
export type Task = PrismaTypes.Task;
export type User = PrismaTypes.User;
export type Workflow = PrismaTypes.Workflow;
export type WorkflowExecution = PrismaTypes.WorkflowExecution;
export type TaskStatus = PrismaTypes.TaskStatus;
export type TaskPriority = PrismaTypes.TaskPriority;
export type AgentStatus = PrismaTypes.AgentStatus;
export type AgentType = PrismaTypes.AgentType;
export type UserRole = PrismaTypes.UserRole;
export type WorkflowStatus = PrismaTypes.WorkflowStatus;
export type WorkflowExecutionStatus = PrismaTypes.WorkflowExecutionStatus;
//# sourceMappingURL=types.d.ts.map