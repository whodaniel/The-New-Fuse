#!/usr/bin/env node

/**
 * Gemini CLI Redis Wrapper
 *
 * Connects the Gemini CLI to the TNF Redis agent network.
 * This wrapper:
 * 1. Listens for commands on Redis
 * 2. Sends them to Gemini CLI
 * 3. Captures Gemini's response
 * 4. Publishes response back to Redis
 *
 * Usage:
 *   node gemini-redis-wrapper.cjs
 *   # Or with custom name:
 *   AGENT_NAME=gemini-1 node gemini-redis-wrapper.cjs
 */

const { spawn, spawnSync } = require('child_process');
const { RedisAgentClient } = require('./tnf-agent-cli.cjs');
const { publishProviderFailureSignal } = require('./watchdog-signal-utils.cjs');
const readline = require('readline');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  agentName: process.env.AGENT_NAME || 'gemini',
  agentRole: process.env.AGENT_ROLE || 'worker',
  platform: 'gemini',
  geminiCommand: process.env.GEMINI_CMD || 'agy', // The agy CLI command
  geminiArgs: (process.env.GEMINI_ARGS || '--dangerously-skip-permissions').trim(),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  fallbackModels: (process.env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash,gemini-2.5-flash-lite')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean),
  maxResponseTime: 120000, // 2 minutes max wait
  modelWatchdogChannel: process.env.GEMINI_MODEL_WATCHDOG_CHANNEL || 'tnf:model-watchdog:signals',
};

function commandExists(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], { stdio: 'ignore' });
  return result.status === 0;
}

function resolveGeminiCommandSpec() {
  if (commandExists(CONFIG.geminiCommand)) {
    return { command: CONFIG.geminiCommand, baseArgs: [] };
  }

  if (commandExists(CONFIG.geminiCommand)) {
    return { command: CONFIG.geminiCommand, baseArgs: [] };
  }

  if (commandExists('npx')) {
    return { command: 'npx', baseArgs: ['--yes', '@google/antigravity-cli', 'agy'] };
  }

  return { command: CONFIG.geminiCommand, baseArgs: [] };
}

function splitArgs(value) {
  return String(value || '')
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function argsIncludeModel(args) {
  return args.some(
    (arg, index) =>
      arg === '--model' ||
      arg === '-m' ||
      arg.startsWith('--model=') ||
      (index > 0 && ['--model', '-m'].includes(args[index - 1]))
  );
}

function isRetryableProviderFailure(text) {
  return /\b(429|rate.?limit|resource exhausted|model_capacity_exhausted|capacity available|overloaded|service unavailable|503)\b/i.test(
    String(text || '')
  );
}

// ============================================================================
// GEMINI CLI INTERFACE
// ============================================================================

class GeminiCLIInterface {
  constructor() {
    this.isReady = false;
    this.commandSpec = resolveGeminiCommandSpec();
  }

  /**
   * Verify Gemini CLI is available.
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🚀 Verifying Gemini CLI process...`);
        console.log(
          `   Command: ${this.commandSpec.command} ${this.commandSpec.baseArgs.join(' ')}`.trim()
        );
        const check = spawn(this.commandSpec.command, [...this.commandSpec.baseArgs, '--version'], {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: false,
        });

        let stderr = '';
        check.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        check.on('error', (error) => {
          console.error(`Gemini process error: ${error.message}`);
          reject(error);
        });

        check.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Gemini CLI unavailable (code ${code}): ${stderr.trim()}`));
            return;
          }
          this.isReady = true;
          console.log('✅ Gemini CLI ready');
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clean up Gemini's response
   */
  cleanResponse(text) {
    // Remove prompt indicators and clean up
    return text
      .replace(/^> /gm, '')
      .replace(/\[Done\]/g, '')
      .trim();
  }

  /**
   * Send a prompt to Gemini and get response
   */
  async prompt(text) {
    const extraArgs = splitArgs(CONFIG.geminiArgs);
    const models = Array.from(
      new Set([CONFIG.geminiModel, ...CONFIG.fallbackModels].filter(Boolean))
    );
    const attempts = argsIncludeModel(extraArgs) ? [null] : models;
    let lastResponse = '';
    let lastError = null;

    for (const model of attempts) {
      try {
        const response = await this.promptOnce(text, extraArgs, model);
        lastResponse = response;
        if (!isRetryableProviderFailure(response) || attempts.length === 1) {
          return response;
        }
        console.warn(
          `[gemini-wrapper] retryable provider failure on ${model || 'configured model'}; trying fallback`
        );
      } catch (error) {
        lastError = error;
        if (!isRetryableProviderFailure(error?.message || '') || attempts.length === 1) {
          throw error;
        }
        console.warn(`[gemini-wrapper] ${model || 'configured model'} failed: ${error.message}`);
      }
    }

    if (lastResponse) return lastResponse;
    throw lastError || new Error('Gemini failed without response');
  }

  async promptOnce(text, extraArgs, model) {
    return new Promise((resolve, reject) => {
      if (!this.isReady) {
        reject(new Error('Gemini CLI not started'));
        return;
      }
      const modelArgs = model ? ['--model', model] : [];
      const args = [...this.commandSpec.baseArgs, ...extraArgs, ...modelArgs, '--prompt', text];
      console.log(`📝 Sent to Gemini${model ? ` (${model})` : ''}: ${text.substring(0, 50)}...`);

      const child = spawn(this.commandSpec.command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });

      let stdout = '';
      let stderr = '';
      let settled = false;
      const finish = (value, isError = false) => {
        if (settled) return;
        settled = true;
        if (isError) {
          reject(value);
        } else {
          resolve(value);
        }
      };

      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        const fallback =
          this.cleanResponse(stdout) ||
          this.cleanResponse(stderr) ||
          '[No response within timeout]';
        finish(fallback, false);
      }, CONFIG.maxResponseTime);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        // Keep stderr visible for diagnostics, but do not fail immediately.
        process.stderr.write(`Gemini stderr [intercepted]: ${chunk}`);
      });
      child.on('error', (error) => {
        clearTimeout(timeout);
        finish(error, true);
      });
      child.on('close', (code) => {
        clearTimeout(timeout);
        const response = this.cleanResponse(stdout) || this.cleanResponse(stderr);
        if (code === 0 || response) {
          finish(response || '[No response]');
          return;
        }
        finish(new Error(`Gemini exited with code ${code}`), true);
      });
    });
  }

  /**
   * Stop the Gemini CLI process
   */
  stop() {
    this.isReady = false;
  }
}

