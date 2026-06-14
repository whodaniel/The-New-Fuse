"use strict";
/**
 * Workflow Engine Types - The New Fuse
 *
 * This file is the single, authoritative source for all workflow-related data structures.
 * It integrates with the Drizzle database schema and the Master Agent Registry.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepType = exports.TriggerType = exports.WorkflowStepStatus = exports.WorkflowStatus = exports.TaskStatus = exports.TaskPriority = void 0;
// import { AgentType, TaskPriority, TaskStatus } from '@the-new-fuse/database';
// Define local types to replace database imports
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["FAILED"] = "FAILED";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
// ------------------- Core Workflow Enums -------------------
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "DRAFT";
    WorkflowStatus["ACTIVE"] = "ACTIVE";
    WorkflowStatus["PAUSED"] = "PAUSED";
    WorkflowStatus["ARCHIVED"] = "ARCHIVED";
    WorkflowStatus["DEPRECATED"] = "DEPRECATED";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var WorkflowStepStatus;
(function (WorkflowStepStatus) {
    WorkflowStepStatus["PENDING"] = "PENDING";
    WorkflowStepStatus["READY"] = "READY";
    WorkflowStepStatus["RUNNING"] = "RUNNING";
    WorkflowStepStatus["COMPLETED"] = "COMPLETED";
    WorkflowStepStatus["FAILED"] = "FAILED";
    WorkflowStepStatus["SKIPPED"] = "SKIPPED";
    WorkflowStepStatus["PAUSED"] = "PAUSED";
})(WorkflowStepStatus || (exports.WorkflowStepStatus = WorkflowStepStatus = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["MANUAL"] = "MANUAL";
    TriggerType["SCHEDULE"] = "SCHEDULE";
    TriggerType["WEBHOOK"] = "WEBHOOK";
    TriggerType["EVENT"] = "EVENT";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
var StepType;
(function (StepType) {
    StepType["TASK"] = "TASK";
    StepType["SUB_WORKFLOW"] = "SUB_WORKFLOW";
    StepType["CONDITION"] = "CONDITION";
    StepType["ITERATION"] = "ITERATION";
    StepType["START"] = "START";
    StepType["END"] = "END";
    StepType["A2A_HANDOFF"] = "A2A_HANDOFF";
    StepType["NOTIFICATION"] = "NOTIFICATION";
})(StepType || (exports.StepType = StepType = {}));
//# sourceMappingURL=WorkflowTypes.js.map