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
const { isHeartbeatOrNoise } = require('./lib/tnf-heartbeat-filter.cjs');
const readline = require('readline');
const { execFile } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  agentName: process.env.AGENT_NAME || 'jules',
  agentRole: process.env.AGENT_ROLE || 'worker',
  platform: 'jules',
  // The real `jules` CLI (https://github.com/google-labs-code/jules-cli)
  // authenticates via `jules login` (Google account), not GITHUB_TOKEN — the
  // GITHUB_TOKEN/julesApiUrl config below was leftover from a stub that never
  // called a real API. Fixed 2026-07-23 (see JulesSessionManager).
  julesCliPath: process.env.JULES_CLI_PATH || 'jules',
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
   * Shell out to the real `jules` CLI (google-labs-code/jules-cli). Uses
   * execFile (argv array, no shell) so task/repo text from Redis messages
   * can't be interpreted as shell syntax.
   */
  runJulesCli(args) {
    return new Promise((resolve) => {
      execFile(
        CONFIG.julesCliPath,
        args,
        { maxBuffer: 20 * 1024 * 1024, timeout: 120000 },
        (error, stdout, stderr) => {
          resolve({ error, stdout: String(stdout || ''), stderr: String(stderr || '') });
        }
      );
    });
  }

  /**
   * Create a new Jules async session via the real `jules` CLI.
   */
  async createSession(task, repo = CONFIG.defaultRepo) {
    if (!repo) {
      throw new Error('Repository not specified for Jules task');
    }

    console.log(`🚀 Creating Jules session for repo ${repo}`);
    console.log(`   Task: ${task.substring(0, 100)}...`);

    const { error, stdout, stderr } = await this.runJulesCli(['new', '--repo', repo, task]);
    if (error) {
      throw new Error(`jules new failed: ${(stderr || error.message).trim().slice(0, 500)}`);
    }

    // `jules new` prints a real session ID (observed as a long numeric
    // string, e.g. 11504179381602839552, matching `jules remote list
    // --session`'s ID column) somewhere in its output. Fail loudly with the
    // raw output if the format doesn't match, rather than silently
    // returning something wrong.
    const idMatch = stdout.match(/\b(\d{10,})\b/);
    if (!idMatch) {
      throw new Error(
        `Could not parse a Jules session ID from \`jules new\` output: ${stdout.trim().slice(0, 500) || '(empty stdout)'}`
      );
    }
    const sessionId = idMatch[1];

    const session = {
      id: sessionId,
      repo,
      task,
      status: 'pending',
      createdAt: new Date().toISOString(),
      result: null,
    };

    this.activeSessions.set(sessionId, session);
    this.pollSession(sessionId);

    return sessionId;
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
   * Check session status via `jules remote pull` (real, not simulated).
   * Its stdout cleanly distinguishes the three states we care about:
   *   - starts with "diff --git"   -> completed, real unified diff as result
   *   - contains "No diff found"  -> not completed yet, keep polling
   *   - anything else (api error) -> treat as a failed/errored session
   * Verified against real sessions 2026-07-23 (a completed one returned a
   * real diff; an "Awaiting User Feedback" one returned "No diff found in
   * the remote VM."; a bad session ID returned a 404 api error JSON blob).
   */
  async checkSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { completed: true, result: 'Session not found' };
    }

    const { error, stdout, stderr } = await this.runJulesCli(['remote', 'pull', '--session', sessionId]);
    const output = stdout.trim();

    if (output.startsWith('diff --git')) {
      return { completed: true, result: output };
    }
    if (/No diff found/i.test(output)) {
      return { completed: false };
    }
    // Anything else (api error JSON, CLI error, non-zero exit) is a real
    // failure — surface it rather than silently retrying forever.
    return {
      completed: true,
      result: `Jules session error: ${(output || stderr || error?.message || 'unknown error').slice(0, 500)}`,
    };
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

      const loginCheck = await this.sessionManager.runJulesCli(['remote', 'list', '--repo']);
      if (loginCheck.error) {
        console.log(`⚠️  \`jules\` CLI not usable (${loginCheck.error.message.split('\n')[0]}).`);
        console.log('   Real Jules tasks will fail until this is fixed — no simulated fallback.\n');
      } else if (!loginCheck.stdout.trim()) {
        console.log('⚠️  `jules remote list --repo` returned nothing — run `jules login` to authenticate.');
        console.log('   Real Jules tasks will fail until this is fixed — no simulated fallback.\n');
      } else {
        console.log('✅ Jules CLI authenticated and reachable.\n');
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
      console.log(`   ${String(msg.content || '').substring(0, 100)}...`);

      await this.processTask(msg);
    });

    // Handle direct messages
    this.client.onMessage('message', async (msg) => {
      console.log(`\n📨 Received message from ${msg.from.agentName}:`);
      console.log(`   ${String(msg.content || '').substring(0, 100)}...`);

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
      console.log(`   ${String(msg.content || '').substring(0, 200)}...`);

      let promptText = msg.content;
      if (msg.payload?.eventType === 'wake_ping' && msg.payload?.data?.customPrompt) {
        promptText = msg.payload.data.customPrompt;
      }

      // Heartbeats/stall-pings should be a no-op here, not a real Jules
      // coding session — this file had no such guard at all (unlike
      // pi-redis-wrapper.cjs's isHeartbeatOrNoise) until this file's crash
      // was found and fixed 2026-07-23: `this.processWithJules` was never a
      // method on this class (only processTask() exists), so every event
      // that reached here crashed the whole process. Reusing processTask()
      // below, keyed off a heartbeat guard, fixes both problems at once.
      if (isHeartbeatOrNoise(promptText)) return;

      await this.processTask({ ...msg, content: promptText });
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
      process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down (SIGTERM)...');
        await this.stop();
        resolve();
      });

      if (!process.stdin.isTTY) {
        console.log('[headless] no TTY — Jules stays up on Redis event loop');
        return;
      }

      // Handle terminal input for testing
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', async (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Same guard applied to the 'event' handler above and to
        // pi-redis-wrapper.cjs's equivalent stdin path — this specific gap
        // (heartbeat text reaching createSession() unfiltered here, via a
        // hardcoded nonexistent 'test/repo', with no try/catch) is what
        // crashed ttys012 a second time after the first fix: it was firing
        // real `jules new --repo test/repo <heartbeat text>` calls on every
        // heartbeat tick until one finally errored loudly enough to take
        // the whole process down. Found 2026-07-23 (second occurrence).
        if (isHeartbeatOrNoise(trimmed)) return;

        try {
          console.log('Creating test task...');
          const sessionId = await this.sessionManager.createSession(trimmed, 'test/repo');
          console.log(`Session created: ${sessionId}`);
        } catch (error) {
          console.error('Local test task failed (non-fatal):', error.message);
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
