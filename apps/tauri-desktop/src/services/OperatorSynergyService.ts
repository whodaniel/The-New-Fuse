/**
 * Operator Synergy Service
 * Single orchestration plane for relay, federation, browser, and API surfaces.
 */
import type { FederationChannel } from '@the-new-fuse/shared/federation/protocol';
import { relayHealthUrl } from '@the-new-fuse/shared/federation/protocol';
import { discoverLocalEndpoints } from '../config/endpointDiscovery';
import { resolveEnvironmentEndpoints, resolveRelayUrlForEnvironment } from '../config/endpoints';
import { useAgentStore } from '../stores/agentStore';
import type { Environment } from '../stores/settingsStore';
import apiService from './api';
import BrowserControlService from './BrowserControlService';
import { EventEmitter } from './EventEmitter';
import FederationNodeService from './FederationNodeService';
import type {
  OperatorSynergyEvent,
  OperatorSynergySnapshot,
  TopologyLink,
  TopologyNode,
  UnifiedAgent,
} from './operatorSynergy/types';
import wsService from './websocket';

const INITIAL: OperatorSynergySnapshot = {
  environment: 'local',
  relayUrl: 'ws://127.0.0.1:3000/ws',
  apiUrl: 'http://localhost:3001',
  relayConnected: false,
  relayRegistered: false,
  relayHealth: null,
  apiOnline: false,
  extensionConnected: false,
  browserSessionActive: false,
  federatedAgentCount: 0,
  channelCount: 0,
  unifiedAgents: [],
  activityLog: [],
  topology: { nodes: [], links: [] },
  lastSyncAt: 0,
};

class OperatorSynergyServiceClass extends EventEmitter<OperatorSynergyEvent> {
  private snapshot: OperatorSynergySnapshot = { ...INITIAL };
  private bootstrapped = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private boundHandlers: Array<{
    target: object;
    event: string;
    handler: (...args: unknown[]) => void;
  }> = [];

  getSnapshot(): OperatorSynergySnapshot {
    return this.snapshot;
  }

  private log(line: string): void {
    const entry = `[${new Date().toLocaleTimeString()}] ${line}`;
    this.snapshot = {
      ...this.snapshot,
      activityLog: [entry, ...this.snapshot.activityLog].slice(0, 120),
    };
    this.emit('activity', entry);
    this.emit('change', this.snapshot);
  }

