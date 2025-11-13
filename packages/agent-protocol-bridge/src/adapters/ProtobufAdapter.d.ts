/**
 * ProtobufAdapter.ts
 *
 * Handles conversion between internal data structures and Protocol Buffer messages
 * for TRAYCER-style agent communication.
 */
export interface AgentTask {
    id: string;
    parentId?: string;
    agentId: string;
    title: string;
    description: string;
    parameters?: Record<string, any>;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    steps?: AgentStep[];
    createdAt?: Date;
    updatedAt?: Date;
}
export interface AgentStep {
    id: string;
    taskId: string;
    title: string;
    description: string;
    parameters?: Record<string, any>;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    result?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface StructuredPrompt {
    id: string;
    userId: string;
    text: string;
    context?: Record<string, any>;
    targetAgent?: string;
    workspace?: string;
    files?: string[];
}
export declare class ProtobufAdapter {
    private readonly Task;
    private readonly Step;
    private readonly Status;
    private readonly RpcRequest;
    private readonly RpcResponse;
    private readonly UserPrompt;
    private readonly McpMessage;
    /**
     * Convert internal AgentTask to Protocol Buffer Task
     */
    taskToProtobuf(task: AgentTask): InstanceType<typeof this.Task>;
    /**
     * Convert internal AgentStep to Protocol Buffer Step
     */
    stepToProtobuf(step: AgentStep): InstanceType<typeof this.Step>;
    /**
     * Convert Protocol Buffer Step to internal AgentStep
     */
    stepFromProtobuf(pbStep: InstanceType<typeof this.Step>): AgentStep;
    /**
     * Convert StructuredPrompt to Protocol Buffer UserPrompt
     */
    promptToProtobuf(prompt: StructuredPrompt): InstanceType<typeof this.UserPrompt>;
    /**
     * Convert Protocol Buffer UserPrompt to StructuredPrompt
     */
    promptFromProtobuf(pbPrompt: InstanceType<typeof this.UserPrompt>): StructuredPrompt;
    /**
     * Create RPC request message
     */
    createRpcRequest(id: string, method: string, parameters?: Record<string, any>): InstanceType<typeof this.RpcRequest>;
    /**
     * Create MCP message for Model Context Protocol communication
     */
    createMcpMessage(id: string, role: string, content: string, metadata?: Record<string, any>): InstanceType<typeof this.McpMessage>;
    /**
     * Helper: Convert status enum to protobuf
     */
    private statusToProtobuf;
    /**
     * Helper: Convert protobuf status to string
     */
    private statusFromProtobuf;
}
//# sourceMappingURL=ProtobufAdapter.d.ts.map