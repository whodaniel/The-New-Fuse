/**
 * Bridges module exports
 * Provides communication bridges between different agent systems
 */

import { EventEmitter } from 'events';

export enum MessageType {
  COMMAND = 'command',
  RESPONSE = 'response',
  ERROR = 'error',
  EVENT = 'event',
  NOTIFICATION = 'notification',
  REQUEST = 'request',
  STATUS = 'status',
  LOG = 'log',
  METRIC = 'metric',
  ALERT = 'alert',
  HEARTBEAT = 'heartbeat',
  INFO = 'info',
  WARNING = 'warning',
  TEXT = 'text',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export abstract class BaseBridge extends EventEmitter {
  protected name: string;
  protected isConnected: boolean = false;

  constructor(name: string) {
    super();
    this.name = name;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType,
    priority?: Priority
  ): Promise<void>;

  get connected(): boolean {
    return this.isConnected;
  }

  get bridgeName(): string {
    return this.name;
  }
}

// Export cline bridge
export * from './cline_bridge';

// Export types (primary source)
export * from './types';

// Core bridges
export * from './cascade_bridge';
export * from './redis_bridge';
export * from './universal_bridge';
export * from './vscode_bridge';

// Protocol bridge - explicit exports (it has MCPTool, MCPResource, MCPPrompt)
export {
  A2AProtocolHandler,
  MCPProtocolHandler,
  ProtocolBridge,
  TNFProtocolHandler,
} from './protocol_bridge';
export type {
  A2AMessage,
  MCPMessage,
  MCPPrompt,
  MCPResource,
  MCPTool,
  ProtocolBridgeConfig,
  ProtocolMessage,
  TNFMessage,
} from './protocol_bridge';

// MCP bridge - explicit exports (avoid MCP type duplicates with protocol_bridge)
export { MCPBridge } from './mcp_bridge';
export type {
  MCPBridgeConfig,
  MCPPromptMessage,
  MCPResourceContent,
  MCPServerInfo,
  MCPToolCall,
  MCPToolResult,
} from './mcp_bridge';

// Electron bridge
export * from './electron_bridge';

// Base bridge - explicit exports to avoid BridgeMessage/BridgeConfig duplicates
export { Bridge as ExtendedBridge } from './base';
export type { BridgeStats, BridgeConfig as ExtendedBridgeConfig } from './base';

// Other infrastructure bridges
export * from './agent_sync_bridge';
export * from './bridge_adapter';
export * from './communication';
export * from './enhanced_communication';
export * from './monitor_bridge';
export * from './monitor_communication';
export * from './system_bridge';
