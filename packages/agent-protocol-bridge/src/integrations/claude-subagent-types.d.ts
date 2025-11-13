/**
 * Anthropic Claude Sub-Agent Protocol Types
 *
 * Comprehensive type definitions for Claude Sub-Agent orchestration,
 * delegation, terminal integration, and task management within
 * The New Fuse AI Agent framework.
 */
export interface ClaudeSubAgent {
    id: string;
    agentId: string;
    name: string;
    model: string;
    systemPrompt: string;
    status: ClaudeSubAgentStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface ClaudeTask {
    id: string;
    subAgentId: string;
    goal: string;
    status: ClaudeTaskStatus;
    result?: string;
    error?: string;
    conversation: ClaudeMessage[];
    toolCalls: ClaudeToolCall[];
    terminalSessions: ClaudeTerminalSession[];
    createdAt: Date;
    completedAt?: Date;
}
export interface ClaudeMessage {
    id: string;
    role: 'user' | 'assistant';
    content: (ClaudeTextBlock | ClaudeToolUseBlock)[];
    timestamp: Date;
}
export interface ClaudeTextBlock {
    type: 'text';
    text: string;
}
export interface ClaudeToolUseBlock {
    type: 'tool_use';
    id: string;
    name: string;
    input: any;
}
export interface ClaudeToolCall {
    id: string;
    toolUseId: string;
    toolName: string;
    input: any;
    output?: any;
    status: 'pending' | 'success' | 'error';
    timestamp: Date;
}
export interface ClaudeTerminalSession {
    id: string;
    taskId: string;
    status: 'active' | 'closed' | 'error';
    history: ClaudeTerminalInteraction[];
    createdAt: Date;
    closedAt?: Date;
}
export interface ClaudeTerminalInteraction {
    id: string;
    type: 'command' | 'output' | 'error' | 'input_request';
    content: string;
    timestamp: Date;
}
export declare enum ClaudeSubAgentStatus {
    IDLE = "IDLE",
    THINKING = "THINKING",
    EXECUTING_TOOL = "EXECUTING_TOOL",
    AWAITING_USER_INPUT = "AWAITING_USER_INPUT",
    ACTIVE = "ACTIVE",
    DISABLED = "DISABLED",
    ERROR = "ERROR"
}
export declare enum ClaudeTaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
}
export interface ClaudeSubAgentBridge {
    createSubAgent(config: Omit<ClaudeSubAgent, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ClaudeSubAgent>;
    delegateTask(subAgentId: string, task: Omit<ClaudeTask, 'id' | 'subAgentId' | 'status' | 'createdAt' | 'conversation' | 'toolCalls' | 'terminalSessions'>): Promise<ClaudeTask>;
    getTaskStatus(taskId: string): Promise<{
        status: ClaudeTaskStatus;
        history: ClaudeMessage[];
    }>;
    provideToolOutput(taskId: string, toolCallId: string, output: any): Promise<void>;
    sendTerminalCommand(sessionId: string, command: string): Promise<ClaudeTerminalInteraction>;
    provideTerminalInput(sessionId: string, input: string): Promise<void>;
}
export interface ClaudeBridgeConfig {
    apiKey: string;
    defaultModel?: string;
    maxTokens?: number;
    enableTerminalIntegration?: boolean;
}
//# sourceMappingURL=claude-subagent-types.d.ts.map