export type OrchestratorChannel = 'telegram';

export interface SystemHealthMetrics {
  totalAgents: number;
  activeAgents: number;
  stalledAgents: number;
  failedAgents: number;
}

export interface RegisterAgentRequest {
  agentId: string;
  agentName?: string;
  agentType?: string;
  expectedResponseTimeMs?: number;
  capabilities?: string[];
}

export interface RegisterAgentResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface AgentHeartbeatRequest {
  agentId: string;
  taskId?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentActivityRequest {
  agentId: string;
  activityType: string;
  metadata?: Record<string, unknown>;
}

export interface GatewayExecuteRequest {
  channel: OrchestratorChannel;
  requestId: string;
  idempotencyKey?: string;
  sessionId?: string;
  update: {
    message?: {
      text?: string;
      from?: { id?: string | number };
    };
  };
}

export interface GatewayExecuteResponse {
  ok: boolean;
  requestId: string;
  replyText: string;
  metadata?: Record<string, unknown>;
}

export interface AgentStatus {
  agentId: string;
  status: string;
  lastHeartbeat: string;
  lastActivity: string;
  currentTask?: string;
  consecutiveFailures: number;
}

export interface AgentListResponse {
  agents: AgentStatus[];
  count: number;
  message?: string;
}

export interface AgentStatusResponse extends Partial<AgentStatus> {
  error?: string;
}

export interface OrchestratorHealthResponse {
  status: 'operational';
  timestamp: string;
  metrics: SystemHealthMetrics;
}

export interface TnfStatusResponse {
  identity: string;
  description: string;
  status: string;
  lastHeartbeat?: string;
  systemHealth: SystemHealthMetrics | null;
  capabilities: string[];
  timestamp: string;
}
