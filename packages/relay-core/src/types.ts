import type { TnfAgentLifecycleStatus } from './contracts/lifecycle.js';

export interface Agent {
  id: string;
  canonicalEntityId?: string | null;
  operationalHandle: string;
  runtimeSessionId?: string | null;
  aliases: string[];
  name: string;
  platform: string;
  status: TnfAgentLifecycleStatus;
  capabilities: string[];
  channels: string[];
  connectedAt: number;
  lastSeen: number;
  metadata?: Record<string, unknown>;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  isPrivate: boolean;
  members: string[];
}

export interface Message {
  id: string;
  type: string;
  from: string;
  to?: string;
  content: string;
  channel?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ProtocolMessage {
  id?: string;
  type: string;
  source?: string;
  channel?: string;
  payload?: unknown;
  timestamp?: number;
  resource?: any;
  metadata?: Record<string, unknown>;
}

export interface PersistedActivityEvent {
  id: string;
  streamId?: string;
  relayTimestamp: number;
  originalTimestamp?: number;
  type: string;
  eventType?: string;
  source: string;
  channel?: string;
  activityChannel?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface BridgeOperatorContext {
  actor: string;
  remoteAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
}

export interface OrchestrationTask {
  id: string;
  // Add other relevant fields for OrchestrationTask
  targetAgents?: string[];
  requiredCapabilities?: string[];
  [key: string]: any; // Allow for arbitrary properties
}

export interface IRelayServerCore {
  agents: Map<string, Agent>;
  channels: Map<string, Channel>;
  sockets: Map<string, WebSocket>;
  bridge: any; // RedisRelayBridge | null;
  bridgeGateEnabled: boolean;
  pendingBridgeAgents: Map<string, { agent: Agent; socket: WebSocket; requestedAt: number }>;
  approvedBridgeAgents: Set<string>;
  activityPersistenceEnabled: boolean;
  activityRedis: any; // Redis | Cluster | RedisClientType | null;
  activityUpstash: any; // UpstashRedis | null;
  activityStreamKey: string;
  activityChannelPrefix: string;
  activityMaxLen: number;
  authService: any; // JWTAuthService | null;
  socketRemoteAddresses: WeakMap<WebSocket, string | null>;

  approveBridgeAccess(agentId: string, operator: BridgeOperatorContext): boolean;
  denyBridgeAccess(
    agentId: string,
    reason: string | undefined,
    operator: BridgeOperatorContext
  ): boolean;
  setBridgeGateEnabled(enabled: boolean, operator: BridgeOperatorContext): void;
  send(ws: WebSocket, message: Partial<ProtocolMessage>): void;
  emitRelayActivityEvent(
    eventType: string,
    content: string,
    metadata: Record<string, unknown>,
    operator: BridgeOperatorContext
  ): void;
  readActivityStream(streamKey: string, count: number): Promise<Array<[string, string[]]>>;
  parseActivityFields(fields: Record<string, string>): PersistedActivityEvent;
}
