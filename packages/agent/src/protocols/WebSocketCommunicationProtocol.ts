// packages/agent/src/protocols/WebSocketCommunicationProtocol.ts

import WebSocket from 'ws';

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
  private wss: WebSocket.Server;

  constructor(serverOptions: WebSocket.ServerOptions) {
    this.wss = new WebSocket.Server(serverOptions);
    this.setup();
  }

  private setup() {
    this.wss.on('connection', (ws: WebSocket, _req) => {
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

  registerAgent(agent: Agent) {
    this.agents.set(agent.id, agent);
  }

  unregisterAgent(agentId: string) {
    this.agents.delete(agentId);
  }

  sendMessage(agentId: string, message: any) {
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ agentId, message }));
      }
    }
  }

  broadcast(message: any) {
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ message }));
      }
    }
  }
}