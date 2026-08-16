export interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
  ownerId?: string;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
  messageCount?: number;
  unreadCount?: number;
}

export interface Agent {
  id: string;
  name: string;
  operationalHandle: string;
  platform: string;
  provider: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'away' | 'busy';
  daccRole: 'director' | 'orchestrator' | 'broker' | 'worker' | 'participant';
  tenantScope?: string;
  channelId?: string;
  lastActive?: string;
  metadata?: Record<string, any>;
}

export interface FederationMessage {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  payload: Record<string, any>;
  correlationId?: string;
  causationId?: string;
}

export interface GateDecision {
  gate: 'TENANT_SCOPE_GATE' | 'TRACE_CONTINUITY_GATE' | 'CHANNEL_MEMBERSHIP_GATE';
  allowed: boolean;
  reason?: string;
  timestamp: string;
}

export interface HeartbeatStatus {
  status: 'healthy' | 'degraded' | 'stale' | 'failed';
  lastHeartbeat?: string;
  agentId?: string;
  consecutiveMissed?: number;
  nextExpected?: string;
}

export interface BrowserPlatform {
  name: string;
  displayName: string;
  icon: string;
  urlPattern: RegExp;
  controlStrategy: 'claude' | 'chatgpt' | 'gemini' | 'perplexity' | 'qwen' | 'kimi' | 'generic';
  features: string[];
}
