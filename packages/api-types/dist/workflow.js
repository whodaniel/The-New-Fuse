export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "draft";
    WorkflowStatus["ACTIVE"] = "active";
    WorkflowStatus["ARCHIVED"] = "archived";
    WorkflowStatus["RUNNING"] = "running";
    WorkflowStatus["COMPLETED"] = "completed";
    WorkflowStatus["FAILED"] = "failed";
    WorkflowStatus["CANCELLED"] = "cancelled";
    WorkflowStatus["PAUSED"] = "paused";
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
//# sourceMappingURL=workflow.js.map