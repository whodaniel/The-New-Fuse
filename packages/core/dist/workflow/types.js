/**
 * Workflow Types
 * Core types for workflow definition and execution
 */
export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["RUNNING"] = "running";
    WorkflowStatus["COMPLETED"] = "completed";
    WorkflowStatus["FAILED"] = "failed";
    WorkflowStatus["CANCELLED"] = "cancelled";
    WorkflowStatus["PAUSED"] = "paused";
    WorkflowStatus["STOPPED"] = "stopped";
    WorkflowStatus["DRAFT"] = "draft";
})(WorkflowStatus || (WorkflowStatus = {}));
export var WorkflowStepType;
(function (WorkflowStepType) {
    WorkflowStepType["API_CALL"] = "API_CALL";
    WorkflowStepType["DATA_TRANSFORM"] = "DATA_TRANSFORM";
    WorkflowStepType["CONDITION"] = "CONDITION";
    WorkflowStepType["LOOP"] = "LOOP";
    WorkflowStepType["AGENT"] = "AGENT";
    WorkflowStepType["TASK"] = "TASK";
    WorkflowStepType["PARALLEL"] = "PARALLEL";
    WorkflowStepType["SEQUENCE"] = "SEQUENCE";
    WorkflowStepType["SUB_WORKFLOW"] = "SUB_WORKFLOW";
})(WorkflowStepType || (WorkflowStepType = {}));
export var WorkflowCategory;
(function (WorkflowCategory) {
    WorkflowCategory["ACCESSIBILITY"] = "ACCESSIBILITY";
    WorkflowCategory["I18N"] = "I18N";
    WorkflowCategory["SECURITY"] = "SECURITY";
    WorkflowCategory["PERFORMANCE"] = "PERFORMANCE";
    WorkflowCategory["DOCUMENTATION"] = "DOCUMENTATION";
})(WorkflowCategory || (WorkflowCategory = {}));
//# sourceMappingURL=types.js.map