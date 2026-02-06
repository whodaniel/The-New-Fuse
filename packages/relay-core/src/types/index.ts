/**
 * Core types for The New Fuse Relay System
 */

export interface RelayConfig {
  id: string;
  version: string;
  ports: {
    http: number;
    websocket: number;
    proxy?: number;
    ui?: number;
    grpc?: number;
  };
  transports: {
    websocket: boolean;
    http: boolean;
    file: boolean;
    mcp: boolean;
    redis?: boolean;
    grpc?: boolean;
  };
  interceptRules: Map<string, InterceptRule>;
  workspaceDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  redis?: {
    host: string;
    port: number;
    database: number;
    password?: string;
  };
}

export interface InterceptRule {
  action: 'intercept_and_route' | 'log_only' | 'block';
  description: string;
  enabled: boolean;
  target: string;
}

export interface Agent {
  id: string;
  type: string;
  capabilities: string[];
  registeredAt: string;
  lastSeen: string;
  status: 'connected' | 'disconnected' | 'idle';
  metadata?: Record<string, any>;
}

export interface RelayMessage {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Transport {
  name: string;
  start(): Promise<boolean>;
  stop(): Promise<void>;
  send(message: RelayMessage): Promise<boolean>;
  onMessage(handler: (message: RelayMessage) => void): void;
  isConnected(): boolean;
}

export interface SystemStatus {
  startTime: string;
  isRunning: boolean;
  activeConnections: number;
  interceptCount: number;
  messageCount: number;
  agents: number;
  uptime: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  steps: WorkflowStep[];
  context: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  type: string;
  agentId?: string;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export type ProtocolType =
  | 'a2a-v1.0'
  | 'a2a-v2.0'
  | 'mcp-v1.0'
  | 'anthropic-xml-v1.0'
  | 'openai-assistant-v1.0'
  | 'langchain-v1.0'
  | 'crewai-v1.0'
  | 'pydantic-v1.0'
  | 'websocket'
  | 'http'
  | 'file';

export interface ProtocolAdapter {
  name: string;
  version: string;
  supportedProtocols: ProtocolType[];
  canTranslate(from: ProtocolType, to: ProtocolType): boolean;
  translate(message: any, from: ProtocolType, to: ProtocolType): Promise<any>;
}
