export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "PENDING";
    WorkflowStatus["RUNNING"] = "RUNNING";
    WorkflowStatus["PAUSED"] = "PAUSED";
    WorkflowStatus["COMPLETED"] = "COMPLETED";
    WorkflowStatus["FAILED"] = "FAILED";
    WorkflowStatus["CANCELLED"] = "CANCELLED";
    WorkflowStatus["STOPPED"] = "STOPPED";
})(WorkflowStatus || (WorkflowStatus = {}));
export var WorkflowStepType;
(function (WorkflowStepType) {
    WorkflowStepType["API_CALL"] = "API_CALL";
    WorkflowStepType["DATA_TRANSFORM"] = "DATA_TRANSFORM";
    WorkflowStepType["CONDITION"] = "CONDITION";
    WorkflowStepType["LOOP"] = "LOOP";
    WorkflowStepType["AGENT"] = "AGENT";
    WorkflowStepType["TASK"] = "TASK";
})(WorkflowStepType || (WorkflowStepType = {}));
//# sourceMappingURL=types.js.map