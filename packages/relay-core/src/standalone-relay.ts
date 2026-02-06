#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * TNF Relay Server - Standalone WebSocket Relay
 * Part of @the-new-fuse/relay-core package
 *
 * Usage:
 *   pnpm run relay         # Start on default port 3000
 *   PORT=3002 pnpm run relay  # Start on custom port
 *
 * Endpoints:
 *   WebSocket: ws://localhost:3000/ws
 *   Health:    http://localhost:3000/health
 *   Agents:    http://localhost:3000/agents
 *   Channels:  http://localhost:3000/channels
 */

import { EventEmitter } from 'events';
import http from 'http';

import WebSocket, { WebSocketServer } from 'ws';

import { createAuthService } from './auth/JWTAuthService';
import {
  ConversationPhase,
  ConversationStateMachine,
} from './orchestrator/conversation-state-machine';
import { SubscriptionRegistry } from './orchestrator/subscription-registry';
import { createRedisRelayBridge } from './redis-relay-bridge';
import { createStallDetector } from './services/stall-detector';

import type { JWTAuthService } from './auth/JWTAuthService';
import type { OrchestrationTask } from './protocol/task-protocol';
import type { TNFEnvelope } from './protocol/tnf-envelope';
import type { RedisRelayBridge } from './redis-relay-bridge';
import type { StallDetector } from './services/stall-detector';

