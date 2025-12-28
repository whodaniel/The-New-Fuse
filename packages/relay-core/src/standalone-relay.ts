#!/usr/bin/env node

/**
 * TNF Relay Server - Standalone WebSocket Relay
 * Part of @the-new-fuse/relay-core package
 * 
 * Usage:
 *   pnpm run relay         # Start on default port 3001
 *   PORT=3002 pnpm run relay  # Start on custom port
 * 
 * Endpoints:
 *   WebSocket: ws://localhost:3001/ws
 *   Health:    http://localhost:3001/health
 *   Agents:    http://localhost:3001/agents
 *   Channels:  http://localhost:3001/channels
 */

import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { EventEmitter } from 'events';
import { createRedisRelayBridge, RedisRelayBridge } from './redis-relay-bridge';
import { TNFEnvelope } from './protocol/tnf-envelope';

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const HEARTBEAT_INTERVAL = 30000;
const AGENT_TIMEOUT = 60000;

// Types
interface Agent {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'idle' | 'offline';
  capabilities: string[];
  channels: string[];
  connectedAt: number;
  lastSeen: number;
  metadata?: Record<string, unknown>;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  isPrivate: boolean;
  members: string[];
}

interface Message {
  id: string;
  type: string;
  from: string;
  to?: string;
  content: string;
  channel?: string;
  timestamp: number;
}

interface ProtocolMessage {
  id?: string;
  type: string;
  source?: string;
  channel?: string;
  payload?: unknown;
  timestamp?: number;
}

// Relay Server Class
export class TNFRelayServer extends EventEmitter {
  private server: http.Server;
  private wss: WebSocketServer;
  private agents: Map<string, Agent> = new Map();
  private sockets: Map<string, WebSocket> = new Map();
  private channels: Map<string, Channel> = new Map();
  private agentChannels: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private port: number;
  private bridge: RedisRelayBridge | null = null;

