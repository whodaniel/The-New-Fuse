#!/usr/bin/env node
/**
 * Generic federation channel broker (DACC-v1).
 * Extension-free relay bridge for any named channel (Green, Red, etc.).
 */

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { FederationRelayClient } = require(path.join(__dirname, '..', 'lib', 'federation-relay-client.cjs'));
const {
  buildBrokerIdentity,
  parseDaccSignature,
  signDaccMessage,
} = require(path.join(__dirname, '..', 'lib', 'federation-protocol.cjs'));
const {
  createCerReceipt,
  hydrateContextReference,
  storeContextReference,
} = require(path.join(__dirname, '..', 'lib', 'context-reference.cjs'));

const CONFIG = {
  relayUrl:
    process.env.RELAY_URL ||
    process.env.TNF_RELAY_URL ||
    process.env.RELAY_WS_URL ||
    'ws://127.0.0.1:3007/ws',
  channelId: process.env.TNF_FEDERATION_CHANNEL || '',
  computeAgentName: process.env.TNF_FEDERATION_COMPUTE_AGENT || process.env.GEMINI_AGENT_NAME || '',
  inboundLogDir:
    process.env.TNF_FEDERATION_INBOUND_LOG_DIR ||
    path.join(process.env.HOME || '/tmp', '.tnf', 'federation-brokers'),
  heartbeatMs: parseInt(process.env.TNF_FEDERATION_HEARTBEAT_MS || '30000', 10),
  contextRefThreshold: parseInt(process.env.TNF_CONTEXT_REF_THRESHOLD || '1800', 10),
};

