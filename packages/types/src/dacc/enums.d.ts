/**
 * DACC Protocol Enums
 */
/**
 * Stream event types for real-time communication
 */
export declare enum StreamEventType {
    THOUGHT = "thought",
    TOOL_CALL = "tool_call",
    TOOL_OUTPUT = "tool_output",
    LOG_MESSAGE = "log_message",
    TOKEN_STREAM = "token_stream",
    WORKFLOW_UPDATE = "workflow_update",
    FINAL_OUTPUT = "final_output"
}
/**
 * Parsing strategies for agent output
 */
export declare enum ParseStrategy {
    LARK = "lark",
    INSTRUCTOR = "instructor"
}
/**
 * Tool types for execution requests
 */
export declare enum ToolType {
    CODE_EXECUTOR = "code_executor",
    FIREBASE_FUNCTION = "firebase_function",
    MCP_COMMAND = "mcp_command"
}
/**
 * Code execution environments
 */
export declare enum ExecutionEnvironment {
    PYTHON3 = "python3",
    NODEJS = "nodejs",
    BASH = "bash"
}
/**
 * DACC workflow and agent status
 */
export declare enum DACCStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
//# sourceMappingURL=enums.d.ts.map