  constructor(port: number = PORT) {
    super();
    this.port = port;

    // Create HTTP server
    this.server = http.createServer(this.handleHttpRequest.bind(this));

    // Create WebSocket server at /ws path
    this.wss = new WebSocketServer({ server: this.server, path: '/ws' });

    // Setup WebSocket handlers
    this.setupWebSocket();

    // Create default channel
    this.createDefaultChannel();

    // Initialize Redis Bridge if enabled
    if (process.env.ENABLE_REDIS_BRIDGE === 'true') {
      this.bridge = createRedisRelayBridge();
      
      this.bridge.on('connected', () => console.log('[Relay] Bridge connected to Redis'));
      
      this.bridge.on('egress', (envelope: TNFEnvelope) => {
        // Handle message from Redis -> WebSocket
        this.handleBridgeEgress(envelope);
      });

      this.bridge.connect().catch(err => console.error('[Relay] Failed to connect bridge:', err));
    }
  }

  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const { url } = req;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'application/json');

    switch (url) {
      case '/':
      case '/health':
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'ok',
          relay: 'running',
          version: '1.0.0',
          agents: this.agents.size,
          channels: this.channels.size,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        }));
        break;

      case '/agents':
        res.writeHead(200);
        res.end(JSON.stringify(Array.from(this.agents.values())));
        break;

      case '/channels':
        res.writeHead(200);
        res.end(JSON.stringify(Array.from(this.channels.values())));
        break;

      case '/status':
        res.writeHead(200);
        res.end(JSON.stringify({
          agents: Array.from(this.agents.values()),
          channels: Array.from(this.channels.values()),
          connections: this.sockets.size,
        }));
        break;

      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      let agentId: string | null = null;

      console.log(`[Relay] New connection from ${req.socket.remoteAddress}`);

      // Send welcome message
      this.send(ws, {
        type: 'WELCOME',
        payload: {
          message: 'Connected to TNF Relay',
          version: '1.0.0',
          timestamp: Date.now(),
        },
      });

      // Handle messages
      ws.on('message', (data: Buffer | string) => {
        try {
          const message: ProtocolMessage = JSON.parse(data.toString());
          agentId = this.handleMessage(ws, message, agentId);
        } catch (e) {
          console.error('[Relay] Invalid message:', (e as Error).message);
          this.send(ws, { type: 'ERROR', payload: { message: 'Invalid JSON' } });
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        if (agentId) {
          this.handleAgentDisconnect(agentId);
        }
      });

      ws.on('error', (err: Error) => {
        console.error('[Relay] WebSocket error:', err.message);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: ProtocolMessage, currentAgentId: string | null): string | null {
    // Forward to Redis Bridge
    if (this.bridge && currentAgentId && message.type !== 'PING') {
      this.bridge.handleRelayMessage(message, currentAgentId);
    }
    const { type, payload, source, channel } = message;
    const agentId = source || currentAgentId;

    console.log(`[Relay] ${type} from ${agentId || 'unknown'}`);

    switch (type) {
      case 'AGENT_REGISTER': {
        const agentData = (payload as any)?.agent || {};
        const id = agentData.id || agentId || `agent-${Date.now()}`;

        const agent: Agent = {
          id,
          name: agentData.name || 'Unknown Agent',
          platform: agentData.platform || 'unknown',
          status: 'active',
          capabilities: agentData.capabilities || [],
          channels: agentData.channels || [],
          connectedAt: Date.now(),
          lastSeen: Date.now(),
          metadata: agentData.metadata,
        };

        this.agents.set(id, agent);
        this.sockets.set(id, ws);
        this.agentChannels.set(id, new Set(agent.channels));

        console.log(`[Relay] Agent registered: ${agent.name} (${id})`);
        this.emit('agent:registered', agent);

        // Send current state to new agent
        this.send(ws, {
          type: 'AGENT_LIST',
          payload: { agents: Array.from(this.agents.values()) },
        });

        this.send(ws, {
          type: 'CHANNEL_LIST',
          payload: { channels: Array.from(this.channels.values()) },
        });

        // Notify other agents
        this.broadcast({
          type: 'AGENT_STATUS',
          payload: { agent },
        }, id);

        return id;
      }

      case 'AGENT_UNREGISTER': {
        if (agentId) {
          this.handleAgentDisconnect(agentId);
        }
        return null;
      }

      case 'AGENT_LIST': {
        this.send(ws, {
          type: 'AGENT_LIST',
          payload: { agents: Array.from(this.agents.values()) },
        });
        break;
      }

      case 'CHANNEL_LIST': {
        this.send(ws, {
          type: 'CHANNEL_LIST',
          payload: { channels: Array.from(this.channels.values()) },
        });
        break;
      }

      case 'CHANNEL_CREATE': {
        const channelId = `channel-${Date.now()}`;
        const newChannel: Channel = {
          id: channelId,
          name: (payload as any)?.name || 'Unnamed Channel',
          description: (payload as any)?.description || '',
          createdBy: agentId || 'unknown',
          createdAt: Date.now(),
          isPrivate: (payload as any)?.isPrivate || false,
          members: agentId ? [agentId] : [],
        };

        this.channels.set(channelId, newChannel);

        if (agentId) {
          const myChannels = this.agentChannels.get(agentId) || new Set();
          myChannels.add(channelId);
          this.agentChannels.set(agentId, myChannels);
        }

        this.broadcast({
          type: 'CHANNEL_LIST',
          payload: { channels: Array.from(this.channels.values()) },
        });
        break;
      }

      case 'CHANNEL_JOIN': {
        const channelId = (payload as any)?.channelId;
        const ch = this.channels.get(channelId);
        if (ch && agentId) {
          if (!ch.members.includes(agentId)) {
            ch.members.push(agentId);
          }
          const myChannels = this.agentChannels.get(agentId) || new Set();
          myChannels.add(channelId);
          this.agentChannels.set(agentId, myChannels);
        }
        break;
      }

      case 'CHANNEL_LEAVE': {
        const channelId = (payload as any)?.channelId;
        const ch = this.channels.get(channelId);
        if (ch && agentId) {
          ch.members = ch.members.filter(m => m !== agentId);
          const myChannels = this.agentChannels.get(agentId);
          if (myChannels) myChannels.delete(channelId);
        }
        break;
      }

      case 'MESSAGE_SEND': {
        const { to, content, messageType } = payload as any;
        const msg: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: messageType || 'text',
          from: agentId || 'unknown',
          to,
          content,
          channel,
          timestamp: Date.now(),
        };

        this.emit('message', msg);

        if (to === 'broadcast') {
          if (channel) {
            // Broadcast to channel members
            const ch = this.channels.get(channel);
            if (ch) {
              ch.members.forEach(memberId => {
                const memberWs = this.sockets.get(memberId);
                if (memberWs && memberWs.readyState === WebSocket.OPEN) {
                  this.send(memberWs, {
                    type: 'CHANNEL_MESSAGE',
                    payload: msg,
                  });
                }
              });
            }
          } else {
            // Broadcast to all
            this.broadcast({
              type: 'MESSAGE_RECEIVE',
              payload: msg,
            });
          }
        } else if (to) {
          // Direct message
          const targetWs = this.sockets.get(to);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            this.send(targetWs, {
              type: 'MESSAGE_RECEIVE',
              payload: msg,
            });
          }
        }
        break;
      }

      case 'HEARTBEAT': {
        const agent = agentId ? this.agents.get(agentId) : null;
        if (agent) {
          agent.lastSeen = Date.now();
        }
        break;
      }

      default:
        console.log(`[Relay] Unknown message type: ${type}`);
    }

    return currentAgentId;
  }

  private handleAgentDisconnect(agentId: string): void {
    console.log(`[Relay] Agent disconnected: ${agentId}`);
    
    const agent = this.agents.get(agentId);
    this.agents.delete(agentId);
    this.sockets.delete(agentId);
    this.agentChannels.delete(agentId);

    // Notify others
    this.broadcast({
      type: 'AGENT_STATUS',
      payload: {
        agent: { id: agentId, status: 'offline', name: agent?.name },
      },
    });

    this.emit('agent:disconnected', { agentId, agent });
  }

  private send(ws: WebSocket, message: Partial<ProtocolMessage>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        id: message.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...message,
      }));
    }
  }

  private handleBridgeEgress(envelope: TNFEnvelope): void {
    // Convert TNF Envelope back to Protocol Message format for WebSocket clients
    const protocolMsg: ProtocolMessage = {
      id: envelope.id,
      type: envelope.type === 'event' ? 'CHANNEL_MESSAGE' : 'MESSAGE_RECEIVE', // Map to existing types
      source: envelope.from.agentId,
      channel: envelope.context?.channelId,
      payload: envelope.payload,
      timestamp: new Date(envelope.timestamp).getTime(),
    };

    // Determine routing
    if ('broadcast' in envelope.to && envelope.to.broadcast) {
      // Broadcast to channel if specified, otherwise global
      if (envelope.context?.channelId) {
        this.broadcastToChannel(envelope.context.channelId, protocolMsg);
      } else {
        this.broadcast(protocolMsg);
      }
    } else if ('agentId' in envelope.to) {
      // Direct message to specific agent
      const targetSocket = this.sockets.get(envelope.to.agentId);
      if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
        targetSocket.send(JSON.stringify(protocolMsg));
      }
    }
  }

  private broadcastToChannel(channelId: string, message: ProtocolMessage): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.members.forEach(memberId => {
      const socket = this.sockets.get(memberId);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    });
  }

  private broadcast(message: Partial<ProtocolMessage>, excludeAgentId?: string): void {
    const data = JSON.stringify({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...message,
    });

    this.sockets.forEach((ws, agentId) => {
      if (agentId !== excludeAgentId && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  private createDefaultChannel(): void {
    this.channels.set('general', {
      id: 'general',
      name: 'General',
      description: 'Default channel for all agents',
      createdBy: 'system',
      createdAt: Date.now(),
      isPrivate: false,
      members: [],
    });
  }

  private startHeartbeatMonitor(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      this.agents.forEach((agent, agentId) => {
        if (now - agent.lastSeen > AGENT_TIMEOUT) {
          console.log(`[Relay] Agent timeout: ${agentId}`);
          const ws = this.sockets.get(agentId);
          if (ws) ws.close();
          this.handleAgentDisconnect(agentId);
        }
      });
    }, HEARTBEAT_INTERVAL);
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`
╔═════════════════════════════════════════════════════════════╗
║           ⚡ TNF RELAY SERVER ⚡                             ║
║                                                              ║
║   WebSocket: ws://localhost:${this.port}/ws                        ║
║   Health:    http://localhost:${this.port}/health                   ║
║   Agents:    http://localhost:${this.port}/agents                   ║
║   Channels:  http://localhost:${this.port}/channels                 ║
║                                                              ║
║   Part of @the-new-fuse/relay-core                           ║
╚═════════════════════════════════════════════════════════════╝
`);
        this.startHeartbeatMonitor();
        this.emit('started', { port: this.port });
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Close all connections
      this.sockets.forEach((ws) => ws.close());

      this.wss.close(() => {
        this.server.close(() => {
          console.log('[Relay] Server stopped');
          this.emit('stopped');
          resolve();
        });
      });
    });
  }

  // Getters for external access
  public getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  public getChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  public getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  public getChannel(id: string): Channel | undefined {
    return this.channels.get(id);
  }
}

// CLI entry point
if (require.main === module) {
  const relay = new TNFRelayServer(PORT);
  
  relay.start().catch((err) => {
    console.error('[Relay] Failed to start:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[Relay] Shutting down...');
    await relay.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await relay.stop();
    process.exit(0);
  });
}

export default TNFRelayServer;
