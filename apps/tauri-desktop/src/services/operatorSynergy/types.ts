import type { Environment } from '../../stores/settingsStore';

export interface RelayHealthSnapshot {
  status: string;
  agents: number;
  channels: number;
  uptime: number;
}

export interface UnifiedAgent {
  id: string;
  name: string;
  platform: string;
  source: 'federation' | 'local-api';
  status: string;
  capabilities: string[];
}

export interface TopologyNode {
  id: string;
  group: 'local' | 'cloud' | 'agent' | 'relay';
  status: 'online' | 'offline' | 'active' | 'idle';
  label: string;
}

export interface TopologyLink {
  source: string;
  target: string;
  value: number;
  active: boolean;
}

export interface OperatorSynergySnapshot {
  environment: Environment;
  relayUrl: string;
  apiUrl: string;
  relayConnected: boolean;
  relayRegistered: boolean;
  relayHealth: RelayHealthSnapshot | null;
  apiOnline: boolean;
  extensionConnected: boolean;
  browserSessionActive: boolean;
  federatedAgentCount: number;
  channelCount: number;
  unifiedAgents: UnifiedAgent[];
  activityLog: string[];
  topology: { nodes: TopologyNode[]; links: TopologyLink[] };
  lastSyncAt: number;
}

export type OperatorSynergyEvent = 'change' | 'activity';
