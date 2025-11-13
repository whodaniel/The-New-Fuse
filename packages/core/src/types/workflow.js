/**
 * @fileoverview Workflow system type definitions
 */
export var WorkflowStepType;
(function (WorkflowStepType) {
    WorkflowStepType["TASK"] = "TASK";
    WorkflowStepType["DECISION"] = "DECISION";
    WorkflowStepType["PARALLEL"] = "PARALLEL";
    WorkflowStepType["LOOP"] = "LOOP";
    WorkflowStepType["WAIT"] = "WAIT";
    WorkflowStepType["WEBHOOK"] = "WEBHOOK";
    WorkflowStepType["SCRIPT"] = "SCRIPT";
    WorkflowStepType["HUMAN_INPUT"] = "HUMAN_INPUT";
})(WorkflowStepType || (WorkflowStepType = {}));
export var WorkflowExecutionStatus;
(function (WorkflowExecutionStatus) {
    WorkflowExecutionStatus["PENDING"] = "PENDING";
    WorkflowExecutionStatus["RUNNING"] = "RUNNING";
    WorkflowExecutionStatus["COMPLETED"] = "COMPLETED";
    WorkflowExecutionStatus["FAILED"] = "FAILED";
    WorkflowExecutionStatus["CANCELLED"] = "CANCELLED";
    WorkflowExecutionStatus["PAUSED"] = "PAUSED";
})(WorkflowExecutionStatus || (WorkflowExecutionStatus = {}));
export var WorkflowTriggerType;
(function (WorkflowTriggerType) {
    WorkflowTriggerType["MANUAL"] = "MANUAL";
    WorkflowTriggerType["SCHEDULE"] = "SCHEDULE";
    WorkflowTriggerType["EVENT"] = "EVENT";
    WorkflowTriggerType["WEBHOOK"] = "WEBHOOK";
    WorkflowTriggerType["FILE_CHANGE"] = "FILE_CHANGE";
    WorkflowTriggerType["API_CALL"] = "API_CALL";
})(WorkflowTriggerType || (WorkflowTriggerType = {}));
//# sourceMappingURL=workflow.js.map