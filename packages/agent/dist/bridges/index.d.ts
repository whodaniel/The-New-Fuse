/**
 * Bridges module exports
 * Provides communication bridges between different agent systems
 */
import { EventEmitter } from 'events';
export declare enum MessageType {
    COMMAND = "command",
    RESPONSE = "response",
    ERROR = "error",
    EVENT = "event",
    NOTIFICATION = "notification",
    REQUEST = "request",
    STATUS = "status",
    LOG = "log",
    METRIC = "metric",
    ALERT = "alert",
    HEARTBEAT = "heartbeat",
    INFO = "info",
    WARNING = "warning",
    TEXT = "text"
}
export declare enum Priority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare abstract class BaseBridge extends EventEmitter {
    protected name: string;
    protected isConnected: boolean;
    constructor(name: string);
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract sendMessage(message: Record<string, unknown>, messageType: MessageType, priority?: Priority): Promise<void>;
    get connected(): boolean;
    get bridgeName(): string;
}
export * from './cline_bridge.js';
export * from './types/index.js';
export * from './cascade_bridge.js';
export * from './redis_bridge.js';
export * from './universal_bridge.js';
export * from './vscode_bridge.js';
export { ProtocolBridge } from './protocol_bridge.js';
export type { A2AMessage, MCPPrompt, MCPResource, MCPTool, ProtocolBridgeConfig, } from './protocol_bridge.js';
export { MCPBridge } from './mcp_bridge.js';
export type { MCPBridgeConfig, MCPPromptMessage, MCPResourceContent, MCPServerInfo, MCPToolCall, MCPToolResult, } from './mcp_bridge.js';
export * from './electron_bridge.js';
export { Bridge as ExtendedBridge } from './base.js';
export type { BridgeStats, BridgeConfig as ExtendedBridgeConfig } from './base.js';
export * from './agent_sync_bridge.js';
export * from './bridge_adapter.js';
export * from './communication.js';
export * from './enhanced_communication.js';
export * from './monitor_bridge.js';
export * from './monitor_communication.js';
export * from './system_bridge.js';
//# sourceMappingURL=index.d.ts.map