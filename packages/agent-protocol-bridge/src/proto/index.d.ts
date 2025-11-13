/**
 * Protocol Buffer Type Exports
 *
 * This file exports all generated protobuf types and services for the
 * TRAYCER-style agent communication system.
 *
 * Generated files are created by running: pnpm run build:proto
 * These files are automatically generated from .proto definitions
 * and should not be edited manually.
 */
declare let taskPb: any;
declare let rpcPb: any;
declare let promptPb: any;
declare let mcpPb: any;
export { taskPb, rpcPb, promptPb, mcpPb };
export declare const Task: any;
export declare const Step: any;
export declare const Status: any;
export declare const RpcRequest: any;
export declare const RpcResponse: any;
export declare const UserPrompt: any;
export declare const McpMessage: any;
export { Struct, Value, NullValue, ListValue } from 'google-protobuf/google/protobuf/struct_pb';
export { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
/**
 * Usage Documentation for Namespace Imports
 *
 * The recommended approach for importing generated protobuf modules is to use namespace imports
 * to avoid conflicts with package-based namespaces. Here's how to use them:
 *
 * @example
 * typescript
 * import * as taskPb from '@the-new-fuse/agent-protocol-bridge/proto';
 * import * as rpcPb from '@the-new-fuse/agent-protocol-bridge/proto';
 *
 * // Use the fully qualified namespace path:
 * type Task = taskPb.proto.the_new_fuse.agent_protocol.Task;
 * type Status = taskPb.proto.the_new_fuse.agent_protocol.Status;
 *
 * // Create instances using the namespace:
 * const task = new taskPb.proto.the_new_fuse.agent_protocol.Task();
 * task.setStatus(taskPb.proto.the_new_fuse.agent_protocol.Status.PENDING);
 *
 *
 * For convenience, you can also create local aliases:
 * @example`
 * `typescript
 * const { Task, Step, Status } = taskPb.proto.the_new_fuse.agent_protocol;
 *
 * const task = new Task();
 * task.setStatus(Status.PENDING);
 * `
 */
/**
 * Convenience type aliases for better TypeScript integration
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type AgentTaskData = {
    id: string;
    parentId?: string;
    agentId: string;
    title: string;
    description: string;
    parameters?: Record<string, any>;
    status: TaskStatus;
    steps?: AgentStepData[];
    createdAt?: Date;
    updatedAt?: Date;
};
export type AgentStepData = {
    id: string;
    taskId: string;
    title: string;
    description: string;
    parameters?: Record<string, any>;
    status: TaskStatus;
    result?: string;
    createdAt?: Date;
    updatedAt?: Date;
};
export type StructuredPromptData = {
    id: string;
    userId: string;
    text: string;
    context?: Record<string, any>;
    targetAgent?: string;
    workspace?: string;
    files?: string[];
};
/**
 * Type guards for runtime type checking
 */
export declare function isTaskStatus(value: string): value is TaskStatus;
export declare function isValidTaskData(obj: any): obj is AgentTaskData;
export declare function isValidStepData(obj: any): obj is AgentStepData;
export declare function isValidPromptData(obj: any): obj is StructuredPromptData;
//# sourceMappingURL=index.d.ts.map