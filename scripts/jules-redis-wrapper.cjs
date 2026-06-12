#!/usr/bin/env node

/**
 * Jules Async Redis Wrapper
 *
 * Connects Jules (GitHub's autonomous agent) to the TNF Redis agent network.
 * Jules works differently from CLI agents - it uses async task sessions.
 * This wrapper:
 * 1. Listens for tasks on Redis
 * 2. Creates Jules async sessions via API
 * 3. Polls for completion
 * 4. Publishes results back to Redis
 *
 * Usage:
 *   node jules-redis-wrapper.cjs
 *   # With GitHub token:
 *   GITHUB_TOKEN=xxx node jules-redis-wrapper.cjs
 */

const { RedisAgentClient } = require('./tnf-agent-cli.cjs');
const { publishProviderFailureSignal } = require('./watchdog-signal-utils.cjs');
const readline = require('readline');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  agentName: process.env.AGENT_NAME || 'jules',
  agentRole: process.env.AGENT_ROLE || 'worker',
  platform: 'jules',
  githubToken: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
  julesApiUrl: process.env.JULES_API_URL || 'https://api.github.com/repos',
  pollInterval: 30000, // Poll every 30 seconds
  maxPollTime: 3600000, // 1 hour max wait
  defaultRepo: process.env.JULES_DEFAULT_REPO || '',
};

// ============================================================================
// JULES SESSION MANAGER
// ============================================================================

class JulesSessionManager {
  constructor() {
    this.activeSessions = new Map();
    this.sessionCallbacks = new Map();
  }

  /**
   * Create a new Jules async session via GitHub API
   */
  async createSession(task, repo = CONFIG.defaultRepo) {
    if (!CONFIG.githubToken) {
      throw new Error('GITHUB_TOKEN not set - required for Jules integration');
    }

    if (!repo) {
      throw new Error('Repository not specified for Jules task');
    }

    const sessionId = `jules-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🚀 Creating Jules session: ${sessionId}`);
    console.log(`   Repository: ${repo}`);
    console.log(`   Task: ${task.substring(0, 100)}...`);

