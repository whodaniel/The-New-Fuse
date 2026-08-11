#!/usr/bin/env node
/**
 * Reusable WebSocket client for TNF federation relay.
 * Extension-free: local CLI agents, channel brokers, and networked runtimes.
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const {
  buildRelayAgentRegister,
  buildRelayMessageSend,
  buildWorkerAgentIdentity,
  buildMcidEnvelope,
  discoverRelayUrl,
  readSessionHandoffLineage,
  resolveMessageTarget,
} = require('./federation-protocol.cjs');

class FederationRelayClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.relayUrl =
      options.relayUrl ||
      process.env.RELAY_URL ||
      process.env.TNF_RELAY_URL ||
      'ws://127.0.0.1:3007/ws';
    this.reconnectMs = options.reconnectMs || 5000;
    this.heartbeatMs = options.heartbeatMs || 30000;
    this.autoReconnect = options.autoReconnect !== false;

    this.identity =
      options.identity ||
      buildWorkerAgentIdentity({
        id: options.agentId,
        operationalHandle: options.operationalHandle || options.agentId,
        platform: options.platform || 'tnf-runtime',
        provider: options.provider || options.platform || 'TNF_RUNTIME',
        channelId: options.defaultChannel || null,
        aliases: options.aliases || [],
        daccRole: options.daccRole || 'participant',
      });

    const sessionLineage = options.sessionLineage || readSessionHandoffLineage(process.cwd());
    if (sessionLineage?.cumulativeId?.id && this.identity.mcid) {
      this.identity.mcid = buildMcidEnvelope({
        tenantId: 'tnf-local',
        sessionKey: this.identity.runtimeSessionId,
        channelId: options.defaultChannel || null,
        correlationId: this.identity.correlationId,
        causationId:
          sessionLineage.cumulativeId.id ||
          sessionLineage.cumulativeId.lineage?.correlation_id ||
          null,
        handoffPacketId: sessionLineage.cumulativeId.lineage?.handoff_packet_id || sessionLineage.handoff_id || null,
      });
    }

    this.capabilities = options.capabilities || ['federation-channels', 'relay-client'];
    this.platform = options.platform || 'tnf-runtime';
    this.agentName = options.agentName || this.identity.operationalHandle;
    this.registerMetadata = options.registerMetadata || {};
    this.ws = null;
    this.connected = false;
    this.registered = false;
    this.agents = new Map();
    this.channels = new Map();
    this.joinedChannels = new Set(options.channels || []);
    this.queue = [];
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
  }

  async connect(relayUrl) {
    if (relayUrl) this.relayUrl = relayUrl;
    const discovered = await discoverRelayUrl(this.relayUrl);
    if (discovered) this.relayUrl = discovered;

    return new Promise((resolve) => {
      this.cleanupSocket();

      this.ws = new WebSocket(this.relayUrl);

      this.ws.on('open', () => {
        this.connected = true;
        this.emit('connected', { relayUrl: this.relayUrl });
        this.registerAgent();
        this.flushQueue();
        this.startHeartbeat();
        resolve(true);
      });

      this.ws.on('message', (data) => {
        try {
          this.handleMessage(JSON.parse(String(data)));
        } catch (error) {
          this.emit('error', error);
        }
      });

      this.ws.on('close', () => {
        this.connected = false;
        this.registered = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        if (this.autoReconnect) this.scheduleReconnect();
        resolve(false);
      });

      this.ws.on('error', (error) => {
        this.emit('error', error);
        resolve(false);
      });
    });
  }

  cleanupSocket() {
    if (!this.ws) return;
    try {
      this.ws.removeAllListeners();
      this.ws.close();
    } catch {
      // ignore
    }
    this.ws = null;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, this.reconnectMs);
  }

  registerAgent() {
    this.sendRaw(
      buildRelayAgentRegister(this.identity, {
        name: this.agentName,
        platform: this.platform,
        capabilities: this.capabilities,
        channels: Array.from(this.joinedChannels),
        metadata: {
          standaloneNode: true,
          federationClient: 'federation-relay-client',
          ...this.registerMetadata,
        },
      })
    );
  }

  joinChannel(channelId) {
    if (!channelId) return;
    this.joinedChannels.add(channelId);
    this.sendEnvelope('CHANNEL_JOIN', { channelId });
    this.registerAgent();
  }

  leaveChannel(channelId) {
    if (!channelId) return;
    this.joinedChannels.delete(channelId);
    this.sendEnvelope('CHANNEL_LEAVE', { channelId });
  }

  requestAgentList() {
    this.sendEnvelope('AGENT_LIST', {});
  }

  requestChannelList() {
    this.sendEnvelope('CHANNEL_LIST', {});
  }

  createChannel(name, description = '', isPrivate = false) {
    this.sendEnvelope('CHANNEL_CREATE', { name, description, isPrivate });
  }

  sendChannelMessage(channelId, content, options = {}) {
    const agents = Array.from(this.agents.values());
    const resolved = resolveMessageTarget(content, agents);
    const message = buildRelayMessageSend(this.identity, {
      channel: channelId,
      to: options.to || resolved.to,
      content: resolved.content,
      messageType: options.messageType || 'text',
      correlationId: options.correlationId,
      causationId: options.causationId,
      metadata: {
        addressedAgentId: resolved.addressedAgentId,
        standaloneNode: true,
        federationClient: 'federation-relay-client',
        ...(options.metadata || {}),
      },
    });
    this.sendRaw(message);
    return message;
  }

  sendEnvelope(type, payload) {
    this.sendRaw({
      id: uuidv4(),
      type,
      timestamp: Date.now(),
      source: this.identity.id,
      payload,
    });
  }

  sendRaw(message) {
    const envelope = {
      id: message.id || uuidv4(),
      timestamp: Date.now(),
      source: message.source || this.identity.id,
      ...message,
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(envelope));
      return envelope;
    }

    this.queue.push(envelope);
    return envelope;
  }

  flushQueue() {
    while (this.queue.length && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(this.queue.shift()));
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendEnvelope('HEARTBEAT', {
        agentId: this.identity.id,
        timestamp: Date.now(),
        idNumber: this.identity.idNumber,
        canonicalEntityId: this.identity.canonicalEntityId,
        metadata: {
          operationalHandle: this.identity.operationalHandle,
          idNumber: this.identity.idNumber,
          canonicalEntityId: this.identity.canonicalEntityId,
          mcid: this.identity.mcid,
        },
      });
    }, this.heartbeatMs);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  handleMessage(message) {
    this.emit('message', message);

    switch (message.type) {
      case 'WELCOME':
        this.requestAgentList();
        this.requestChannelList();
        break;
      case 'REGISTRATION_CONFIRMED': {
        this.registered = true;
        const confirmed = message.payload?.agent || {};
        if (confirmed.idNumber) this.identity.idNumber = confirmed.idNumber;
        if (confirmed.canonicalEntityId) {
          this.identity.canonicalEntityId = confirmed.canonicalEntityId;
        }
        this.emit('registered', message.payload);
        for (const channelId of this.joinedChannels) this.joinChannel(channelId);
        this.requestAgentList();
        this.requestChannelList();
        break;
      }
      case 'REGISTRATION_ERROR':
        this.registered = false;
        this.emit('registration_error', message.payload);
        break;
      case 'AGENT_LIST': {
        const agents = message.payload?.agents || [];
        this.agents = new Map(agents.map((agent) => [agent.id, agent]));
        this.emit('agents_updated', agents);
        break;
      }
      case 'AGENT_STATUS': {
        const agent = message.payload?.agent;
        if (!agent) break;
        if (agent.status === 'offline' || agent.status === 'disconnected') {
          this.agents.delete(agent.id);
        } else {
          this.agents.set(agent.id, agent);
        }
        this.emit('agents_updated', Array.from(this.agents.values()));
        break;
      }
      case 'CHANNEL_LIST': {
        const channels = message.payload?.channels || [];
        if (channels.length) {
          this.channels = new Map(channels.map((channel) => [channel.id, channel]));
          this.emit('channels_updated', channels);
        }
        break;
      }
      case 'CHANNEL_CREATED':
      case 'CHANNEL_JOINED': {
        const channel = message.payload?.channel;
        if (channel) {
          this.channels.set(channel.id, channel);
          this.joinedChannels.add(channel.id);
          this.emit('channels_updated', Array.from(this.channels.values()));
        }
        break;
      }
      case 'CHANNEL_MESSAGE':
      case 'MESSAGE_RECEIVE': {
        const payload = message.payload || {};
        if (
          (payload.messageType === 'A2A_BRIDGE_PING' || payload.metadata?.eventType === 'A2A_BRIDGE_PING') &&
          payload.from !== this.identity.id
        ) {
          this.sendEnvelope('MESSAGE_SEND', {
            to: payload.from || 'broadcast',
            channel: payload.channel || 'fuse-activity-log',
            content: `[A2A_BRIDGE_PONG] from ${this.identity.id}`,
            messageType: 'event',
            metadata: {
              eventType: 'A2A_BRIDGE_PONG',
              correlationId: payload.metadata?.correlationId,
              agentId: this.identity.id,
              timestamp: Date.now()
            }
          });
        }
        this.emit('channel_message', payload);
        break;
      }
      default:
        break;
    }
  }

  getState() {
    return {
      relayUrl: this.relayUrl,
      connected: this.connected,
      registered: this.registered,
      identity: this.identity,
      agents: Array.from(this.agents.values()),
      channels: Array.from(this.channels.values()),
      joinedChannels: Array.from(this.joinedChannels),
    };
  }

  async close() {
    this.autoReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    this.cleanupSocket();
  }
}

module.exports = { FederationRelayClient };