// Configuration
const PORT = parseInt(process.env.PORT || '3000', 10);
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
  private authService: JWTAuthService;
  private stallDetector: StallDetector;
  private conversationManagers: Map<string, ConversationStateMachine> = new Map();
  private subscriptionRegistry: SubscriptionRegistry;

  constructor(port: number = PORT) {
    super();
    this.port = port;
    this.authService = createAuthService();
    this.subscriptionRegistry = new SubscriptionRegistry();

    // Create HTTP server
    this.server = http.createServer(this.handleHttpRequest.bind(this));

    // Create WebSocket server at /ws path
    this.wss = new WebSocketServer({ server: this.server, path: '/ws' });

    // Setup WebSocket handlers
    this.setupWebSocket();

    // Create default channel
    this.createDefaultChannel();

    // Initialize stall detector for conversation recovery
    this.stallDetector = createStallDetector({
      stallThresholdMs: 600000, // 10 minutes (reduced from 60 min)
      checkIntervalMs: 5000, // Check every 5 seconds
      maxRecoveryAttempts: 3,
      autoRecover: true,
    });

    // Handle stall recovery events
    this.stallDetector.on(
      'recovery:message',
      (event: { channelId: string; message: string; metadata: Record<string, unknown> }) => {
        this.sendRecoveryMessage(event.channelId, event.message, event.metadata);
      }
    );

    this.stallDetector.on('conversation:stalled', (event: { channelId: string }) => {
      console.log(`[Relay] Conversation stalled on channel ${event.channelId}`);
      this.emit('conversation:stalled', event);
    });

    this.stallDetector.on('conversation:terminated', (event: { channelId: string }) => {
      console.log(`[Relay] Conversation terminated on channel ${event.channelId}`);
      this.emit('conversation:terminated', event);
    });

    this.stallDetector.on('conversation:recovered', (event: { channelId: string }) => {
      console.log(`[Relay] Conversation recovered on channel ${event.channelId}`);
      const manager = this.conversationManagers.get(event.channelId);
      if (manager && manager.getPhase() === ConversationPhase.STALLED) {
        void manager.transition(ConversationPhase.EXECUTION);
      }
    });

    // Initialize Redis Bridge if enabled
    if (process.env.ENABLE_REDIS_BRIDGE === 'true') {
      this.bridge = createRedisRelayBridge();

      this.bridge.on('connected', () => console.log('[Relay] Bridge connected to Redis'));

      this.bridge.on('egress', (envelope: TNFEnvelope) => {
        // Handle message from Redis -> WebSocket
        this.handleBridgeEgress(envelope);
      });

      this.bridge.connect().catch((err) => console.error('[Relay] Failed to connect bridge:', err));
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
        res.end(
          JSON.stringify({
            status: 'ok',
            relay: 'running',
            version: '1.0.0',
            agents: this.agents.size,
            channels: this.channels.size,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          })
        );
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
        res.end(
          JSON.stringify({
            agents: Array.from(this.agents.values()),
            channels: Array.from(this.channels.values()),
            connections: this.sockets.size,
          })
        );
        break;

      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  private getOrCreateConversationManager(channelId: string): ConversationStateMachine {
    let manager = this.conversationManagers.get(channelId);
    if (!manager) {
      console.log(`[Relay] initializing conversation state machine for ${channelId}`);
      manager = new ConversationStateMachine(channelId);

      // Hook up state machine events
      manager.on('phase:changed', (event) => {
        console.log(
          `[Relay] Phase changed in ${event.conversationId}: ${event.from} -> ${event.to}`
        );

        // Broadcast phase change to channel
        this.broadcastToChannel(event.conversationId, {
          id: `sys-${Date.now()}`,
          type: 'CHANNEL_MESSAGE',
          source: 'system',
          channel: event.conversationId,
          payload: {
            type: 'system',
            content: `Conversation phase changed to: ${event.to.toUpperCase()}`,
            metadata: {
              isSystemMessage: true,
              phase: event.to,
              previousPhase: event.from,
            },
          },
          timestamp: Date.now(),
        });
      });

      this.conversationManagers.set(channelId, manager);
    }
    return manager;
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

  private handleMessage(
    ws: WebSocket,
    message: ProtocolMessage,
    currentAgentId: string | null
  ): string | null {
    // Forward to Redis Bridge
    if (this.bridge && currentAgentId && message.type !== 'PING') {
      void this.bridge.handleRelayMessage(message, currentAgentId);
    }
    const { type, payload, source, channel } = message;
    const agentId = source || currentAgentId;

    console.log(`[Relay] ${type} from ${agentId || 'unknown'}`);

    // Update lastSeen for ANY message from a known agent
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.lastSeen = Date.now();
      }
    }

    switch (type) {
      case 'AGENT_REGISTER': {
        // Authenticate if token provided
        const token =
          ((payload as Record<string, unknown>)?.token as string) ||
          ((message as unknown as Record<string, unknown>)?.token as string);
        let verifiedToken = null;

        if (token) {
          console.log(`[Relay] Authenticating agent via JWT...`);
          verifiedToken = this.authService.verifyToken(token);

          if (!verifiedToken) {
            console.warn(`[Relay] Authentication failed for agent. Invalid token.`);
            this.send(ws, {
              type: 'REGISTRATION_ERROR',
              payload: {
                error: 'Invalid or expired authentication token',
                code: 'AUTH_FAILED',
              },
            });
            return null;
          }
          console.log(`[Relay] ✅ Authenticated agent: ${verifiedToken.agentId}`);
        }

        const agentData =
          ((payload as Record<string, unknown>)?.agent as Record<string, unknown>) || {};
        const id =
          verifiedToken?.agentId || (agentData.id as string) || agentId || `agent-${Date.now()}`;

        const agent: Agent = {
          id,
          name: verifiedToken?.name || (agentData.name as string) || 'Unknown Agent',
          platform: verifiedToken?.platform || (agentData.platform as string) || 'unknown',
          status: 'active',
          capabilities: verifiedToken?.capabilities || (agentData.capabilities as string[]) || [],
          channels: (agentData.channels as string[]) || [],
          connectedAt: Date.now(),
          lastSeen: Date.now(),
          metadata: {
            ...(agentData.metadata as Record<string, unknown>),
            authenticated: !!verifiedToken,
          },
        };

        this.agents.set(id, agent);
        this.sockets.set(id, ws);
        this.agentChannels.set(id, new Set(agent.channels));

        // Register capabilities
        for (const cap of agent.capabilities) {
          this.subscriptionRegistry.register(id, `capability:${cap}`);
        }

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

        // Send registration confirmation with auth status
        this.send(ws, {
          type: 'REGISTRATION_CONFIRMED',
          payload: {
            relayInfo: {
              id: 'relay-standalone',
              version: '1.0.0',
              authenticated: !!verifiedToken,
            },
          },
        });

        // Notify other agents
        this.broadcast(
          {
            type: 'AGENT_STATUS',
            payload: { agent },
          },
          id
        );

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
        const requestedName =
          ((payload as Record<string, unknown>)?.name as string) || 'Unnamed Channel';

        // Check if a channel with this name already exists
        let existingChannel: Channel | null = null;
        for (const ch of this.channels.values()) {
          if (ch.name.toLowerCase() === requestedName.toLowerCase()) {
            existingChannel = ch;
            break;
          }
        }

        if (existingChannel) {
          // Channel exists - join it instead of creating duplicate
          console.log(
            `[Relay] Channel '${requestedName}' already exists (${existingChannel.id}), joining instead`
          );
          if (agentId && !existingChannel.members.includes(agentId)) {
            existingChannel.members.push(agentId);
          }
          if (agentId) {
            const myChannels = this.agentChannels.get(agentId) || new Set();
            myChannels.add(existingChannel.id);
            this.agentChannels.set(agentId, myChannels);
          }
          // Send confirmation with existing channel info
          this.send(ws, {
            type: 'CHANNEL_JOINED',
            payload: { channel: existingChannel, wasExisting: true },
          });
        } else {
          // Create new channel
          const channelId = `channel-${Date.now()}`;
          const newChannel: Channel = {
            id: channelId,
            name: requestedName,
            description: ((payload as Record<string, unknown>)?.description as string) || '',
            createdBy: agentId || 'unknown',
            createdAt: Date.now(),
            isPrivate: ((payload as Record<string, unknown>)?.isPrivate as boolean) || false,
            members: agentId ? [agentId] : [],
          };

          this.channels.set(channelId, newChannel);

          if (agentId) {
            const myChannels = this.agentChannels.get(agentId) || new Set();
            myChannels.add(channelId);
            this.agentChannels.set(agentId, myChannels);
          }

          // Send confirmation with new channel info
          this.send(ws, {
            type: 'CHANNEL_CREATED',
            payload: { channel: newChannel },
          });
        }

        this.broadcast({
          type: 'CHANNEL_LIST',
          payload: { channels: Array.from(this.channels.values()) },
        });
        break;
      }

      case 'CHANNEL_JOIN': {
        const channelId = (payload as Record<string, unknown>)?.channelId as string;
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
        const channelId = (payload as Record<string, unknown>)?.channelId as string;
        const ch = this.channels.get(channelId);
        if (ch && agentId) {
          ch.members = ch.members.filter((m) => m !== agentId);
          const myChannels = this.agentChannels.get(agentId);
          if (myChannels) {
            myChannels.delete(channelId);
          }
        }
        break;
      }

      case 'TASK_DISPATCH': {
        const task = (payload as Record<string, unknown>)?.task as OrchestrationTask;
        const targetChannel =
          ((payload as Record<string, unknown>)?.channelId as string) || channel;

        if (task && targetChannel) {
          this.dispatchTask(task, targetChannel);
        }
        break;
      }

      case 'CHANNEL_DELETE': {
        const channelId = (payload as Record<string, unknown>)?.channelId as string;
        if (this.channels.has(channelId)) {
          this.channels.delete(channelId);
          // Remove from all agent channel sets
          this.agentChannels.forEach((channels) => channels.delete(channelId));

          console.log(`[Relay] Channel deleted: ${channelId}`);

          this.broadcast({
            type: 'CHANNEL_LIST',
            payload: { channels: Array.from(this.channels.values()) },
          });
        }
        break;
      }

      case 'CHANNEL_PAUSE': {
        const channelId = (payload as Record<string, unknown>)?.channelId as string;
        if (channelId) {
          const manager = this.getOrCreateConversationManager(channelId);
          void manager.pause(); // async but we don't await
          console.log(`[Relay] Channel paused: ${channelId}`);
        }
        break;
      }

      case 'CHANNEL_RESUME': {
        const channelId = (payload as Record<string, unknown>)?.channelId as string;
        if (channelId) {
          const manager = this.getOrCreateConversationManager(channelId);
          void manager.resume(); // async but we don't await
          console.log(`[Relay] Channel resumed: ${channelId}`);
        }
        break;
      }

      case 'MESSAGE_SEND': {
        const rawPayload = payload as Record<string, unknown>;
        const to = rawPayload.to as string | undefined;
        const content = rawPayload.content as string;
        const messageType = rawPayload.messageType as string | undefined;
        const metadata = rawPayload.metadata as Record<string, unknown> | undefined;

        const msg: Message & { metadata?: Record<string, unknown> } = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: messageType || 'text',
          from: agentId || 'unknown',
          to,
          content,
          channel,
          timestamp: Date.now(),
          metadata, // <-- PRESERVE metadata for loop prevention
        };

        this.emit('message', msg);

        // Track activity for stall detection (skip system messages)
        // Update conversation state if this is not a system message
        if (channel && !metadata?.isSystemMessage && !metadata?.isRecoveryAttempt) {
          // Update conversation state machine
          const manager = this.getOrCreateConversationManager(channel);
          const currentPhase = manager.getPhase();

          // 1. Check for Pause
          if (currentPhase === ConversationPhase.PAUSED) {
            // Do NOT record activity or update stall detector when paused
            console.log(`[Relay] Skipping activity record for paused channel: ${channel}`);
          } else {
            // 2. Auto-start if in initializing phase (User sent a message, so start it!)
            if (currentPhase === ConversationPhase.INITIALIZING) {
              console.log(`[Relay] Auto-starting conversation in channel: ${channel}`);
              void manager.transition(ConversationPhase.EXECUTION);
            }

            // 3. Record activity only if we are in an active phase
            // (This prevents stall detector from firing on a conversation that hasn't really started or is finished)
            if (
              currentPhase === ConversationPhase.EXECUTION ||
              currentPhase === ConversationPhase.STALLED ||
              currentPhase === ConversationPhase.RECOVERY
            ) {
              // Only track as conversation content if there's actual message content
              const msgPayload = (message as unknown as Record<string, unknown>)?.payload as Record<
                string,
                unknown
              >;
              const hasMessageContent = !!msgPayload?.content;
              this.stallDetector.recordActivity(channel, agentId || undefined, hasMessageContent);
              void manager.recordActivity();
            }
          }
        }

        if (to === 'broadcast') {
          if (channel) {
            // Broadcast to channel members
            const ch = this.channels.get(channel);
            if (ch) {
              ch.members.forEach((memberId) => {
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

      case 'PONG':
        // Activity already updated above
        break;

      case 'AGENT_METADATA_UPDATE': {
        const agentInfo = (payload as Record<string, unknown>)?.agent;
        if (agentInfo) {
          // Update agent logic... we need to be careful with types here
          // For now, let's assume agentInfo is partial update
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

    // Remove agent from all channel member lists
    const agentChannelSet = this.agentChannels.get(agentId);
    if (agentChannelSet) {
      for (const channelId of agentChannelSet) {
        const channel = this.channels.get(channelId);
        if (channel) {
          channel.members = channel.members.filter((m) => m !== agentId);
        }
      }
    }
    this.agentChannels.delete(agentId);
    this.subscriptionRegistry.clearAgent(agentId);

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
      ws.send(
        JSON.stringify({
          id: message.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          ...message,
        })
      );
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

  public dispatchTask(task: OrchestrationTask, channelId: string): void {
    console.log(`[Relay] Dispatching task ${task.id} to channel ${channelId}`);

    // If specific targets are defined, prioritize them
    if (task.targetAgents && task.targetAgents.length > 0) {
      for (const targetAgentId of task.targetAgents) {
        const targetSocket = this.sockets.get(targetAgentId);
        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          this.send(targetSocket, {
            type: 'TASK_ASSIGN',
            payload: { task },
            channel: channelId,
            timestamp: Date.now(),
          });
        }
      }
    } else if (task.requiredCapabilities && task.requiredCapabilities.length > 0) {
      // Filter by capabilities
      const channel = this.channels.get(channelId);
      let dispatched = false;

      if (channel) {
        const capableAgents = channel.members.filter((agentId) => {
          return (
            task.requiredCapabilities?.every((cap) => {
              const subscribers = this.subscriptionRegistry.getSubscribers(`capability:${cap}`);
              return subscribers.includes(agentId);
            }) ?? false
          );
        });

        if (capableAgents.length > 0) {
          console.log(`[Relay] Dispatching task via capabilities to: ${capableAgents.join(', ')}`);
          capableAgents.forEach((agentId) => {
            const ws = this.sockets.get(agentId);
            if (ws && ws.readyState === WebSocket.OPEN) {
              this.send(ws, {
                type: 'TASK_ASSIGN',
                payload: { task },
                channel: channelId,
                timestamp: Date.now(),
              });
            }
          });
          dispatched = true;
        }
      }

      if (!dispatched) {
        console.log(`[Relay] No agents with required capabilities found. Broadcasting to channel.`);
        // Fallback to broadcast
        this.broadcastToChannel(channelId, {
          type: 'TASK_ASSIGN',
          payload: { task },
          channel: channelId,
          timestamp: Date.now(),
        });
      }
    } else {
      // Otherwise, broadcast to channel
      this.broadcastToChannel(channelId, {
        type: 'TASK_ASSIGN',
        payload: { task },
        channel: channelId,
        timestamp: Date.now(),
      });
    }
  }

  private broadcastToChannel(channelId: string, message: ProtocolMessage): void {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return;
    }

    channel.members.forEach((memberId) => {
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

  /**
   * Send a recovery message to wake up stalled conversations
   */
  private sendRecoveryMessage(
    channelId: string,
    message: string,
    metadata: Record<string, unknown>
  ): void {
    const ch = this.channels.get(channelId);
    if (!ch) {
      console.warn(`[Relay] Cannot send recovery message - channel ${channelId} not found`);
      return;
    }

    const recoveryMsg = {
      id: `recovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'system',
      from: 'stall-detector',
      to: 'broadcast',
      content: message,
      channel: channelId,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        isSystemMessage: true,
        isRecoveryAttempt: true,
      },
    };

    console.log(`[Relay] Sending recovery message to channel ${channelId}`);

    // Broadcast to all channel members
    ch.members.forEach((memberId) => {
      const memberWs = this.sockets.get(memberId);
      if (memberWs && memberWs.readyState === WebSocket.OPEN) {
        this.send(memberWs, {
          type: 'CHANNEL_MESSAGE',
          payload: recoveryMsg,
        });
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
        const inactiveTime = now - agent.lastSeen;

        // If inactive for more than AGENT_TIMEOUT, disconnect
        if (inactiveTime > AGENT_TIMEOUT) {
          console.log(`[Relay] Agent timeout: ${agentId} (inactive for ${inactiveTime}ms)`);
          const ws = this.sockets.get(agentId);
          if (ws) {
            ws.close();
          }
          this.handleAgentDisconnect(agentId);
        }
        // If inactive for more than 1/3 of timeout, send a proactive PING
        else if (inactiveTime > AGENT_TIMEOUT / 3) {
          const ws = this.sockets.get(agentId);
          if (ws && ws.readyState === WebSocket.OPEN) {
            this.send(ws, {
              type: 'PING',
              payload: { timestamp: now, inactiveTime },
            });
          }
        }
      });
    }, HEARTBEAT_INTERVAL / 2); // Check more frequently
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
║   Features:  Stall Detection ✓  Auto-Recovery ✓             ║
║   Part of @the-new-fuse/relay-core                           ║
╚═════════════════════════════════════════════════════════════╝
`);
        this.startHeartbeatMonitor();
        this.stallDetector.start(); // Start stall detection
        console.log('[Relay] Stall detector started');
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

      // Stop stall detector
      this.stallDetector.stop();

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
  // Graceful shutdown
  process.on('SIGINT', () => {
    void (async () => {
      console.log('\n[Relay] Shutting down...');
      await relay.stop();
      process.exit(0);
    })();
  });

  process.on('SIGTERM', () => {
    void (async () => {
      await relay.stop();
      process.exit(0);
    })();
  });
}

export default TNFRelayServer;
