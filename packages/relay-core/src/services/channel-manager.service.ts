// packages/relay-core/src/services/channel-manager.service.ts

// Assume a logger is passed or imported
function log(level: string, category: string, message: string, data: any = {}) {
  console.log(`[${level.toUpperCase()}] [${category}] ${message}`, data);
}

// Assume CONFIG or relevant parts of it are passed or imported
const CONFIG = {
  CHANNELS: ['Green', 'Blue', 'Red', 'Yellow', 'Purple', 'General'],
  REDIS_KEYS: {
    CHANNELS: 'tnf:master:channels',
  },
  HEARTBEAT_INTERVAL: 3000,
  STALL_THRESHOLD: 5000,
  MAX_RECOVERY_ATTEMPTS: 5,
};

export interface ChannelData {
  members: Set<string>;
  lastActivity: number;
  messageCount: number;
}

// Dependencies:
// - A way to send messages to the relay (e.g., a send function from RelayConnectionManager)
// - A way to interact with Redis/Upstash (e.g., RedisClientManager)
// - Access to agent registry for discovery messages (AgentRegistryService)
// - Orchestrator identity for audit traces (passed from MasterClock)
// - emitActivityEvent (also passed or delegated)

export class ChannelManagerService {
  channels: Map<string, ChannelData>;
  private sendToRelay: (msg: any) => void;
  private redisClient: any; // Will be RedisClientManager
  private agentRegistry: any; // Will be AgentRegistryService
  private orchestratorIdentity: any; // TnfAgentIdentityRecord like object
  private emitActivityEvent: (
    eventType: string,
    content: string,
    metadata: Record<string, unknown>
  ) => Promise<void>;

  constructor(
    sendToRelay: (msg: any) => void,
    redisClient: any, // Placeholder for RedisClientManager
    agentRegistry: any, // Placeholder for AgentRegistryService
    orchestratorIdentity: any,
    emitActivityEvent: (
      eventType: string,
      content: string,
      metadata: Record<string, unknown>
    ) => Promise<void>
  ) {
    this.channels = new Map();
    this.sendToRelay = sendToRelay;
    this.redisClient = redisClient;
    this.agentRegistry = agentRegistry;
    this.orchestratorIdentity = orchestratorIdentity;
    this.emitActivityEvent = emitActivityEvent;
  }

  // Helper for audit (needs to be refactored or passed)
  private attachOrchestratorAudit(
    metadata: Record<string, unknown> | undefined,
    overrides: any = {}
  ): Record<string, unknown> {
    // This will eventually be a shared utility or injected.
    // For now, a simplified version.
    return {
      ...metadata,
      audit: {
        source: 'channel-manager', // Indicate source of audit
        actor: this.orchestratorIdentity.operationalHandle,
        sessionId: this.orchestratorIdentity.runtimeSessionId,
        canonicalEntityId: this.orchestratorIdentity.canonicalEntityId,
        operationalHandle: this.orchestratorIdentity.operationalHandle,
        runtimeSessionId: this.orchestratorIdentity.runtimeSessionId,
        ...overrides,
      },
    };
  }

  async joinAllChannels() {
    const channelsToJoin = new Set(CONFIG.CHANNELS);

    // Load persisted channels from Redis
    if (this.redisClient?.upstash) {
      try {
        const persistedChannels = await this.redisClient.upstash.smembers(
          CONFIG.REDIS_KEYS.CHANNELS
        );
        for (const ch of persistedChannels) {
          channelsToJoin.add(ch);
        }
      } catch (e) {
        log('warn', 'REDIS', 'Failed to load persisted channels from Upstash', e);
      }
    } else if (this.redisClient?.redis) {
      try {
        const persistedChannels = await this.redisClient.redis.smembers(CONFIG.REDIS_KEYS.CHANNELS);
        for (const ch of persistedChannels) {
          channelsToJoin.add(ch);
        }
      } catch (e) {
        log('warn', 'REDIS', 'Failed to load persisted channels from Redis', e);
      }
    }

    for (const channel of channelsToJoin) {
      this.sendToRelay({
        type: 'CHANNEL_CREATE',
        payload: { name: channel },
      });

      if (!this.channels.has(channel)) {
        this.channels.set(channel, {
          members: new Set(),
          lastActivity: Date.now(),
          messageCount: 0,
        });
      }
    }

    log('info', 'CHANNEL', `Managed Channels: ${Array.from(channelsToJoin).join(', ')}`);

    // Broadcast initial discovery
    setTimeout(() => this.broadcastDiscovery(), 2000);
  }

