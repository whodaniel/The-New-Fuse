/**
 * Relay Swarm Service
 *
 * Connects directly to the TNF Relay (port 3000) to monitor
 * the live federated swarm of agents.
 */
import { v4 as uuidv4 } from 'uuid';

export interface FederatedAgent {
  id: string;
  name: string;
  role: string;
  platform: string;
  isOnline: boolean;
  lastSeen: string;
  capabilities: string[];
}

class RelaySwarmService {
  private ws: WebSocket | null = null;
  private agents: Map<string, FederatedAgent> = new Map();
  private listeners: Set<(agents: FederatedAgent[]) => void> = new Set();
  private retryCount: number = 0;
  private maxRetries: number = 5;

  constructor(private url: string = 'ws://localhost:3000/ws') {}

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    console.log(`📡 Connecting to TNF Relay Swarm: ${this.url}`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('✅ Connected to TNF Swarm Relay');
      this.retryCount = 0;

      // Register as a monitoring participant
      this.send({
        type: 'AGENT_REGISTER',
        source: `tauri-hub-${uuidv4().slice(0, 8)}`,
        payload: {
          agent: {
            name: 'Tauri Desktop Hub',
            role: 'participant',
            platform: 'tauri',
          },
        },
      });

      // Request initial agent list if supported by protocol
      this.send({
        type: 'DISCOVERY_QUERY',
        payload: { query: 'all' },
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error('Failed to parse relay message', e);
      }
    };

    this.ws.onclose = () => {
      console.warn('❌ Disconnected from TNF Relay');
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.connect(), 5000);
      }
    };
  }

  private handleMessage(msg: any) {
    // Handle agent registration/updates from the swarm
    if (msg.type === 'AGENT_REGISTERED' || msg.type === 'AGENT_UPDATE') {
      const agent = msg.payload.agent;
      this.agents.set(agent.id, {
        ...agent,
        isOnline: true,
        lastSeen: new Date().toISOString(),
      });
      this.notify();
    }

    if (msg.type === 'DISCOVERY_RESPONSE') {
      const swarmAgents = msg.payload.agents || [];
      swarmAgents.forEach((agent: any) => {
        this.agents.set(agent.id, {
          ...agent,
          isOnline: true,
        });
      });
      this.notify();
    }

    if (msg.type === 'HEARTBEAT') {
      const agentId = msg.source;
      if (this.agents.has(agentId)) {
        const agent = this.agents.get(agentId)!;
        this.agents.set(agentId, {
          ...agent,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });
        this.notify();
      }
    }
  }

  private send(msg: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  subscribe(callback: (agents: FederatedAgent[]) => void) {
    this.listeners.add(callback);
    callback(Array.from(this.agents.values()));
    return () => this.listeners.delete(callback);
  }

  private notify() {
    const agentList = Array.from(this.agents.values());
    this.listeners.forEach((cb) => cb(agentList));
  }

  getAgents(): FederatedAgent[] {
    return Array.from(this.agents.values());
  }
}

export const relaySwarmService = new RelaySwarmService();