  private setSnapshot(patch: Partial<OperatorSynergySnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch, lastSyncAt: Date.now() };
    this.emit('change', this.snapshot);
  }

  private bindServiceEvents(): void {
    const bind = (target: object, event: string, handler: (...args: unknown[]) => void) => {
      (target as EventEmitter<string>).on(event, handler);
      this.boundHandlers.push({ target, event, handler });
    };

    bind(FederationNodeService, 'connected', () => {
      this.log('Federation node connected');
      this.syncFromServices();
    });
    bind(FederationNodeService, 'registered', () => {
      this.log('Federation node registered');
      FederationNodeService.requestChannelList();
      FederationNodeService.requestAgentList();
      this.syncFromServices();
    });
    bind(FederationNodeService, 'disconnected', () => {
      this.log('Federation node disconnected');
      this.syncFromServices();
    });
    bind(FederationNodeService, 'agents_updated', () => this.syncFromServices());
    bind(FederationNodeService, 'channels_updated', (channels) => {
      this.ensureOperatorChannel(channels as FederationChannel[] | undefined);
      this.syncFromServices();
    });
    bind(FederationNodeService, 'channel_message', (message) => {
      const payload = message as { from?: string; content?: string; channel?: string };
      if (payload?.content) {
        this.log(
          `[${payload.channel || 'channel'}] ${payload.from || 'agent'}: ${String(payload.content).slice(0, 120)}`
        );
      }
    });
    bind(FederationNodeService, 'activity', (line) => {
      const entry = String(line);
      this.snapshot = {
        ...this.snapshot,
        activityLog: [entry, ...this.snapshot.activityLog].slice(0, 120),
      };
      this.emit('activity', entry);
    });

    bind(BrowserControlService, 'connected', () => {
      this.log('Browser control relay connected');
      this.syncFromServices();
    });
    bind(BrowserControlService, 'disconnected', () => this.syncFromServices());
    bind(BrowserControlService, 'extension_connected', () => this.syncFromServices());
    bind(BrowserControlService, 'extension_disconnected', () => this.syncFromServices());
  }

  async bootstrap(environment: Environment, customApiUrl = ''): Promise<void> {
    let endpoints = resolveEnvironmentEndpoints(environment, customApiUrl);
    let relayUrl = resolveRelayUrlForEnvironment(environment, customApiUrl);

    if (environment === 'local') {
      const discovered = await discoverLocalEndpoints();
      if (discovered.relayUrl) {
        relayUrl = discovered.relayUrl;
        this.log(`Relay discovered at ${discovered.relayUrl}`);
      }
      if (discovered.apiUrl) {
        endpoints = {
          ...endpoints,
          api: discovered.apiUrl,
          ws: discovered.wsUrl || endpoints.ws,
        };
        this.log(`REST API discovered at ${discovered.apiUrl}`);
      } else if (discovered.relayUrl) {
        this.log('REST API not found on common ports — agent CRUD requires port 3001.');
      }
    }

    apiService.setBaseUrl(endpoints.api);
    wsService.setUrl(endpoints.ws);
    wsService.connect();
    BrowserControlService.setRelayUrl(relayUrl);
    FederationNodeService.setRelayUrl(relayUrl);

    this.setSnapshot({
      environment,
      relayUrl,
      apiUrl: endpoints.api,
    });

    if (!this.bootstrapped) {
      this.bindServiceEvents();
      this.bootstrapped = true;
    }

    this.log(`Synergy bootstrap (${environment})`);

    await Promise.allSettled([
      FederationNodeService.connect(relayUrl),
      BrowserControlService.connect(relayUrl),
    ]);

    void useAgentStore.getState().fetchAgents();
    await this.refreshHealth();
    this.syncFromServices();

    if (!this.pollTimer) {
      this.pollTimer = setInterval(() => {
        void this.refreshHealth();
        this.syncFromServices();
      }, 5000);
    }
  }

  async refreshHealth(): Promise<void> {
    const [relayHealth, apiOnline] = await Promise.all([
      this.fetchRelayHealth(this.snapshot.relayUrl),
      apiService.healthCheck(),
    ]);

    this.setSnapshot({
      relayHealth,
      apiOnline,
      channelCount: relayHealth?.channels ?? this.snapshot.channelCount,
      federatedAgentCount: relayHealth?.agents ?? this.snapshot.federatedAgentCount,
    });
  }

  private async fetchRelayHealth(relayUrl: string) {
    try {
      const res = await fetch(relayHealthUrl(relayUrl), { signal: AbortSignal.timeout(2500) });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.status !== 'ok') return null;
      // Distinguish federation relay from generic websocket gateways.
      if (!data.relay && data.agents === undefined && data.channels === undefined) {
        return null;
      }
      return {
        status: String(data.status),
        agents: Number(data.agents) || 0,
        channels: Number(data.channels) || 0,
        uptime: Number(data.uptime) || 0,
      };
    } catch {
      return null;
    }
  }

  syncFromServices(): void {
    const federation = FederationNodeService.getState();

    const localAgents = useAgentStore.getState().agents.map(
      (agent): UnifiedAgent => ({
        id: agent.id,
        name: agent.name,
        platform: agent.type,
        source: 'local-api',
        status: agent.status,
        capabilities: agent.capabilities || [],
      })
    );

    const federatedAgents = federation.agents.map(
      (agent: {
        id: string;
        name: string;
        platform: string;
        status: string;
        capabilities?: string[];
      }): UnifiedAgent => ({
        id: agent.id,
        name: agent.name,
        platform: String(agent.platform),
        source: 'federation',
        status: String(agent.status),
        capabilities: agent.capabilities || [],
      })
    );

    const unifiedAgents = this.mergeAgents(federatedAgents, localAgents);
    const extensionConnected = BrowserControlService.isExtensionConnected();
    const topology = this.buildTopology(unifiedAgents, {
      relayConnected: federation.connected || BrowserControlService.isConnected(),
      relayRegistered: federation.registered,
      apiOnline: this.snapshot.apiOnline,
      extensionConnected,
    });

    this.setSnapshot({
      relayConnected: federation.connected || BrowserControlService.isConnected(),
      relayRegistered: federation.registered,
      extensionConnected,
      browserSessionActive: BrowserControlService.isConnected() && extensionConnected,
      federatedAgentCount: federation.agents.length,
      channelCount: federation.channels.length || this.snapshot.relayHealth?.channels || 0,
      unifiedAgents,
      topology,
    });
  }

  private mergeAgents(federated: UnifiedAgent[], local: UnifiedAgent[]): UnifiedAgent[] {
    const map = new Map<string, UnifiedAgent>();
    for (const agent of federated) map.set(agent.id, agent);
    for (const agent of local) {
      if (!map.has(agent.id)) map.set(agent.id, agent);
    }
    return Array.from(map.values());
  }

  private buildTopology(
    agents: UnifiedAgent[],
    flags: {
      relayConnected: boolean;
      relayRegistered: boolean;
      apiOnline: boolean;
      extensionConnected: boolean;
    }
  ): { nodes: TopologyNode[]; links: TopologyLink[] } {
    const nodes: TopologyNode[] = [
      {
        id: 'desktop',
        group: 'local',
        status: flags.relayConnected ? 'online' : 'offline',
        label: 'TNF Desktop App',
      },
      {
        id: 'relay',
        group: 'relay',
        status: flags.relayRegistered ? 'active' : flags.relayConnected ? 'online' : 'offline',
        label: 'Standalone Relay',
      },
      {
        id: 'extension',
        group: 'local',
        status: flags.extensionConnected ? 'online' : 'offline',
        label: 'Chrome Extension',
      },
      {
        id: 'api',
        group: 'cloud',
        status: flags.apiOnline ? 'online' : 'offline',
        label: 'REST API',
      },
    ];

    const links: TopologyLink[] = [
      {
        source: 'desktop',
        target: 'relay',
        value: 5,
        active: flags.relayConnected,
      },
      {
        source: 'extension',
        target: 'relay',
        value: 3,
        active: flags.extensionConnected && flags.relayConnected,
      },
      {
        source: 'desktop',
        target: 'api',
        value: 2,
        active: flags.apiOnline,
      },
    ];

    for (const agent of agents.slice(0, 8)) {
      nodes.push({
        id: agent.id,
        group: 'agent',
        status:
          agent.status === 'active' ? 'active' : agent.status === 'offline' ? 'offline' : 'idle',
        label: agent.name,
      });
      links.push({
        source: 'relay',
        target: agent.id,
        value: 2,
        active: flags.relayConnected && agent.source === 'federation',
      });
    }

    return { nodes, links };
  }

  sendFederationMessage(channelId: string, content: string): void {
    if (!content.trim()) return;
    FederationNodeService.sendChannelMessage(channelId, content.trim());
  }

  private ensureOperatorChannel(channels?: FederationChannel[]): void {
    if (!FederationNodeService.isRegistered()) return;

    const list = channels ?? FederationNodeService.getState().channels;
    const general =
      list.find((channel) => channel.id === 'general' || channel.name === 'general') || list[0];

    if (general) {
      const joined = FederationNodeService.getState().joinedChannels;
      if (!joined.includes(general.id)) {
        FederationNodeService.joinChannel(general.id);
      }
      return;
    }

    if (list.length === 0) {
      FederationNodeService.createChannel('general', 'Default operator channel');
    }
  }

  getPreferredChatAgents(): UnifiedAgent[] {
    const agents = this.snapshot.unifiedAgents;
    if (agents.length > 0) return agents;
    return [];
  }

  destroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    for (const { target, event, handler } of this.boundHandlers) {
      (target as EventEmitter<string>).off(event, handler);
    }
    this.boundHandlers = [];
    this.bootstrapped = false;
  }
}

export const OperatorSynergyService = new OperatorSynergyServiceClass();
export default OperatorSynergyService;