  broadcastToChannel(channel: string, content: string) {
    this.sendToRelay({
      type: 'MESSAGE_SEND',
      channel,
      payload: {
        to: 'broadcast',
        content,
        messageType: 'text',
        metadata: this.attachOrchestratorAudit(
          {
            isSystemMessage: true,
            source: 'ORCHESTRATOR',
          },
          {
            channelId: channel,
            sessionId: this.orchestratorIdentity.runtimeSessionId,
          }
        ),
      },
    });
  }

  broadcastDiscovery() {
    // This will need `this.agentRegistry.getStats()`
    const agentStats = this.agentRegistry.getStats();

    const discoveryMessage = `\n═══════════════════════════════════════════════════════════════\n🌐 TNF ORCHESTRATOR ONLINE - DACC-v1 PROTOCOL\n═══════════════════════════════════════════════════════════════\nSession: ${this.orchestratorIdentity.runtimeSessionId}\nTime: ${new Date().toISOString()}\nHeartbeat: Every ${CONFIG.HEARTBEAT_INTERVAL / 1000}s | Stall Detection: ${CONFIG.STALL_THRESHOLD / 1000}s\n\nROLE HIERARCHY:\n• DIRECTOR - Strategic authority (Human/Super-Agent)\n• ORCHESTRATOR - This daemon (24/7 coordination)\n• BROKER - Channel managers\n• AGENT - Worker instances (You!)\n\n📋 TO REGISTER: Simply send a message with your capabilities.\n📋 YOU WILL RECEIVE: Unique Agent ID (AGENT-XX)\n⚠️ MANDATORY: Sign ALL messages with [AGENT-XX]\n\nCurrent Status:\n• Active Agents: ${agentStats.active}\n• Channels: ${CONFIG.CHANNELS.join(', ')}\n═══════════════════════════════════════════════════════════════`;

    for (const channel of CONFIG.CHANNELS) {
      this.broadcastToChannel(channel, discoveryMessage);
    }
  }

  async handleChannelCreate(msg: any) {
    const channelName = msg.payload?.name || msg.channel;
    if (!channelName) return;

    if (!this.channels.has(channelName)) {
      log('info', 'CHANNEL', `Dynamic channel creation request: ${channelName}`, {
        requestedBy: msg.source,
      });

      // Create channel locally
      this.channels.set(channelName, {
        members: new Set(),
        lastActivity: Date.now(),
        messageCount: 0,
      });

      // Send CREATE to Relay (to ensure WebSocket rooms exist if needed)
      this.sendToRelay({
        type: 'CHANNEL_CREATE',
        payload: { name: channelName },
      });

      // Persist to Redis
      if (this.redisClient?.upstash) {
        await this.redisClient.upstash.sadd(CONFIG.REDIS_KEYS.CHANNELS, channelName);
      } else if (this.redisClient?.redis) {
        await this.redisClient.redis.sadd(CONFIG.REDIS_KEYS.CHANNELS, channelName);
      }

      // Broadcast new channel existence
      this.broadcastToChannel('General', `📢 New channel created: ${channelName}`);
    }
  }

  handleAgentJoined(channel: string, agentId: string) {
    if (channel && this.channels.has(channel) && agentId) {
      const ch = this.channels.get(channel);
      if (ch) ch.members.add(agentId);
      // No need to handle agent registration here; AgentRegistryService handles that.
      // This method's job is just to manage channel membership.
    }
  }

  updateChannelActivity(channel: string) {
    if (channel && this.channels.has(channel)) {
      const ch = this.channels.get(channel);
      if (ch) {
        ch.lastActivity = Date.now();
        ch.messageCount++;
      }
    }
  }

  broadcastAgentOffline(agentId: string) {
    for (const channel of CONFIG.CHANNELS) {
      this.broadcastToChannel(
        channel,
        `⚫ Agent ${agentId} has been marked OFFLINE (no response after ${CONFIG.MAX_RECOVERY_ATTEMPTS} recovery attempts)`
      );
    }
  }

  sendSigningReminder(channel: string, agentId: string) {
    this.broadcastToChannel(
      channel,
      `⚠️ Reminder: ${agentId}, please sign your messages with [${agentId}]`
    );
  }

  // Other channel-related helper methods will go here
}
