export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "PENDING";
    WorkflowStatus["RUNNING"] = "RUNNING";
    WorkflowStatus["PAUSED"] = "PAUSED";
    WorkflowStatus["COMPLETED"] = "COMPLETED";
    WorkflowStatus["FAILED"] = "FAILED";
    WorkflowStatus["STOPPED"] = "STOPPED";
})(WorkflowStatus || (WorkflowStatus = {}));
export var WorkflowStepType;
(function (WorkflowStepType) {
    WorkflowStepType["TASK"] = "TASK";
    WorkflowStepType["CONDITION"] = "CONDITION";
})(WorkflowStepType || (WorkflowStepType = {}));
//# sourceMappingURL=index.js.map