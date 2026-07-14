/**
 * Relay Swarm Service
 *
 * Monitors the live federated swarm via the shared FederationNodeService
 * (same protocol as Browser Control / Forefront federation panel).
 */
import type { FederationAgent } from '@the-new-fuse/shared/federation/protocol';
import FederationNodeService from './FederationNodeService';

export interface FederatedAgent {
  id: string;
  name: string;
  role: string;
  platform: string;
  isOnline: boolean;
  lastSeen: string;
  capabilities: string[];
}

function mapFederatedAgent(agent: FederationAgent): FederatedAgent {
  const offline = agent.status === 'offline' || agent.status === 'disconnected';
  return {
    id: agent.id,
    name: agent.name,
    role: String(agent.metadata?.role || 'agent'),
    platform: String(agent.platform),
    isOnline: !offline,
    lastSeen: agent.lastSeen ? new Date(agent.lastSeen).toISOString() : new Date().toISOString(),
    capabilities: agent.capabilities || [],
  };
}

class RelaySwarmService {
  private listeners: Set<(agents: FederatedAgent[]) => void> = new Set();
  private bound = false;

  private ensureBound(): void {
    if (this.bound) return;
    this.bound = true;

    const refresh = () => {
      const agents = FederationNodeService.getState().agents.map(mapFederatedAgent);
      this.notify(agents);
    };

    FederationNodeService.on('connected', () => {
      FederationNodeService.requestAgentList();
      refresh();
    });
    FederationNodeService.on('registered', () => {
      FederationNodeService.requestAgentList();
      refresh();
    });
    FederationNodeService.on('agents_updated', (agents) => {
      const list = ((agents as FederationAgent[]) || []).map(mapFederatedAgent);
      this.notify(list);
    });
  }

  connect(): void {
    this.ensureBound();
    if (!FederationNodeService.isConnected()) {
      void FederationNodeService.connect();
      return;
    }
    FederationNodeService.requestAgentList();
    this.notify(FederationNodeService.getState().agents.map(mapFederatedAgent));
  }

  subscribe(callback: (agents: FederatedAgent[]) => void): () => void {
    this.listeners.add(callback);
    callback(FederationNodeService.getState().agents.map(mapFederatedAgent));
    return () => this.listeners.delete(callback);
  }

  getAgents(): FederatedAgent[] {
    return FederationNodeService.getState().agents.map(mapFederatedAgent);
  }

  isConnected(): boolean {
    return FederationNodeService.isConnected();
  }

  isRegistered(): boolean {
    return FederationNodeService.isRegistered();
  }

  private notify(agents: FederatedAgent[]): void {
    for (const cb of this.listeners) {
      cb(agents);
    }
  }
}

export const relaySwarmService = new RelaySwarmService();
