export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline',
}

export enum AgentCapability {
  CHAT = 'chat',
  WORKFLOW = 'workflow',
  RESEARCH = 'research',
  CODE = 'code',
  ANALYSIS = 'analysis',
  INTEGRATION = 'integration',
}

export type AgentMessageType = 'task' | 'notification' | 'command';

export interface AgentMessage {
  id: string;
  type: AgentMessageType;
  content: unknown;
  metadata?: Record<string, unknown>;
  timestamp: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface AgentErrorContext {
  messageId: string;
  messageType: AgentMessageType;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  contextWindow?: number;
  capabilities?: AgentCapability[];
  rateLimit?: {
    requests: number;
    window: number;
  };
  timeout?: number;
  retries?: number;
}

export interface AgentMetadata {
  version?: string;
  lastHeartbeat?: Date;
  performance?: {
    responseTime?: number;
    tokenUsage?: number;
    errorRate?: number;
  };
  usage?: {
    totalRequests?: number;
    totalTokens?: number;
    totalErrors?: number;
  };
  maintenance?: {
    lastRestart?: Date;
    lastUpdate?: Date;
    status?: string;
  };
}
