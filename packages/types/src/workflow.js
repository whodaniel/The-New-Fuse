"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutionStatus = exports.WorkflowStatus = void 0;
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "DRAFT";
    WorkflowStatus["ACTIVE"] = "ACTIVE";
    WorkflowStatus["PAUSED"] = "PAUSED";
    WorkflowStatus["COMPLETED"] = "COMPLETED";
    WorkflowStatus["ERROR"] = "ERROR";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var WorkflowExecutionStatus;
(function (WorkflowExecutionStatus) {
    WorkflowExecutionStatus["PENDING"] = "PENDING";
    WorkflowExecutionStatus["RUNNING"] = "RUNNING";
    WorkflowExecutionStatus["COMPLETED"] = "COMPLETED";
    WorkflowExecutionStatus["FAILED"] = "FAILED";
    WorkflowExecutionStatus["CANCELLED"] = "CANCELLED";
})(WorkflowExecutionStatus || (exports.WorkflowExecutionStatus = WorkflowExecutionStatus = {}));
