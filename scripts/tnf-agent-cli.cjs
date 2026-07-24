#!/usr/bin/env node

/**
 * TNF Agent CLI - Redis-Based Agent Communication System
 *
 * This CLI allows AI agents (Antigravity, Gemini, Claude, Jules) to:
 * - Register themselves on the Redis network
 * - Send and receive messages
 * - Participate in conversations
 * - Act as Orchestrator, Broker, or Worker
 *
 * Usage:
 *   node tnf-agent-cli.js register --name "antigravity" --role orchestrator
 *   node tnf-agent-cli.js listen
 *   node tnf-agent-cli.js send "Hello from Antigravity!"
 *   node tnf-agent-cli.js convo start "code-review"
 */

const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');
const crypto = require('crypto');
const fs = require('node:fs');
const path = require('node:path');
const { findBestMatch } = require('./lib/tnf-agent-match.cjs');
const { recommendModel } = require('./lib/tnf-model-match.cjs');
const messageAuth = require('./lib/tnf-message-auth.cjs');
const identity = require('./lib/tnf-identity.cjs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    keyPrefix: 'tnf:',
  },
  channels: {
    agents: 'tnf:agents',
    conversations: 'tnf:conversations',
    orchestrator: 'tnf:orchestrator',
    broker: 'tnf:broker',
    heartbeat: 'tnf:heartbeat',
    ingress: 'tnf:bus:ingress',
    egressPrefix: 'tnf:bus:egress',
    directPrefix: 'tnf:direct',
  },
  heartbeatInterval: 30000, // 30 seconds
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * @typedef {Object} AgentInfo
 * @property {string} id
 * @property {string} name
 * @property {'orchestrator'|'broker'|'worker'|'participant'} role
 * @property {'antigravity'|'gemini'|'claude'|'jules'|'pi'|'vscode'|'browser'} platform
 * @property {'active'|'idle'|'offline'} status
 * @property {string[]} capabilities
 * @property {string} registeredAt
 * @property {string} lastSeen
 */

/**
 * @typedef {Object} AgentMessage
 * @property {string} id
 * @property {string} timestamp
 * @property {Object} from
 * @property {Object} [to]
 * @property {'message'|'command'|'response'|'heartbeat'|'status'} type
 * @property {string} content
 * @property {string} [conversationId]
 * @property {string} [replyTo]
 * @property {boolean} [expectsResponse]
 * @property {Object} [metadata]
 */

// ============================================================================
// REDIS AGENT CLIENT
// ============================================================================

