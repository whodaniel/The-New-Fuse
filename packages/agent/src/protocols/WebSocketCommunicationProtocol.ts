// packages/agent/src/protocols/WebSocketCommunicationProtocol.ts

// Import types only to avoid runtime dependency
interface WebSocketLike {
  send(data: string): void;
  readyState: number;
  on(event: string, listener: (data: any) => void): void;
}

interface WebSocketServerLike {
  clients: Set<WebSocketLike>;
  on(event: string, listener: (ws: WebSocketLike, req?: any) => void): void;
}

// Constants for WebSocket states
const WebSocketStates = {
  OPEN: 1,
} as const;

export interface Agent {
  id: string;
  onMessage: (message: any) => void;
}

export interface CommunicationProtocol {
  registerAgent(agent: Agent): void;
  unregisterAgent(agentId: string): void;
  sendMessage(agentId: string, message: any): void;
  broadcast(message: any): void;
}

type AgentMap = Map<string, Agent>;

export class WebSocketCommunicationProtocol implements CommunicationProtocol {
  private agents: AgentMap = new Map();
  private wss: WebSocketServerLike;

  constructor() {
    // This is a stub implementation for compilation
    this.wss = {} as WebSocketServerLike;
    this.setup();
  }

  private setup() {
    // Stub implementation for compilation
    if (this.wss.on) {
      this.wss.on('connection', (ws: WebSocketLike, _req) => {
        ws.on('message', (data) => {
          let parsed;
          try {
            parsed = JSON.parse(data.toString());
          } catch {
            return;
          }
          const { agentId, payload } = parsed;
          const agent = this.agents.get(agentId);
          if (agent) {
            agent.onMessage(payload);
          }
        });
      });
    }
  }

  registerAgent(agent: Agent) {
    this.agents.set(agent.id, agent);
  }

  unregisterAgent(agentId: string) {
    this.agents.delete(agentId);
  }

  sendMessage(agentId: string, message: any) {
    if (this.wss.clients) {
      for (const client of this.wss.clients) {
        if (client.readyState === WebSocketStates.OPEN) {
          client.send(JSON.stringify({ agentId, message }));
        }
      }
    }
  }

  broadcast(message: any) {
    if (this.wss.clients) {
      for (const client of this.wss.clients) {
        if (client.readyState === WebSocketStates.OPEN) {
          client.send(JSON.stringify({ message }));
        }
      }
    }
  }
}
