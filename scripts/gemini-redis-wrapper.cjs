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
const wrapperAuthority = require('./lib/tnf-wrapper-authority.cjs');
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
  return /\b(429|rate.?limit|resource exhausted|model_capacity_exhausted|capacity available|overloaded|service unavailable|503|quota|quota.?exceeded|individual quota|auth|unauthorized|forbidden|api.?key|no api key)\b/i.test(
    String(text || '')
  );
}

function isHardProviderFailure(text) {
  return /\b(quota|quota.?exceeded|individual quota|unauthorized|forbidden|api.?key|no api key|authentication|permission.?denied)\b/i.test(
    String(text || '')
  );
}

function isHeartbeatOrNoise(text) {
  const value = String(text || '').trim();
  if (!value) return true;
  return /\b(tnf heartbeat|cron-heartbeat|heartbeat|please respond with a heartbeat|agent_stalled|self.?prompt)\b/i.test(
    value
  );
}

const CIRCUIT = {
  openUntil: 0,
  reason: '',
  lastSignalAt: 0,
};

function circuitOpen() {
  return Date.now() < CIRCUIT.openUntil;
}

function openCircuit(reason, minutes = Number(process.env.TNF_GEMINI_COOLDOWN_MINUTES || 180)) {
  const ms = Math.max(5, Number(minutes) || 180) * 60 * 1000;
  CIRCUIT.openUntil = Date.now() + ms;
  CIRCUIT.reason = String(reason || 'provider failure').slice(0, 240);
  console.warn(
    `[gemini-wrapper] circuit open for ${Math.round(ms / 60000)}m: ${CIRCUIT.reason}`
  );
}

function circuitBlockedResponse() {
  const mins = Math.max(1, Math.ceil((CIRCUIT.openUntil - Date.now()) / 60000));
  return `Gemini temporarily disabled (${mins}m remaining): ${CIRCUIT.reason || 'provider failure'}. Use nvidia/anthropic via harness failover.`;
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
        if (isHardProviderFailure(response)) {
          openCircuit(response);
          return circuitBlockedResponse();
        }
        if (!isRetryableProviderFailure(response) || attempts.length === 1) {
          return response;
        }
        console.warn(
          `[gemini-wrapper] retryable provider failure on ${model || 'configured model'}; trying fallback`
        );
      } catch (error) {
        lastError = error;
        const errText = error?.message || String(error || '');
        if (isHardProviderFailure(errText)) {
          openCircuit(errText);
          return circuitBlockedResponse();
        }
        if (!isRetryableProviderFailure(errText) || attempts.length === 1) {
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
  async handleIncoming(msg, messageType) {
    const content = String(msg?.content || '');
    if (isHeartbeatOrNoise(content)) {
      await this.client.send('gemini:ack heartbeat (no LLM)', {
        replyTo: msg.id,
        type: 'response',
        metadata: {
          heartbeatAck: true,
          processedBy: CONFIG.agentName,
          platform: CONFIG.platform,
          messageType,
        },
      });
      return;
    }

    if (circuitOpen()) {
      await this.client.send(circuitBlockedResponse(), {
        replyTo: msg.id,
        type: 'response',
        metadata: {
          circuitOpen: true,
          processedBy: CONFIG.agentName,
          platform: CONFIG.platform,
          messageType,
        },
      });
      return;
    }

    console.log(`\n📥 Received ${messageType} from ${msg.from?.agentName || 'unknown'}:`);
    console.log(`   ${content.substring(0, 200)}`);

    let promptText = content;
    if (messageType === 'event' && msg.payload?.eventType === 'wake_ping' && msg.payload?.data?.customPrompt) {
      promptText = msg.payload.data.customPrompt;
    }

    // Authority gate (DEFAULT-OFF). With TNF_AUTHORITY_CONSUMER unset this is a
    // no-op passthrough — zero behaviour change. When enabled, a task that
    // declares `requiredCapabilities` is held until the operator approves an
    // elevation grant; otherwise it is refused rather than executed.
    // See scripts/lib/tnf-wrapper-authority.cjs and AUTHORITY_INTEGRATION_MAP.md.
    const gate = await wrapperAuthority.gateTask(msg, { agentId: this.client.agentInfo?.id });
    if (!gate.allowed) {
      await this.client.send(`gemini: task requires elevation that was not granted — ${gate.reason}`, {
        replyTo: msg.id,
        type: 'response',
        metadata: { elevationRefused: true, processedBy: CONFIG.agentName, platform: CONFIG.platform, messageType },
      });
      return;
    }

    const response = await this.gemini.prompt(promptText);

    if (isHardProviderFailure(response) || isHardProviderFailure(CIRCUIT.reason)) {
      try {
        const now = Date.now();
        if (now - CIRCUIT.lastSignalAt > 60_000) {
          CIRCUIT.lastSignalAt = now;
          await publishProviderFailureSignal(this.client, {
            channel: CONFIG.modelWatchdogChannel,
            sourceAgent: CONFIG.agentName,
            agentRole: CONFIG.agentRole,
            platform: CONFIG.platform,
            provider: 'google',
            model: CONFIG.geminiModel,
            category: 'auth',
            message: String(response || CIRCUIT.reason || 'gemini provider failure'),
          });
        }
      } catch (_) {
        // ignore signal publish failures
      }
    }

    await this.client.send(response, {
      replyTo: msg.id,
      type: 'response',
      metadata: {
        processedBy: CONFIG.agentName,
        platform: CONFIG.platform,
        messageType,
      },
    });
  }

  setupHandlers() {
    this.client.onMessage('event', async (msg) => {
      if (
        msg.payload?.eventType === 'wake_ping' &&
        msg.payload?.data?.targetAgentId !== this.client.agentInfo.id
      ) {
        return;
      }
      await this.handleIncoming(msg, 'event');
    });

    this.client.onMessage('task', async (msg) => {
      await this.handleIncoming(msg, 'task');
    });

    this.client.onMessage('message', async (msg) => {
      await this.handleIncoming(msg, 'message');
    });

    this.client.onMessage('command', async (msg) => {
      await this.handleIncoming(msg, 'command');
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
        if (!line.trim()) return;
        if (circuitOpen()) {
          console.log(circuitBlockedResponse());
          return;
        }
        const response = await this.gemini.prompt(line.trim());
        await this.client.send(response);
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
  if (
    process.env.GEMINI_DISABLED === '1' ||
    process.env.TNF_SKIP_GEMINI_WRAPPER === '1'
  ) {
    console.log(
      '[gemini-wrapper] skipped: GEMINI_DISABLED/TNF_SKIP_GEMINI_WRAPPER=1 (primary provider is not google)'
    );
    process.exit(0);
  }

  const agent = new GeminiRedisAgent();
  await agent.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { GeminiRedisAgent, GeminiCLIInterface };
