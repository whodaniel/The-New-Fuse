/**
 * DACC Protocol Enums
 */
/**
 * Stream event types for real-time communication
 */
export var StreamEventType;
(function (StreamEventType) {
    StreamEventType["THOUGHT"] = "thought";
    StreamEventType["TOOL_CALL"] = "tool_call";
    StreamEventType["TOOL_OUTPUT"] = "tool_output";
    StreamEventType["LOG_MESSAGE"] = "log_message";
    StreamEventType["TOKEN_STREAM"] = "token_stream";
    StreamEventType["WORKFLOW_UPDATE"] = "workflow_update";
    StreamEventType["FINAL_OUTPUT"] = "final_output";
})(StreamEventType || (StreamEventType = {}));
/**
 * Parsing strategies for agent output
 */
export var ParseStrategy;
(function (ParseStrategy) {
    ParseStrategy["LARK"] = "lark";
    ParseStrategy["INSTRUCTOR"] = "instructor";
})(ParseStrategy || (ParseStrategy = {}));
/**
 * Tool types for execution requests
 */
export var ToolType;
(function (ToolType) {
    ToolType["CODE_EXECUTOR"] = "code_executor";
    ToolType["FIREBASE_FUNCTION"] = "firebase_function";
    ToolType["MCP_COMMAND"] = "mcp_command";
})(ToolType || (ToolType = {}));
/**
 * Code execution environments
 */
export var ExecutionEnvironment;
(function (ExecutionEnvironment) {
    ExecutionEnvironment["PYTHON3"] = "python3";
    ExecutionEnvironment["NODEJS"] = "nodejs";
    ExecutionEnvironment["BASH"] = "bash";
})(ExecutionEnvironment || (ExecutionEnvironment = {}));
/**
 * DACC workflow and agent status
 */
export var DACCStatus;
(function (DACCStatus) {
    DACCStatus["PENDING"] = "pending";
    DACCStatus["RUNNING"] = "running";
    DACCStatus["COMPLETED"] = "completed";
    DACCStatus["FAILED"] = "failed";
    DACCStatus["CANCELLED"] = "cancelled";
})(DACCStatus || (DACCStatus = {}));
//# sourceMappingURL=enums.js.map