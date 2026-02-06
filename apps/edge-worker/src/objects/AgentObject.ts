// Edge Relay Protocol Types (mirroring RELAY_ARCHITECTURE.md)

export interface AgentInfo {
  id: string;
  name: string;
  platform?: string;
  capabilities?: string[];
  channels?: string[];
}

export interface ProtocolMessage {
  id?: string;
  type: string;
  source?: string;
  channel?: string;
  payload?: any;
  timestamp?: number;
}

export class AgentObject {
  state: DurableObjectState;
  sessions: Map<WebSocket, any>; // Track session data
  agents: Map<string, AgentInfo>; // Connected agents in this DO

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.sessions = new Map();
    this.agents = new Map();
  }

  async fetch(request: Request) {
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      await this.handleSession(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    // HTTP API for internal checking
    const url = new URL(request.url);
    if (url.pathname.endsWith('/agents')) {
       return new Response(JSON.stringify(Array.from(this.agents.values())));
    }

    return new Response('Agent Object Relay Active');
  }

  async handleSession(webSocket: WebSocket) {
    this.state.acceptWebSocket(webSocket);
    this.sessions.set(webSocket, { authenticated: false });

    // Send WELCOME
    this.send(webSocket, {
      type: 'WELCOME',
      source: 'edge-relay',
      payload: { message: 'Connected to Edge Relay' }
    });

    webSocket.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data as string) as ProtocolMessage;
        await this.handleMessage(webSocket, data);
      } catch (err) {
        console.error('Relay Error', err);
      }
    });

    webSocket.addEventListener('close', () => {
      const session = this.sessions.get(webSocket);
      if (session && session.agentId) {
        this.agents.delete(session.agentId);
        this.broadcast({
          type: 'AGENT_STATUS',
          source: 'edge-relay',
          payload: { agentId: session.agentId, status: 'offline' }
        });
      }
      this.sessions.delete(webSocket);
    });
  }

  async handleMessage(ws: WebSocket, msg: ProtocolMessage) {
    // Fill defaults
    if (!msg.id) msg.id = crypto.randomUUID();
    if (!msg.timestamp) msg.timestamp = Date.now();

    switch (msg.type) {
      case 'AGENT_REGISTER':
        const agent = msg.payload.agent as AgentInfo;
        this.sessions.set(ws, { authenticated: true, agentId: agent.id });
        this.agents.set(agent.id, agent);
        
        this.send(ws, {
          type: 'AGENT_REGISTER_SUCCESS',
          source: 'edge-relay',
          payload: { id: agent.id }
        });

        this.broadcast({
          type: 'AGENT_STATUS',
          source: 'edge-relay',
          payload: { agentId: agent.id, status: 'online', agent }
        });
        break;

      case 'MESSAGE_SEND':
        const target = msg.payload.to;
        if (target === 'broadcast') {
          this.broadcast({
            ...msg,
            type: 'CHANNEL_MESSAGE'
          }, ws);
        } else {
          // Direct Message - Find target WS
          // In a single DO, we can find it in this.sessions
          // In a multi-DO setup, we'd need KV or stored IDs. 
          // For now, assuming "Room" model (everyone in this DO sees each other)
          this.broadcast(msg, ws); 
        }
        break;

      case 'HEARTBEAT':
        this.send(ws, { type: 'HEARTBEAT_ACK', source: 'edge-relay' });
        break;
        
      default:
        // Forward unknown types as broadcast for now (Room mode)
        this.broadcast(msg, ws);
    }
  }

  send(ws: WebSocket, msg: ProtocolMessage) {
    ws.send(JSON.stringify(msg));
  }

  broadcast(msg: ProtocolMessage, exclude?: WebSocket) {
    for (const [ws, session] of this.sessions) {
      if (ws !== exclude && ws.readyState === WebSocket.READY_STATE_OPEN) {
        ws.send(JSON.stringify(msg));
      }
    }
  }
}
