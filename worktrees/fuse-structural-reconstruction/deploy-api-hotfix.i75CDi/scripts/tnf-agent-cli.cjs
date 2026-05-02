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
 * @property {'antigravity'|'gemini'|'claude'|'jules'|'vscode'|'browser'} platform
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
    this.agentInfo = {
      id: `agent_${name}_${Date.now()}`,
      name,
      role,
      platform,
      status: 'active',
      capabilities: capabilities.length > 0 ? capabilities : this.getDefaultCapabilities(platform),
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
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
      `tnf:direct:*:${this.agentInfo.id}`
    );

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
      vscode: ['code_editing', 'terminal', 'debugging', 'extensions'],
      browser: ['web_scraping', 'research', 'automation'],
    };
    return capabilityMap[platform] || ['general'];
  }

  /**
   * Send a message to the network
   */
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

    const channel = options.channel || CONFIG.channels.conversations;
    await this.publisher.publish(channel, JSON.stringify(message));

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
      const message = JSON.parse(messageStr);

      // Don't process our own messages
      if (message.from?.agentId === this.agentInfo?.id) {
        return;
      }

      // Log the message
      this.logIncomingMessage(message);

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
Platforms: antigravity, gemini, claude, jules, vscode, browser

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
