/**
 * MCP Workflow Integration Interface
 *
 * Defines the interface for integrating MCP services with workflow execution systems.
 * Enables workflow steps to delegate tasks to MCP services and track execution status.
 */
/**
 * Task execution status
 */
export var TaskExecutionStatus;
(function (TaskExecutionStatus) {
    TaskExecutionStatus["PENDING"] = "pending";
    TaskExecutionStatus["RUNNING"] = "running";
    TaskExecutionStatus["COMPLETED"] = "completed";
    TaskExecutionStatus["FAILED"] = "failed";
    TaskExecutionStatus["CANCELLED"] = "cancelled";
    TaskExecutionStatus["TIMEOUT"] = "timeout";
})(TaskExecutionStatus || (TaskExecutionStatus = {}));
//# sourceMappingURL=IMCPWorkflowIntegration.js.map