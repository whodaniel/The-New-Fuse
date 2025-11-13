/**
 * MCP Tool type definitions
 */
/**
 * Tool type enumeration
 */
export var ToolType;
(function (ToolType) {
    ToolType["FUNCTION"] = "function";
    ToolType["SCRIPT"] = "script";
    ToolType["API_CALL"] = "api_call";
    ToolType["DATABASE_QUERY"] = "database_query";
    ToolType["FILE_OPERATION"] = "file_operation";
    ToolType["CUSTOM"] = "custom";
})(ToolType || (ToolType = {}));
/**
 * Tool execution status enumeration
 */
export var ToolExecutionStatus;
(function (ToolExecutionStatus) {
    ToolExecutionStatus["PENDING"] = "pending";
    ToolExecutionStatus["RUNNING"] = "running";
    ToolExecutionStatus["COMPLETED"] = "completed";
    ToolExecutionStatus["FAILED"] = "failed";
    ToolExecutionStatus["CANCELLED"] = "cancelled";
    ToolExecutionStatus["TIMEOUT"] = "timeout";
})(ToolExecutionStatus || (ToolExecutionStatus = {}));
//# sourceMappingURL=tool.js.map