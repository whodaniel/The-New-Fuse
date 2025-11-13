export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "draft";
    WorkflowStatus["PUBLISHED"] = "published";
    WorkflowStatus["ACTIVE"] = "active";
    WorkflowStatus["ARCHIVED"] = "archived";
    WorkflowStatus["PAUSED"] = "paused";
    WorkflowStatus["COMPLETED"] = "completed";
    WorkflowStatus["FAILED"] = "failed";
    // Additional statuses for compatibility
    WorkflowStatus["RUNNING"] = "running";
    WorkflowStatus["CANCELLED"] = "cancelled";
    WorkflowStatus["STOPPED"] = "stopped";
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["IDLE"] = "idle";
})(WorkflowStatus || (WorkflowStatus = {}));
export var WorkflowStepType;
(function (WorkflowStepType) {
    WorkflowStepType["ACTION"] = "action";
    WorkflowStepType["CONDITION"] = "condition";
    WorkflowStepType["TRIGGER"] = "trigger";
    WorkflowStepType["WAIT"] = "wait";
    WorkflowStepType["SUB_WORKFLOW"] = "sub-workflow";
    WorkflowStepType["AGENT_TASK"] = "agent_task";
    WorkflowStepType["API_CALL"] = "api_call";
    WorkflowStepType["HUMAN_INPUT"] = "human_input";
    WorkflowStepType["TRANSFORMATION"] = "transformation";
    WorkflowStepType["LOOP"] = "loop";
})(WorkflowStepType || (WorkflowStepType = {}));
export var WorkflowExecutionStatus;
(function (WorkflowExecutionStatus) {
    WorkflowExecutionStatus["PENDING"] = "pending";
    WorkflowExecutionStatus["RUNNING"] = "running";
    WorkflowExecutionStatus["COMPLETED"] = "completed";
    WorkflowExecutionStatus["FAILED"] = "failed";
    WorkflowExecutionStatus["CANCELLED"] = "cancelled";
})(WorkflowExecutionStatus || (WorkflowExecutionStatus = {}));
//# sourceMappingURL=workflow.js.map