class RedisAgentClient {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
    this.agentInfo = null;
    this.messageHandlers = new Map();
    this.heartbeatTimer = null;
    this.currentConversation = null;
  }

  /**
   * Initialize Redis connections
   */
  async initialize() {
    const redisConfig = {
      host: CONFIG.redis.host,
      port: CONFIG.redis.port,
      password: CONFIG.redis.password,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    };

    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    this.subscriber.on('message', (channel, message) => {
      this.handleIncomingMessage(channel, message);
    });
    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      this.handleIncomingMessage(channel, message);
    });

    this.subscriber.on('error', (error) => {
      console.error('Redis subscriber error:', error.message);
    });

    this.publisher.on('error', (error) => {
      console.error('Redis publisher error:', error.message);
    });

    console.log(`✅ Connected to Redis at ${CONFIG.redis.host}:${CONFIG.redis.port}`);
  }

  /**
   * Register this agent on the network
   */
  async register(name, role, platform, capabilities = []) {
    const preferredId = String(process.env.AGENT_ID || process.env.TNF_AGENT_ID || '').trim();
    const resolvedId = preferredId || `agent_${name}_${Date.now()}`;

    // Authority role is operator-owned (Phase 1). Operational role (orchestrator /
    // broker / worker / …) stays for Redis routing; privilege decisions must use
    // authorityRole from the registry, never a self-asserted elevated title.
    const requestedAuthority = identity.isValidRole(role) ? role : 'worker';
    const bootstrapped = identity.bootstrapAgentIdentity(resolvedId, requestedAuthority);
    if (bootstrapped.elevatedRequestIgnored) {
      console.warn(
        `[tnf-identity] elevated role ${JSON.stringify(role)} ignored for ${resolvedId}; ` +
          'operator must grant via roles.json (tnf-identity setAgentRole)'
      );
    }

    this.agentInfo = {
      id: resolvedId,
      name,
      role,
      authorityRole: bootstrapped.role,
      authoritySource: bootstrapped.roleSource,
      platform,
      status: 'active',
      capabilities: capabilities.length > 0 ? capabilities : this.getDefaultCapabilities(platform),
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      routing: {
        callableWorker: String(role || '').toLowerCase() === 'worker',
        directorPoolEligible: String(role || '').toLowerCase() === 'worker',
      },
    };

    // Store in Redis
    await this.publisher.hset(
      'tnf:agent-registry',
      this.agentInfo.id,
      JSON.stringify(this.agentInfo)
    );

    // Subscribe to channels
    await this.subscriber.subscribe(
      CONFIG.channels.agents,
      CONFIG.channels.conversations,
      CONFIG.channels.orchestrator,
      CONFIG.channels.broker,
      CONFIG.channels.ingress,
      `${CONFIG.channels.egressPrefix}:${this.agentInfo.id}`
    );
    await this.subscriber.psubscribe(`${CONFIG.channels.directPrefix}:*:${this.agentInfo.id}`);

    // Announce registration
    await this.broadcast({
      type: 'status',
      content: `Agent ${name} (${role}) is now online`,
      metadata: { event: 'agent_registered', agentInfo: this.agentInfo },
    });

    // Start heartbeat
    this.startHeartbeat();

    console.log(`🤖 Registered as: ${name} (${role}) on ${platform}`);
    console.log(`   ID: ${this.agentInfo.id}`);
    console.log(`   Capabilities: ${this.agentInfo.capabilities.join(', ')}`);

    return this.agentInfo;
  }

  /**
   * Get default capabilities based on platform
   */
  getDefaultCapabilities(platform) {
    const capabilityMap = {
      antigravity: ['code_assistance', 'orchestration', 'planning', 'analysis'],
      gemini: ['code_analysis', 'research', 'implementation', 'review'],
      claude: ['reasoning', 'review', 'synthesis', 'documentation'],
      jules: ['parallel_execution', 'github_commits', 'refactoring', 'batch_processing'],
      pi: [
        'autonomous_code_editing',
        'multi_provider_inference',
        'validation_pipeline',
        'handoff_export',
        'model_watchdog_reporting',
        'director_callable_worker',
        'broker_routed_task_execution',
        'task_execution',
      ],
      vscode: ['code_editing', 'terminal', 'debugging', 'extensions'],
      browser: ['web_scraping', 'research', 'automation'],
    };
    return capabilityMap[platform] || ['general'];
  }

  /**
   * Send a message to the network
   */

  /**
   * Sign an outgoing envelope.
   *
   * Delegates to lib/tnf-message-auth.cjs so signing and verification share one
   * canonical serialization. The previous inline implementation used plain
   * JSON.stringify (key-order dependent) and fell back to a literal
   * 'default-secret' when A2A_SECRET_KEY was unset — both now refused at the
   * library boundary.
   */
  signMessage(data, type, channel) {
    return messageAuth.signEnvelope(
      { agent_id: this.agentInfo.id },
      { type, channel, data }
    );
  }

  /**
   * Verify an inbound envelope and decide whether to drop it.
   *
   * Unsigned traffic is reported as such rather than silently trusted: plenty
   * of publishers on this bus (relay-core, external bridges) do not sign yet,
   * which is exactly why TNF_MESSAGE_AUTH_MODE defaults to `warn`. Run in
   * `warn` until the audit log is clean, then flip to `enforce`.
   *
   * @returns {{ verified: boolean, reject: boolean, agentId?: string }}
   */
  authenticateEnvelope(rawMessage, channel) {
    if (!messageAuth.isSignedEnvelope(rawMessage)) {
      const reject = messageAuth.getMode() === 'enforce';
      messageAuth.audit({
        event: 'message_auth_unsigned',
        mode: messageAuth.getMode(),
        action: reject ? 'rejected' : 'allowed_warn_mode',
        reason: 'envelope carries no signature',
        channel: channel ?? null,
        claimed_agent_id: rawMessage?.from?.agentId ?? null,
        claimed_role: rawMessage?.from?.role ?? null,
      });
      return { verified: false, reject };
    }

    const result = messageAuth.verifyAndAudit(rawMessage, {
      channel,
      messageId: rawMessage?.payload?.data?.id ?? null,
      claimedRole: rawMessage?.payload?.data?.from?.role ?? null,
    });
    return {
      verified: result.ok,
      reject: result.reject,
      agentId: result.agentId,
      kid: result.kid ?? null,
      // Only an Ed25519 envelope proves WHICH agent sent it. A shared-secret
      // envelope proves bus membership, which every agent has — so it must
      // never be allowed to resolve a privileged role.
      identityBound: Boolean(result.ok && result.identityBound),
    };
  }

  async send(content, options = {}) {
    if (!this.agentInfo) {
      throw new Error('Agent not registered. Call register() first.');
    }

    const message = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      from: {
        agentId: this.agentInfo.id,
        agentName: this.agentInfo.name,
        role: this.agentInfo.role,
        platform: this.agentInfo.platform,
      },
      to: options.to,
      type: options.type || 'message',
      content,
      conversationId: options.conversationId || this.currentConversation,
      replyTo: options.replyTo,
      expectsResponse: options.expectsResponse,
      metadata: options.metadata,
    };

    const directAgentId = options?.to?.agentId
      ? String(options.to.agentId).trim()
      : '';
    const channel = directAgentId
      ? `${CONFIG.channels.directPrefix}:${this.agentInfo.id}:${directAgentId}`
      : options.channel || CONFIG.channels.conversations;
    const signedMessage = this.signMessage(message, message.type, channel);
    await this.publisher.publish(channel, JSON.stringify(signedMessage));

    console.log(
      `📤 Sent [${message.type}]: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
    );

    return message;
  }

  /**
   * Broadcast to all agents
   */
  async broadcast(options) {
    return this.send(options.content, {
      ...options,
      channel: CONFIG.channels.agents,
      to: { broadcast: true },
    });
  }

  /**
   * Send a command (as orchestrator)
   */
  async command(targetAgent, commandContent, metadata = {}) {
    return this.send(commandContent, {
      type: 'command',
      channel: CONFIG.channels.orchestrator,
      to: { agentId: targetAgent },
      expectsResponse: true,
      metadata,
    });
  }

  /**
   * Start a new conversation
   */
  async startConversation(topic) {
    this.currentConversation = `convo_${topic}_${Date.now()}`;

    await this.broadcast({
      type: 'status',
      content: `Started conversation: "${topic}"`,
      metadata: {
        event: 'conversation_started',
        conversationId: this.currentConversation,
        topic,
      },
    });

    console.log(`💬 Started conversation: ${topic}`);
    console.log(`   ID: ${this.currentConversation}`);

    return this.currentConversation;
  }

  /**
   * Join an existing conversation
   */
  joinConversation(conversationId) {
    this.currentConversation = conversationId;
    console.log(`🔗 Joined conversation: ${conversationId}`);
  }

  /**
   * Handle incoming messages
   */
  handleIncomingMessage(channel, messageStr) {
    try {
      const rawMessage = JSON.parse(messageStr);

      // Authenticate BEFORE anything reads the contents. Until 2026-07-23 the
      // signature attached by signMessage() was never checked anywhere, so a
      // sender's claimed identity and role were accepted verbatim from the
      // wire on an unauthenticated Redis bus. Everything below this line
      // treats the envelope as attacker-controlled until proven otherwise.
      const authResult = this.authenticateEnvelope(rawMessage, channel);
      if (authResult.reject) return;

      const message = this.normalizeIncomingMessage(rawMessage, authResult);
      if (!message) return;

      // Don't process our own messages
      if (message.from?.agentId === this.agentInfo?.id) {
        return;
      }

      // Log the message
      this.logIncomingMessage(message);

      // DIRECTIVES.md D22 (Delegation-First Check): before dispatching a
      // task-type message, see if a more specialized TNF agent is a
      // stronger fit. Suggest and log only — never silently reroute (see
      // D22/D8 in DIRECTIVES.md for why). Single chokepoint shared by every
      // Redis-driven wrapper (pi/jules/gemini/...), so this applies to all
      // of them from one place.
      if (message.type === 'task') {
        this.logDelegationSuggestion(message);
      }

      // Call registered handlers
      const handlers = this.messageHandlers.get(message.type) || [];
      handlers.forEach((handler) => handler(message, channel));

      // Call catch-all handlers
      const allHandlers = this.messageHandlers.get('*') || [];
      allHandlers.forEach((handler) => handler(message, channel));
    } catch (error) {
      console.error('Error parsing message:', error.message);
    }
  }

  normalizeIncomingMessage(rawMessage, authResult = { verified: false }) {
    if (!rawMessage || typeof rawMessage !== 'object') {
      return null;
    }

    // Unpack signed messages. The signature was checked in
    // authenticateEnvelope() before we got here — this step is pure
    // structural unwrapping and must never be the thing that decides trust.
    let msg = rawMessage;
    if (messageAuth.isSignedEnvelope(rawMessage)) {
      if (rawMessage.payload.data && typeof rawMessage.payload.data === 'object') {
        msg = rawMessage.payload.data;
      }
    }

    const hasEnvelopeShape =
      typeof msg.id === 'string' &&
      typeof msg.type === 'string' &&
      msg.from &&
      typeof msg.from === 'object' &&
      msg.payload &&
      typeof msg.payload === 'object' &&
      (typeof msg.traceId === 'string' ||
        msg.version === '1.0' ||
        msg.type === 'task' ||
        msg.type === 'event' ||
        msg.type === 'query');

    if (!hasEnvelopeShape) {
      return msg;
    }

    const payload = msg.payload || {};
    const task = payload.task && typeof payload.task === 'object' ? payload.task : null;
    const taskContent =
      payload.message ||
      payload.prompt ||
      this.formatTaskForWorker(task) ||
      task?.description ||
      task?.title ||
      task?.content ||
      payload.action ||
      null;

    let content = '';
    if (typeof taskContent === 'string' && taskContent.trim()) {
      content = taskContent.trim();
    } else {
      content = JSON.stringify(payload);
    }

    // Authoritative role comes from the operator-owned registry keyed by the
    // verified agent_id (Phase 1). Wire claims are recorded only.
    // See DIRECTIVES.md D8/D23.
    // Only an identity-bound (Ed25519) envelope may resolve a registry role. A
    // shared-secret envelope verifies, but proves only that the sender holds
    // the bus-wide key — which every agent does. Treating it as an identity
    // would let any bus member sign as the sub-director and inherit the
    // grant, the exact hole this layer exists to close.
    const claimedRole = msg.from.role || 'worker';
    const identityBound = Boolean(authResult?.identityBound);
    const verifiedId = identityBound
      ? authResult?.agentId || msg.from.agentId || msg.from.id
      : null;
    const resolvedRole = identity.resolveRoleForMessage({
      verified: identityBound,
      agentId: verifiedId,
      claimedRole,
    });

    return {
      id: msg.id || uuidv4(),
      timestamp: msg.timestamp || new Date().toISOString(),
      from: {
        agentId: msg.from.agentId || msg.from.id || 'unknown',
        agentName:
          msg.from.agentName ||
          msg.from.operationalHandle ||
          msg.from.agentId ||
          'unknown',
        role: resolvedRole.role,
        claimedRole,
        roleVerified: Boolean(resolvedRole.roleVerified),
        authoritySource: resolvedRole.source,
        claimMismatch: Boolean(resolvedRole.claimMismatch),
        platform: msg.from.platform || 'relay-core',
      },
      auth: {
        verified: Boolean(authResult?.verified),
        identityBound,
        kid: authResult?.kid ?? null,
        agentId: authResult?.agentId ?? null,
      },
      to: msg.to,
      type: msg.type,
      content,
      payload,
      conversationId:
        msg.context?.sessionId || msg.context?.workflowId || msg.conversationId,
      replyTo: msg.context?.parentMessageId || msg.replyTo,
      expectsResponse:
        msg.type === 'task' ||
        msg.type === 'query' ||
        Boolean(msg.expectsResponse),
      metadata: {
        ...(typeof msg.metadata === 'object' ? msg.metadata : {}),
        payload,
        tnfEnvelope: true,
      },
    };
  }

  formatTaskForWorker(task) {
    if (!task || typeof task !== 'object') {
      return null;
    }

    const lines = [];
    const title = typeof task.title === 'string' ? task.title.trim() : '';
    const description = typeof task.description === 'string' ? task.description.trim() : '';
    const content = typeof task.content === 'string' ? task.content.trim() : '';

    if (title) lines.push(`Task: ${title}`);
    if (description && description !== title) lines.push(`Description: ${description}`);
    if (content && content !== description && content !== title) lines.push(content);

    const acceptanceCriteria = Array.isArray(task.acceptanceCriteria)
      ? task.acceptanceCriteria
      : Array.isArray(task.acceptance_criteria)
        ? task.acceptance_criteria
        : [];

    const cleanCriteria = acceptanceCriteria
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);

    if (cleanCriteria.length > 0) {
      lines.push(`Acceptance criteria:\n${cleanCriteria.map((item) => `- ${item}`).join('\n')}`);
    }

    if (typeof task.priority === 'string' && task.priority.trim()) {
      lines.push(`Priority: ${task.priority.trim()}`);
    }

    if (Array.isArray(task.requiredCapabilities) && task.requiredCapabilities.length > 0) {
      const capabilities = task.requiredCapabilities
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
      if (capabilities.length > 0) {
        lines.push(`Required capabilities: ${capabilities.join(', ')}`);
      }
    }

    return lines.length > 0 ? lines.join('\n\n') : null;
  }

  /**
   * Log incoming message nicely
   */
  logIncomingMessage(message) {
    const fromName = message.from?.agentName || 'Unknown';
    const fromRole = message.from?.role || '';
    const type = message.type || 'message';
    const content = message.content || '';

    const roleEmoji = {
      orchestrator: '👑',
      broker: '🎯',
      worker: '⚙️',
      participant: '💬',
    };

    const emoji = roleEmoji[fromRole] || '📨';

    console.log(`\n${emoji} [${fromName}] (${type}):`);
    console.log(`   ${content}`);

    if (message.metadata?.event) {
      console.log(`   Event: ${message.metadata.event}`);
    }

    if (message.expectsResponse) {
      console.log(`   ⏳ Expects response`);
    }
  }

  /**
   * DIRECTIVES.md D22: check the local agent capability index for a
   * stronger-fit specialized agent before this task gets processed here.
   * Suggest and log only (see D22/D8) — never reroutes automatically.
   */
  logDelegationSuggestion(message) {
    try {
      const taskText = String(message.content || '').trim();
      if (!taskText) return;

      const matches = findBestMatch(taskText, { limit: 1 });
      if (matches.length === 0) return;

      const topMatch = matches[0];
      const currentAgentName = this.agentInfo?.name;
      if (topMatch.name === currentAgentName) return;

      // Model-level recommendation alongside the agent-level one — "which
      // agent persona" and "which underlying LLM model" are both part of
      // routing a task optimally, raised together 2026-07-23. Currently
      // general health/latency/priority ranking only (real NVIDIA NGC data,
      // not simulated) — not yet task-category-aware; see
      // scripts/lib/tnf-model-match.cjs for why, and the tracked follow-up
      // to fix the underlying per-category benchmark scrapers.
      const modelRecommendation = recommendModel({ limit: 1 });
      const topModel = modelRecommendation.models[0] || null;

      const logDir = path.join(process.cwd(), '.agent', 'runtime-logs');
      fs.mkdirSync(logDir, { recursive: true });
      const logPath = path.join(logDir, 'delegation-suggestions.jsonl');
      const entry = {
        timestamp: new Date().toISOString(),
        currentAgent: currentAgentName || 'unknown',
        currentAgentId: this.agentInfo?.id || null,
        suggestedAgent: topMatch.name,
        score: topMatch.score,
        recommendedModel: topModel?.model || null,
        recommendedModelStale: modelRecommendation.stale,
        taskPreview: taskText.slice(0, 200),
        messageId: message.id || null,
      };
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
    } catch (error) {
      // Never let a delegation-suggestion failure block real task processing.
      console.error('D22 delegation check failed (non-fatal):', error.message);
    }
  }

  /**
   * Register a message handler
   */
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  /**
   * Start heartbeat
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      if (this.agentInfo) {
        this.agentInfo.lastSeen = new Date().toISOString();

        await this.publisher.hset(
          'tnf:agent-registry',
          this.agentInfo.id,
          JSON.stringify(this.agentInfo)
        );

        await this.publisher.publish(
          CONFIG.channels.heartbeat,
          JSON.stringify({
            agentId: this.agentInfo.id,
            agentName: this.agentInfo.name,
            timestamp: this.agentInfo.lastSeen,
          })
        );
      }
    }, CONFIG.heartbeatInterval);
  }

  /**
   * List all registered agents
   */
  async listAgents() {
    const agents = await this.publisher.hgetall('tnf:agent-registry');
    const agentList = [];

    for (const [id, jsonStr] of Object.entries(agents)) {
      try {
        const agent = JSON.parse(jsonStr);
        const lastSeen = new Date(agent.lastSeen);
        const isOnline = Date.now() - lastSeen.getTime() < CONFIG.heartbeatInterval * 2;

        agentList.push({
          ...agent,
          isOnline,
        });
      } catch (e) {
        console.warn(`Invalid agent data for ${id}`);
      }
    }

    return agentList;
  }

  /**
   * Cleanup and disconnect
   */
  async cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.agentInfo) {
      this.agentInfo.status = 'offline';
      await this.publisher.hset(
        'tnf:agent-registry',
        this.agentInfo.id,
        JSON.stringify(this.agentInfo)
      );

      await this.broadcast({
        type: 'status',
        content: `Agent ${this.agentInfo.name} is going offline`,
        metadata: { event: 'agent_offline' },
      });
    }

    await this.subscriber.quit();
    await this.publisher.quit();

    console.log('👋 Disconnected from Redis network');
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const client = new RedisAgentClient();

  try {
    await client.initialize();

    switch (command) {
      case 'register': {
        const name = args[1] || process.env.AGENT_NAME || 'unnamed-agent';
        const role = args[2] || process.env.AGENT_ROLE || 'participant';
        const platform = args[3] || process.env.AGENT_PLATFORM || 'vscode';

        await client.register(name, role, platform);

        // Keep running and listening
        console.log('\n🎧 Listening for messages... (Ctrl+C to exit)\n');

        // Set up interactive mode
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.on('line', async (line) => {
          if (line.trim()) {
            await client.send(line.trim());
          }
        });

        rl.on('close', async () => {
          await client.cleanup();
          process.exit(0);
        });

        // Handle Ctrl+C
        process.on('SIGINT', async () => {
          await client.cleanup();
          process.exit(0);
        });

        break;
      }

      case 'list': {
        const agents = await client.listAgents();

        console.log('\n📋 Registered Agents:\n');

        if (agents.length === 0) {
          console.log('   No agents registered');
        } else {
          agents.forEach((agent) => {
            const statusIcon = agent.isOnline ? '🟢' : '🔴';
            const roleIcon =
              {
                orchestrator: '👑',
                broker: '🎯',
                worker: '⚙️',
                participant: '💬',
              }[agent.role] || '📦';

            console.log(`${statusIcon} ${roleIcon} ${agent.name} (${agent.platform})`);
            console.log(`      Role: ${agent.role}`);
            console.log(`      ID: ${agent.id}`);
            console.log(`      Last seen: ${agent.lastSeen}`);
            console.log('');
          });
        }

        await client.cleanup();
        break;
      }

      case 'send': {
        const name = process.env.AGENT_NAME || 'cli-sender';
        const message = args.slice(1).join(' ');

        if (!message) {
          console.error('Usage: tnf-agent-cli.js send <message>');
          process.exit(1);
        }

        await client.register(name, 'participant', 'vscode');
        await client.send(message);

        // Wait a moment for any immediate responses
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await client.cleanup();
        break;
      }

      case 'convo': {
        const subCommand = args[1];
        const name = process.env.AGENT_NAME || 'convo-participant';

        if (subCommand === 'start') {
          const topic = args[2] || 'general';
          await client.register(name, 'participant', 'vscode');
          await client.startConversation(topic);

          console.log('\n💬 Conversation started. Type messages:\n');

          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          rl.on('line', async (line) => {
            if (line.trim()) {
              await client.send(line.trim());
            }
          });

          rl.on('close', async () => {
            await client.cleanup();
            process.exit(0);
          });

          process.on('SIGINT', async () => {
            await client.cleanup();
            process.exit(0);
          });
        } else if (subCommand === 'join') {
          const conversationId = args[2];

          if (!conversationId) {
            console.error('Usage: tnf-agent-cli.js convo join <conversation-id>');
            process.exit(1);
          }

          await client.register(name, 'participant', 'vscode');
          client.joinConversation(conversationId);

          console.log('\n🔗 Joined conversation. Type messages:\n');

          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          rl.on('line', async (line) => {
            if (line.trim()) {
              await client.send(line.trim());
            }
          });

          rl.on('close', async () => {
            await client.cleanup();
            process.exit(0);
          });

          process.on('SIGINT', async () => {
            await client.cleanup();
            process.exit(0);
          });
        } else {
          console.error('Usage: tnf-agent-cli.js convo <start|join> [topic|id]');
          process.exit(1);
        }
        break;
      }

      case 'help':
      default: {
        console.log(`
TNF Agent CLI - Multi-Agent Redis Communication

Commands:
  register <name> <role> <platform>   Register and listen as an agent
  list                                List all registered agents
  send <message>                      Send a single message
  convo start <topic>                 Start a new conversation
  convo join <id>                     Join an existing conversation

Roles: orchestrator, broker, worker, participant
Platforms: antigravity, gemini, claude, jules, pi, vscode, browser

Environment Variables:
  REDIS_HOST      Redis host (default: localhost)
  REDIS_PORT      Redis port (default: 6380)
  REDIS_PASSWORD  Redis password (optional)
  AGENT_NAME      Default agent name
  AGENT_ROLE      Default agent role
  AGENT_PLATFORM  Default agent platform

Examples:
  # Register as Antigravity orchestrator
  node tnf-agent-cli.js register antigravity orchestrator antigravity

  # Register as Gemini worker
  node tnf-agent-cli.js register gemini worker gemini

  # Register as Pi worker
  node tnf-agent-cli.js register pi worker pi

  # Start a code review conversation
  node tnf-agent-cli.js convo start code-review

  # List all agents
  node tnf-agent-cli.js list
`);
        await client.cleanup();
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    await client.cleanup();
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { RedisAgentClient, CONFIG };

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