// ============================================================================
// GEMINI REDIS AGENT
// ============================================================================

class GeminiRedisAgent {
  constructor() {
    this.client = new RedisAgentClient();
    this.gemini = new GeminiCLIInterface();
    this.isRunning = false;
  }

  /**
   * Start the agent
   */
  async start() {
    console.log(`
╔═══════════════════════════════════════════════════╗
║         Gemini CLI Redis Agent Wrapper            ║
╚═══════════════════════════════════════════════════╝
`);

    try {
      // Initialize Redis connection
      await this.client.initialize();

      // Start Gemini CLI
      await this.gemini.start();

      // Register as agent
      await this.client.register(CONFIG.agentName, CONFIG.agentRole, CONFIG.platform, [
        'code_analysis',
        'research',
        'implementation',
        'review',
        'gemini_cli',
        'task_execution',
      ]);

      // Set up message handlers
      this.setupHandlers();

      this.isRunning = true;
      console.log('\n🎧 Listening for messages from Redis network...\n');

      // Keep running
      await this.waitForShutdown();
    } catch (error) {
      console.error('Failed to start Gemini agent:', error.message);
      try {
        await publishProviderFailureSignal(this.client, {
          channel: CONFIG.modelWatchdogChannel,
          sourceAgent: CONFIG.agentName,
          agentRole: CONFIG.agentRole,
          platform: CONFIG.platform,
          provider: 'google',
          model: CONFIG.geminiModel,
          category: error.message.includes('unavailable') ? 'availability' : 'timeout',
          message: error.message,
        });
        console.log('📡 Emitted watchdog failover signal');
      } catch (e) {
        // Ignore errors
      }
      await this.stop();
      process.exit(1);
    }
  }

  /**
   * Set up message handlers
   */
  setupHandlers() {
    // Handle events (like wake_ping from the orchestrator)
    this.client.onMessage('event', async (msg) => {
      if (
        msg.payload?.eventType === 'wake_ping' &&
        msg.payload?.data?.targetAgentId !== this.client.agentInfo.id
      ) {
        return;
      }
      console.log(`\n👑 Received event from ${msg.from.agentName}:`);
      console.log(`   ${msg.content.substring(0, 200)}...`);

      let promptText = msg.content;
      if (msg.payload?.eventType === 'wake_ping' && msg.payload?.data?.customPrompt) {
        promptText = msg.payload.data.customPrompt;
      }

      const response = await this.gemini.prompt(promptText);

      await this.client.send(response, {
        replyTo: msg.id,
        type: 'response',
        metadata: {
          wasEvent: true,
          processedBy: CONFIG.agentName,
          platform: CONFIG.platform,
        },
      });
    });

    // Handle broker-dispatched task envelopes.
    this.client.onMessage('task', async (msg) => {
      console.log(`\n🎯 Received task from ${msg.from.agentName}:`);
      console.log(`   ${msg.content.substring(0, 200)}...`);

      const response = await this.gemini.prompt(msg.content);

      await this.client.send(response, {
        replyTo: msg.id,
        type: 'response',
        metadata: {
          wasTask: true,
          processedBy: CONFIG.agentName,
          platform: CONFIG.platform,
        },
      });
    });

    // Handle direct messages
    this.client.onMessage('message', async (msg) => {
      console.log(`\n📨 Received message from ${msg.from.agentName}:`);
      console.log(`   ${msg.content}`);

      // Process through Gemini
      const response = await this.gemini.prompt(msg.content);

      // Send response back
      await this.client.send(response, {
        replyTo: msg.id,
        type: 'response',
      });
    });

    // Handle commands
    this.client.onMessage('command', async (msg) => {
      console.log(`\n📋 Received command from ${msg.from.agentName}:`);
      console.log(`   ${msg.content}`);

      // Process through Gemini
      const response = await this.gemini.prompt(msg.content);

      // Send response back
      await this.client.send(response, {
        replyTo: msg.id,
        type: 'response',
        metadata: { wasCommand: true },
      });
    });
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
          // Local test: send to Gemini and broadcast
          const response = await this.gemini.prompt(line.trim());
          await this.client.send(response);
        }
      });
    });
  }

  /**
   * Stop the agent
   */
  async stop() {
    this.isRunning = false;
    this.gemini.stop();
    await this.client.cleanup();
    console.log('👋 Gemini agent stopped');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const agent = new GeminiRedisAgent();
  await agent.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { GeminiRedisAgent, GeminiCLIInterface };