function trim(text, max = 180) {
  const value = String(text || '');
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

class FederationChannelBroker {
  constructor(options = {}) {
    this.channelId = options.channelId || CONFIG.channelId;
    this.identity = buildBrokerIdentity(this.channelId);
    this.bridgeTag = this.identity.operationalHandle;
    this.computeAgentName = options.computeAgentName ?? CONFIG.computeAgentName;
    this.inboundLog =
      options.inboundLogFile ||
      path.join(
        options.inboundLogDir || CONFIG.inboundLogDir,
        `${this.channelId.toLowerCase()}-inbound-ai-responses.jsonl`
      );
    this.seenMessageIds = new Set();
    this.redis = options.redis || null;
    this.computeAgent = null;

    this.client = new FederationRelayClient({
      relayUrl: options.relayUrl || CONFIG.relayUrl,
      identity: this.identity,
      platform: 'tnf-runtime',
      agentName: this.identity.operationalHandle,
      capabilities: [
        'federation-channels',
        'channel-broker',
        'broker-routing',
        'multi-agent-chat',
        'standalone-node',
      ],
      channels: [this.channelId],
      registerMetadata: {
        channelColor: options.channelColor || this.channelId.toLowerCase(),
        daccRole: 'broker',
        brokerChannel: this.channelId,
      },
    });

    this.client.on('registered', () => {
      this.client.joinChannel(this.channelId);
      setTimeout(() => this.postSessionBriefing(), 1200);
    });

    this.client.on('channel_message', (payload) => this.handleChannelMessage(payload));
  }

  log(level, message, extra = {}) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        component: this.bridgeTag,
        channel: this.channelId,
        message,
        ...extra,
      })
    );
  }

  async start() {
    this.log('info', 'Starting federation channel broker', {
      relayUrl: CONFIG.relayUrl,
      operationalHandle: this.identity.operationalHandle,
      canonicalEntityId: this.identity.canonicalEntityId,
      computeAgentName: this.computeAgentName || null,
    });

    if (this.redis) {
      await this.redis.initialize();
      await this.redis.register(this.identity.operationalHandle, 'broker', 'tnf-runtime', [
        'federation-channel-bridge',
        'broker-routing',
        'federation-gate',
      ]);
      this.redis.onMessage('response', (msg) => this.handleComputeResponse(msg));
      this.redis.onMessage('message', (msg) => {
        if (
          msg.from?.agentName === this.computeAgentName ||
          msg.from?.platform === this.computeAgentName
        ) {
          this.handleComputeResponse(msg);
        }
      });
      await this.refreshComputeTarget();
      setInterval(() => this.refreshComputeTarget().catch(() => {}), CONFIG.heartbeatMs);
    }

    await this.client.connect();
  }

  async refreshComputeTarget() {
    if (!this.redis || !this.computeAgentName) {
      this.computeAgent = null;
      return;
    }

    const registry = await this.redis.publisher.hgetall('tnf:agent-registry');
    const agents = Object.values(registry)
      .map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter(
        (agent) => agent.name === this.computeAgentName && agent.platform === this.computeAgentName
      )
      .sort((a, b) => Date.parse(b.lastSeen || 0) - Date.parse(a.lastSeen || 0));

    this.computeAgent = agents[0] || null;
    if (this.computeAgent) {
      this.log('info', 'Compute target online', { agentId: this.computeAgent.id });
    }
  }

  isSystemSender(from, metadata = {}) {
    const id = String(from || '').toLowerCase();
    const handle = String(metadata.operationalHandle || '').toLowerCase();
    return (
      !id ||
      id.includes('stall-detector') ||
      id.includes(this.bridgeTag.toLowerCase()) ||
      handle === this.bridgeTag.toLowerCase()
    );
  }

  shouldForwardToCompute(payload) {
    if (!this.computeAgentName || !this.redis) return false;

    const metadata = payload?.metadata || {};
    if (metadata.bridgedBy === this.bridgeTag || metadata.skipComputeBridge) return false;
    if (metadata.isSystemMessage || metadata.isRecoveryAttempt) return false;
    if (metadata.isAIResponse === true) return false;

    const messageType = String(payload?.type || metadata?.messageType || '').toLowerCase();
    if (messageType === 'ai-response' || messageType === 'response') return false;

    const parsed = parseDaccSignature(payload?.content || '');
    if (parsed.handle && /^AGENT-\d+$/i.test(parsed.handle)) return false;

    const content = parsed.body || String(payload?.content || '');
    if (!content.trim()) return false;
    if (content.startsWith('[SYSTEM]')) return false;
    if (/^Conversation phase changed to:/i.test(content)) return false;

    const from = String(payload?.from || '').toLowerCase();
    if (from.includes(this.computeAgentName)) return false;

    if (metadata.routeToCompute === true) return true;
    if (new RegExp(`@${this.computeAgentName}\\b`, 'i').test(content)) return true;
    if (metadata.target === this.computeAgentName || metadata.targetAgent === this.computeAgentName) {
      return true;
    }

    return from.includes('browser') || from.includes('page-agent') || from.includes('chatgpt');
  }

  classifyInboundAi(payload) {
    const metadata = payload?.metadata || {};
    const messageType = String(payload?.type || metadata?.messageType || '').toLowerCase();
    const isAi = metadata.isAIResponse === true || messageType === 'ai-response';
    if (!isAi) return null;

    const parsed = parseDaccSignature(payload?.content || '');
    return {
      platform: String(metadata.platform || 'unknown'),
      senderId: String(metadata.senderId || payload?.from || 'unknown'),
      daccHandle: parsed.handle,
      content: parsed.body || String(payload?.content || ''),
      correlationId: metadata.correlationId || metadata.mcid?.lineage?.correlation_id || null,
      canonicalEntityId: metadata.canonicalEntityId || null,
      idNumber: metadata.idNumber || metadata.federation?.idNumber || null,
    };
  }

  broadcastOnChannel(content, metadata = {}) {
    this.client.sendChannelMessage(this.channelId, content, {
      messageType: metadata.messageType || 'text',
      correlationId: metadata.correlationId,
      metadata: {
        bridgedBy: this.bridgeTag,
        channelColor: this.channelId.toLowerCase(),
        daccRole: 'broker',
        ...metadata,
      },
    });
  }

  postSessionBriefing() {
    this.broadcastOnChannel(
      `${this.channelId} federation session online under DACC-v1. Broker routing active for standalone and networked agents. Use @${this.computeAgentName || 'compute'} when compute routing is configured.`,
      { isSystemMessage: true, sessionKickoff: true, skipComputeBridge: true }
    );
  }

  handleChannelMessage(msg) {
    if (this.isSystemSender(msg.from, msg.metadata)) return;
    if (this.seenMessageIds.has(msg.id)) return;
    if (msg.id) this.seenMessageIds.add(msg.id);

    const inboundAi = this.classifyInboundAi(msg);
    if (inboundAi) {
      this.captureInboundAi(inboundAi, msg);
      return;
    }

    this.log('info', 'Channel traffic', {
      from: msg.from,
      preview: trim(msg.content),
    });

    if (!this.shouldForwardToCompute(msg)) return;
    void this.forwardToCompute(msg);
  }

  captureInboundAi(inboundAi, msg) {
    const record = {
      timestamp: new Date().toISOString(),
      channel: this.channelId,
      platform: inboundAi.platform,
      senderId: inboundAi.senderId,
      daccHandle: inboundAi.daccHandle,
      relayFrom: msg.from,
      messageId: msg.id,
      correlationId: inboundAi.correlationId,
      canonicalEntityId: inboundAi.canonicalEntityId,
      idNumber: inboundAi.idNumber,
      preview: trim(inboundAi.content, 240),
      content: inboundAi.content,
    };

    try {
      fs.mkdirSync(path.dirname(this.inboundLog), { recursive: true });
      fs.appendFileSync(this.inboundLog, `${JSON.stringify(record)}\n`);
    } catch (error) {
      this.log('error', 'Failed to write inbound AI capture', { error: error.message });
    }

    this.log('info', 'Captured federated AI response', {
      platform: inboundAi.platform,
      daccHandle: inboundAi.daccHandle,
      senderId: inboundAi.senderId,
      idNumber: inboundAi.idNumber,
      preview: trim(inboundAi.content),
    });
  }

  async forwardToCompute(msg) {
    try {
      await this.refreshComputeTarget();
      if (!this.computeAgent) {
        this.broadcastOnChannel(
          `${this.computeAgentName} compute worker offline. Start the Redis wrapper for ${this.computeAgentName}.`,
          { isSystemMessage: true }
        );
        return;
      }

      const parsed = parseDaccSignature(msg.content || '');
      let routedContent = parsed.body || String(msg.content || '');
      let contextEfficiency = msg.metadata?.contextEfficiency;
      if (msg.metadata?.contextRef) {
        const hydration = await hydrateContextReference(
          this.redis.publisher,
          msg.metadata.contextRef,
          {
            executionRole: 'executor',
            timeoutMs: Number(process.env.TNF_CONTEXT_HYDRATION_TIMEOUT_MS || 2000),
            inlineBytes: Buffer.byteLength(routedContent, 'utf8'),
          }
        );
        if (hydration.hydrated) {
          routedContent = hydration.content;
          contextEfficiency = hydration.receipt;
        }
      }
      const correlationId = msg.metadata?.correlationId || uuidv4();
      const prompt = signDaccMessage(
        this.identity.operationalHandle,
        `Route to ${this.computeAgentName} compute | channel=${this.channelId} | from=${msg.from}\n${routedContent}`
      );

      await this.redis.send(prompt, {
        type: 'message',
        to: { agentId: this.computeAgent.id, agentName: this.computeAgentName },
        expectsResponse: true,
        metadata: {
          channel: this.channelId,
          routeToCompute: true,
          originalFrom: msg.from,
          originalMessageId: msg.id,
          correlationId,
          mcid: msg.metadata?.mcid,
          bridgedBy: this.bridgeTag,
          brokerHandle: this.identity.operationalHandle,
          contextEfficiency,
        },
      });

      this.log('info', 'Forwarded to compute worker', {
        target: this.computeAgent.id,
        from: msg.from,
        correlationId,
      });
    } catch (error) {
      this.log('error', 'Failed to forward to compute worker', {
        error: error.message,
        from: msg.from,
      });
    }
  }

  async mirrorComputeContent(msg, metadata) {
    let content = String(msg.content || '');
    let mirrorMetadata = { ...metadata };

    if (content.length > CONFIG.contextRefThreshold) {
      const originalContent = content;
      const ttlSeconds = Number(process.env.TNF_CONTEXT_REF_TTL_SECONDS || 3600);
      const { reference } = await storeContextReference(this.redis.publisher, originalContent, {
        ttlSeconds,
        authorityScope: `channel:${this.channelId}`,
        producerAgentId: this.identity.canonicalEntityId,
      });
      content = `${content.slice(0, 320)}\n\n[context_ref: ${reference.uri} | ${reference.byteCount} bytes]`;
      mirrorMetadata.contextRef = reference;
      mirrorMetadata.contextRefUri = reference.uri;
      mirrorMetadata.contextBytes = reference.byteCount;
      mirrorMetadata.contextEfficiency = createCerReceipt(reference, {
        inlineBytes: Buffer.byteLength(content, 'utf8'),
        outcome: 'referenced',
      });
    }

    const relayBody = metadata.originalFrom
      ? `${this.computeAgentName} compute reply (re: ${metadata.originalFrom})\n${content}`
      : `${this.computeAgentName} compute reply\n${content}`;

    this.broadcastOnChannel(relayBody, {
      ...mirrorMetadata,
      messageType: 'ai-response',
      fromCompute: true,
    });
  }

  handleComputeResponse(msg) {
    try {
      const metadata = msg.metadata || {};
      if (metadata.relayPosted) return;

      const channel = metadata.channel || this.channelId;
      if (channel !== this.channelId) return;

      void this.mirrorComputeContent(msg, {
        relayPosted: true,
        replyTo: msg.replyTo || null,
        originalFrom: metadata.originalFrom || null,
        correlationId: metadata.correlationId || null,
      });

      this.log('info', 'Mirrored compute response to channel', { preview: trim(msg.content) });
    } catch (error) {
      this.log('error', 'Failed to mirror compute response', { error: error.message });
    }
  }
}

if (require.main === module) {
  // --- Fleet-wide pause gate (2026-07-21) ---
  const { isFleetPaused } = require(path.join(__dirname, '..', 'lib', 'tnf-fleet-mode.cjs'));
  if (isFleetPaused()) {
    console.log(JSON.stringify({ ok: true, skipped: 'fleet-paused' }));
    process.exit(0);
  }

  if (!CONFIG.channelId) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'FederationChannelBroker',
        message: 'TNF_FEDERATION_CHANNEL is required (Green uses green-channel-coordinator.cjs)',
      })
    );
    process.exit(1);
  }

  const { RedisAgentClient } = require(path.join(__dirname, '..', 'tnf-agent-cli.cjs'));
  const broker = new FederationChannelBroker({
    redis: CONFIG.computeAgentName ? new RedisAgentClient() : null,
    computeAgentName: CONFIG.computeAgentName,
  });

  broker.start().catch((error) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'FederationChannelBroker',
        message: 'Failed to start',
        error: error.message,
      })
    );
    process.exit(1);
  });
}

module.exports = { FederationChannelBroker, CONFIG };
