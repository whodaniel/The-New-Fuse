/**
 * TNF Federation Protocol
 * Mirrors Chrome extension v6 federation channel messaging for standalone nodes.
 */

export type FederationMessageType =
  | 'AGENT_REGISTER'
  | 'AGENT_UNREGISTER'
  | 'AGENT_LIST'
  | 'AGENT_STATUS'
  | 'AGENT_HEARTBEAT'
  | 'MESSAGE_SEND'
  | 'MESSAGE_RECEIVE'
  | 'CHANNEL_CREATE'
  | 'CHANNEL_JOIN'
  | 'CHANNEL_LEAVE'
  | 'CHANNEL_LIST'
  | 'CHANNEL_MESSAGE'
  | 'CHANNEL_JOINED'
  | 'CHANNEL_CREATED'
  | 'CHANNEL_PAUSE'
  | 'CHANNEL_RESUME'
  | 'HEARTBEAT'
  | 'WELCOME'
  | 'REGISTRATION_CONFIRMED'
  | 'REGISTRATION_ERROR'
  | 'ERROR';

export type FederationNodePlatform =
  | 'tauri-desktop'
  | 'federation-node'
  | 'chrome-extension'
  | 'browser-page'
  | 'cli-html'
  | 'unknown';

export interface FederationAgent {
  id: string;
  name: string;
  platform: FederationNodePlatform | string;
  status: 'active' | 'idle' | 'busy' | 'offline' | 'connected' | 'disconnected';
  capabilities: string[];
  channels?: string[];
  lastSeen?: number;
  metadata?: Record<string, unknown>;
}

export interface FederationChannel {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: number;
  createdBy?: string;
  isPrivate: boolean;
  topic?: string;
  metadata?: Record<string, unknown>;
}

export interface FederationChannelMessage {
  id: string;
  from: string;
  to?: string | 'broadcast';
  channel?: string;
  content: string;
  timestamp: number;
  type?: string;
  metadata?: Record<string, unknown>;
}

export interface FederationProtocolMessage<T = unknown> {
  id: string;
  type: FederationMessageType | string;
  timestamp: number;
  source: string;
  target?: string;
  channel?: string;
  payload: T;
  metadata?: Record<string, unknown>;
}

export interface FederationNodeRegistration {
  agentId: string;
  name: string;
  platform: FederationNodePlatform;
  capabilities?: string[];
  channels?: string[];
  metadata?: Record<string, unknown>;
}

export function generateFederationId(prefix = 'federation'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createFederationMessage<T = unknown>(
  type: FederationMessageType | string,
  source: string,
  payload: T,
  options?: Partial<FederationProtocolMessage<T>>
): FederationProtocolMessage<T> {
  return {
    id: generateFederationId('msg'),
    type,
    timestamp: Date.now(),
    source,
    payload,
    ...options,
  };
}

export function relayHealthUrl(relayUrl: string): string {
  return relayUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:').replace(/\/ws$/, '/health');
}

export const DEFAULT_RELAY_URLS = [
  'ws://127.0.0.1:3007/ws',
  'ws://127.0.0.1:3000/ws',
  'ws://127.0.0.1:3001/ws',
  'ws://127.0.0.1:3010/ws',
];

export const FEDERATION_NODE_CAPABILITIES = [
  'federation-channels',
  'channel-broadcast',
  'agent-orchestration',
  'relay-operator',
  'standalone-node',
] as const;
