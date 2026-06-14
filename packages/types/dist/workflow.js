export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "DRAFT";
    WorkflowStatus["ACTIVE"] = "ACTIVE";
    WorkflowStatus["PAUSED"] = "PAUSED";
    WorkflowStatus["COMPLETED"] = "COMPLETED";
    WorkflowStatus["ERROR"] = "ERROR";
})(WorkflowStatus || (WorkflowStatus = {}));
export var WorkflowExecutionStatus;
(function (WorkflowExecutionStatus) {
    WorkflowExecutionStatus["PENDING"] = "PENDING";
    WorkflowExecutionStatus["RUNNING"] = "RUNNING";
    WorkflowExecutionStatus["COMPLETED"] = "COMPLETED";
    WorkflowExecutionStatus["FAILED"] = "FAILED";
    WorkflowExecutionStatus["CANCELLED"] = "CANCELLED";
})(WorkflowExecutionStatus || (WorkflowExecutionStatus = {}));
//# sourceMappingURL=workflow.js.map