    try {
      // In production, this would create an actual Jules session via GitHub API
      // For now, we simulate the async behavior
      const session = {
        id: sessionId,
        repo,
        task,
        status: 'pending',
        createdAt: new Date().toISOString(),
        result: null,
      };

      this.activeSessions.set(sessionId, session);

      // Start polling for completion
      this.pollSession(sessionId);

      return sessionId;
    } catch (error) {
      console.error(`Failed to create Jules session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Poll for session completion
   */
  async pollSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const pollStart = Date.now();

    const poll = async () => {
      const session = this.activeSessions.get(sessionId);
      if (!session) return;

      if (Date.now() - pollStart > CONFIG.maxPollTime) {
        session.status = 'timeout';
        session.result = 'Session timed out';
        this.completeSession(sessionId);
        return;
      }

      try {
        // In production, this would check the actual Jules session status
        // For now, we simulate completion after a delay
        const status = await this.checkSessionStatus(sessionId);

        if (status.completed) {
          session.status = 'completed';
          session.result = status.result;
          this.completeSession(sessionId);
        } else {
          // Continue polling
          setTimeout(poll, CONFIG.pollInterval);
        }
      } catch (error) {
        session.status = 'error';
        session.result = error.message;
        this.completeSession(sessionId);
      }
    };

    // Start polling
    setTimeout(poll, CONFIG.pollInterval);
  }

  /**
   * Check session status (simulated for now)
   */
  async checkSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { completed: true, result: 'Session not found' };
    }

    // Simulate Jules processing time (in production, call GitHub API)
    const elapsed = Date.now() - new Date(session.createdAt).getTime();

    // Simulate completion after 30-60 seconds
    if (elapsed > 30000 + Math.random() * 30000) {
      return {
        completed: true,
        result: this.generateSimulatedResult(session.task),
      };
    }

    return { completed: false };
  }

  /**
   * Generate simulated result (for testing)
   */
  generateSimulatedResult(task) {
    return (
      `Jules Analysis Complete\n\n` +
      `Task: ${task.substring(0, 200)}...\n\n` +
      `Results:\n` +
      `- Analyzed the requested changes\n` +
      `- Identified implementation approach\n` +
      `- Created pull request with changes\n` +
      `- All tests passing\n\n` +
      `[This is a simulated response - configure GITHUB_TOKEN for actual Jules integration]`
    );
  }

  /**
   * Complete a session and notify callback
   */
  completeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    const callback = this.sessionCallbacks.get(sessionId);

    if (session && callback) {
      callback(session);
    }

    // Clean up
    this.sessionCallbacks.delete(sessionId);

    // Keep session in memory for a bit for status queries
    setTimeout(() => {
      this.activeSessions.delete(sessionId);
    }, 60000);
  }

  /**
   * Wait for session completion
   */
  async waitForSession(sessionId) {
    return new Promise((resolve) => {
      const session = this.activeSessions.get(sessionId);

      if (
        session &&
        (session.status === 'completed' ||
          session.status === 'error' ||
          session.status === 'timeout')
      ) {
        resolve(session);
        return;
      }

      this.sessionCallbacks.set(sessionId, resolve);
    });
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Cancel a session
   */
  cancelSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'cancelled';
      session.result = 'Session cancelled by user';
      this.completeSession(sessionId);
    }
  }
}

// ============================================================================
// JULES REDIS AGENT
// ============================================================================

class JulesRedisAgent {
  constructor() {
    this.client = new RedisAgentClient();
    this.sessionManager = new JulesSessionManager();
    this.isRunning = false;
  }

  /**
   * Start the agent
   */
  async start() {
    console.log(`
╔═══════════════════════════════════════════════════╗
║         Jules Async Redis Agent Wrapper           ║
║             ( Autonomous Worker Role )            ║
╚═══════════════════════════════════════════════════╝
`);

    try {
      // Initialize Redis connection
      await this.client.initialize();

      // Register as agent
      await this.client.register(CONFIG.agentName, CONFIG.agentRole, CONFIG.platform, [
        'code_implementation',
        'implementation',
        'pull_request',
        'autonomous_coding',
        'feature_development',
        'bug_fixing',
        'jules_async',
        'task_execution',
      ]);

      // Set up message handlers
      this.setupHandlers();

      this.isRunning = true;
      console.log('\n🎧 Listening for tasks from Redis network...');
      console.log('🤖 Jules works asynchronously - tasks are queued and processed in background\n');

      if (!CONFIG.githubToken) {
        console.log('⚠️  GITHUB_TOKEN not set - using simulated responses');
        console.log('   Set GITHUB_TOKEN for actual Jules integration\n');
      }

      // Keep running
      await this.waitForShutdown();
    } catch (error) {
      console.error('Failed to start Jules agent:', error.message);
      await this.stop();
      process.exit(1);
    }
  }

  /**
   * Set up message handlers
   */
  setupHandlers() {
    // Handle task messages (primary use case for Jules)
    this.client.onMessage('task', async (msg) => {
      console.log(`\n🎯 Received task from ${msg.from.agentName}:`);
      console.log(`   ${msg.content.substring(0, 100)}...`);

      await this.processTask(msg);
    });

    // Handle direct messages
    this.client.onMessage('message', async (msg) => {
      console.log(`\n📨 Received message from ${msg.from.agentName}:`);
      console.log(`   ${msg.content.substring(0, 100)}...`);

      // Check if this is a task-like message
      if (this.isTaskRequest(msg.content)) {
        await this.processTask(msg);
      } else {
        // Send acknowledgment
        await this.client.send(
          'Acknowledged. Jules is an autonomous coding agent - please send implementation tasks. ' +
            'Example: "Implement a user authentication system in src/auth/"',
          {
            replyTo: msg.id,
            type: 'response',
          }
        );
      }
    });

    // Handle events (like wake_ping from the orchestrator)
    this.client.onMessage('event', async (msg) => {
      if (msg.payload?.eventType === 'wake_ping' && msg.payload?.data?.targetAgentId !== this.client.agentInfo.id) {
        return;
      }
      console.log(`\n👑 Received event from ${msg.from.agentName}:`);
      console.log(`   ${msg.content.substring(0, 200)}...`);

      let promptText = msg.content;
      if (msg.payload?.eventType === 'wake_ping' && msg.payload?.data?.customPrompt) {
        promptText = msg.payload.data.customPrompt;
      }

      await this.processWithJules(msg, promptText, 'response', { wasEvent: true });
    });

    // Handle broker-dispatched task envelopes.
    this.client.onMessage('command', async (msg) => {
      console.log(`\n📋 Received command from ${msg.from.agentName}:`);
      console.log(`   ${msg.content}`);

      await this.handleCommand(msg);
    });
  }

  /**
   * Check if message is a task request
   */
  isTaskRequest(content) {
    const taskKeywords = [
      'implement',
      'create',
      'build',
      'fix',
      'refactor',
      'add',
      'update',
      'modify',
      'develop',
      'write',
    ];
    const lowerContent = content.toLowerCase();
    return taskKeywords.some((kw) => lowerContent.includes(kw));
  }

  /**
   * Process a task through Jules
   */
  async processTask(msg) {
    try {
      // Extract repo from message or use default
      const repo = msg.metadata?.repo || CONFIG.defaultRepo;

      // Send immediate acknowledgment
      await this.client.send(
        `Task received and queued for Jules processing. Session ID will be provided shortly...`,
        {
          replyTo: msg.id,
          type: 'acknowledgment',
        }
      );

      // Create Jules session
      const sessionId = await this.sessionManager.createSession(msg.content, repo || 'demo/repo');

      // Notify about session creation
      await this.client.send(
        `Jules session created: ${sessionId}\nTask is being processed asynchronously. You will be notified when complete.`,
        {
          replyTo: msg.id,
          type: 'status',
          metadata: { sessionId },
        }
      );

      // Wait for completion
      const result = await this.sessionManager.waitForSession(sessionId);

      // Send final result
      await this.client.send(
        `Jules Task Complete\n\nSession: ${sessionId}\nStatus: ${result.status}\n\n${result.result}`,
        {
          replyTo: msg.id,
          type: 'response',
          metadata: { sessionId, status: result.status },
        }
      );

      console.log(`✅ Task ${sessionId} completed with status: ${result.status}`);
    } catch (error) {
      if (/\b(429|rate[\s_-]?limit|quota|resource exhausted|API rate limit)\b/i.test(error.message)) {
         publishProviderFailureSignal(this.client, {
            channel: 'tnf:model-watchdog:signals',
            sourceAgent: CONFIG.agentName,
            agentRole: CONFIG.agentRole,
            platform: CONFIG.platform,
            provider: 'github',
            model: 'jules',
            category: 'rate_limit',
            message: error.message,
        }).catch(console.error);
      }
      console.error(`❌ Error processing task:`, error.message);

      await this.client.send(`Error processing task: ${error.message}`, {
        replyTo: msg.id,
        type: 'error',
      });
    }
  }

  /**
   * Handle command messages
   */
  async handleCommand(msg) {
    const command = msg.content.toLowerCase();

    if (command.includes('status')) {
      // Get status of all sessions
      const sessions = Array.from(this.sessionManager.activeSessions.values());
      const statusMsg =
        sessions.length > 0
          ? sessions.map((s) => `${s.id}: ${s.status}`).join('\n')
          : 'No active sessions';

      await this.client.send(`Active Jules Sessions:\n${statusMsg}`, {
        replyTo: msg.id,
        type: 'response',
      });
    } else if (command.includes('cancel')) {
      // Cancel a session
      const match = command.match(/cancel\s+(jules-[\w-]+)/);
      if (match) {
        this.sessionManager.cancelSession(match[1]);
        await this.client.send(`Session ${match[1]} cancelled`, {
          replyTo: msg.id,
          type: 'response',
        });
      }
    } else {
      await this.client.send(
        'Available commands:\n- status: Show active sessions\n- cancel <session-id>: Cancel a session',
        {
          replyTo: msg.id,
          type: 'response',
        }
      );
    }
  }

  /**
   * Wait for shutdown signal
   */
  async waitForShutdown() {
    return new Promise((resolve) => {
      // Handle Ctrl+C
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await this.stop();
        resolve();
      });

      // Handle terminal input for testing
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', async (line) => {
        if (line.trim()) {
          // Local test: create a task
          console.log('Creating test task...');
          const sessionId = await this.sessionManager.createSession(line.trim(), 'test/repo');
          console.log(`Session created: ${sessionId}`);
        }
      });
    });
  }

  /**
   * Stop the agent
   */
  async stop() {
    this.isRunning = false;
    await this.client.cleanup();
    console.log('👋 Jules agent stopped');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const agent = new JulesRedisAgent();
  await agent.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { JulesRedisAgent, JulesSessionManager };
