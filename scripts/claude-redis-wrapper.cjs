#!/usr/bin/env node

/**
 * Claude CLI Redis Wrapper
 *
 * Connects the Claude CLI (claude-cli / mcp-client) to the TNF Redis agent network.
 * This wrapper:
 * 1. Listens for commands on Redis
 * 2. Sends them to Claude CLI
 * 3. Captures Claude's response
 * 4. Publishes response back to Redis
 *
 * Usage:
 *   node claude-redis-wrapper.cjs
 *   # Or with custom name:
 *   AGENT_NAME=claude-1 node claude-redis-wrapper.cjs
 */

const { spawn } = require('child_process');
const { RedisAgentClient } = require('./tnf-agent-cli.cjs');
const { publishProviderFailureSignal } = require('./watchdog-signal-utils.cjs');
const readline = require('readline');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  agentName: process.env.AGENT_NAME || 'claude',
  agentRole: process.env.AGENT_ROLE || 'broker',
  platform: 'claude',
  claudeCommand: process.env.CLAUDE_CMD || 'claude', // The claude CLI command (claude-cli, mcp-client-cli, etc.)
  maxResponseTime: 180000, // 3 minutes max wait for Claude (it can be slow)
  streamMode: true, // Claude CLI supports streaming
  modelWatchdogChannel: process.env.CLAUDE_MODEL_WATCHDOG_CHANNEL || 'tnf:model-watchdog:signals',
};

// ============================================================================
// CLAUDE CLI INTERFACE
// ============================================================================

class ClaudeCLIInterface {
  constructor() {
    this.process = null;
    this.responseBuffer = '';
    this.responseCallback = null;
    this.isProcessing = false;
    this.streamTimeout = null;
  }

  /**
   * Start a new Claude CLI session
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🚀 Starting Claude CLI process...`);

        // PREFLIGHT: Check auth status
        const authCheck = spawn(CONFIG.claudeCommand, ['auth', 'status'], { shell: true });
        let authOutput = '';
        authCheck.stdout.on('data', (d) => (authOutput += d));
        authCheck.stderr.on('data', (d) => (authOutput += d));

        authCheck.on('error', (error) => {
          reject(error);
        });

        authCheck.on('close', (code) => {
          if (
            code !== 0 ||
            authOutput.includes('Not logged in') ||
            authOutput.includes('Please run /login')
          ) {
            console.error('❌ Preflight failed: Claude is unavailable or not logged in.');
            reject(
              new Error(
                `Provider Authentication Failure: Claude CLI auth status failed (${authOutput.trim() || `code ${code}`})`
              )
            );
            return;
          }

          // Start Claude in interactive/chat mode
          this.process = spawn(CONFIG.claudeCommand, ['chat'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            env: { ...process.env, CLAUDE_MCP_ENABLED: 'true' },
          });

          this.process.stdout.on('data', (data) => {
            this.handleOutput(data.toString());
          });

          this.process.stderr.on('data', (data) => {
            // Claude CLI often sends progress to stderr
            const msg = data.toString();
            if (!msg.includes('Loading') && !msg.includes('Connecting')) {
              console.error(`Claude stderr: ${msg}`);
            }
          });

          this.process.on('error', (error) => {
            console.error(`Claude process error: ${error.message}`);
            reject(error);
          });

          this.process.on('close', (code) => {
            console.log(`Claude process exited with code ${code}`);
            if (code !== 0 && this.isProcessing) {
              this.isProcessing = false;
              if (this.responseCallback) {
                this.responseCallback('[Claude process ended unexpectedly]');
              }
            }
          });

          // Give it time to initialize
          setTimeout(() => {
            console.log('✅ Claude CLI started');
            resolve();
          }, 3000);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle output from Claude
   */
  handleOutput(text) {
    this.responseBuffer += text;

    // Rate limit detection
    if (/\b(429|rate[\s_-]?limit|quota|resource exhausted)\b/i.test(text)) {
      console.error('🚨 Rate limit detected from Claude CLI');
      publishProviderFailureSignal(this.client, {
          channel: CONFIG.modelWatchdogChannel,
          sourceAgent: CONFIG.agentName,
          agentRole: CONFIG.agentRole,
          platform: CONFIG.platform,
          provider: 'anthropic',
          model: 'claude-code-cli',
          category: 'rate_limit',
          message: text,
      }).catch(console.error);
    }

    // Reset stream timeout on new data
    if (this.streamTimeout) {
      clearTimeout(this.streamTimeout);
    }

    // Set a new timeout - if no new data for 2 seconds, consider response complete
    if (this.isProcessing) {
      this.streamTimeout = setTimeout(() => {
        if (this.responseCallback && this.isProcessing) {
          const response = this.cleanResponse(this.responseBuffer);
          if (response) {
            this.responseCallback(response);
            this.responseBuffer = '';
            this.isProcessing = false;
          }
        }
      }, 2000);
    }

    // Also check for explicit end markers
    if (
      this.responseBuffer.includes('Claude >') ||
      this.responseBuffer.includes('[END]') ||
      this.responseBuffer.includes('\n> ')
    ) {
      if (this.responseCallback && this.isProcessing) {
        const response = this.cleanResponse(this.responseBuffer);
        this.responseCallback(response);
        this.responseBuffer = '';
        this.isProcessing = false;
      }
    }
  }

  /**
   * Clean up Claude's response
   */
  cleanResponse(text) {
    // Remove prompt indicators and clean up
    return text
      .replace(/^Claude\s*>\s*/gm, '')
      .replace(/^\s*>\s*/gm, '')
      .replace(/\[END\]/g, '')
      .replace(/\[DONE\]/g, '')
      .replace(/^\s*Human:\s*/gm, '')
      .trim();
  }

  /**
   * Send a prompt to Claude and get response
   */
  async prompt(text) {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('Claude CLI not started'));
        return;
      }

      this.isProcessing = true;
      this.responseBuffer = '';

      // Set up response callback
      this.responseCallback = (response) => {
        if (this.streamTimeout) {
          clearTimeout(this.streamTimeout);
        }
        resolve(response);
      };

      // Set max timeout
      const maxTimeout = setTimeout(() => {
        if (this.isProcessing) {
          this.isProcessing = false;
          const partialResponse = this.cleanResponse(this.responseBuffer);
          resolve(partialResponse || '[Response timeout - partial or no response received]');
        }
      }, CONFIG.maxResponseTime);

      // Send the prompt
      this.process.stdin.write(text + '\n');

      console.log(`📝 Sent to Claude: ${text.substring(0, 50)}...`);
    });
  }

  /**
   * Use Claude for code analysis
   */
  async analyzeCode(code, language = 'unknown') {
    const prompt = `Please analyze the following ${language} code for issues, suggestions, and improvements:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    return this.prompt(prompt);
  }

  /**
   * Use Claude for code review
   */
  async reviewCode(code, context = '') {
    const prompt = `Please review this code${context ? ` (${context})` : ''}:\n\n${code}`;
    return this.prompt(prompt);
  }

  /**
   * Stop the Claude CLI process
   */
  stop() {
    if (this.streamTimeout) {
      clearTimeout(this.streamTimeout);
    }
    if (this.process) {
      this.process.stdin.write('/exit\n');
      setTimeout(() => {
        if (this.process) {
          this.process.kill();
          this.process = null;
        }
      }, 1000);
    }
  }
}

// ============================================================================
// CLAUDE REDIS AGENT
// ============================================================================

class ClaudeRedisAgent {
  constructor() {
    this.client = new RedisAgentClient();
    this.claude = new ClaudeCLIInterface();
    this.isRunning = false;
    this.taskQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Start the agent
   */
  async start() {
    console.log(`
╔═══════════════════════════════════════════════════╗
║         Claude CLI Redis Agent Wrapper            ║
║                  ( Broker Role )                  ║
╚═══════════════════════════════════════════════════╝
`);

    try {
      // Initialize Redis connection
      await this.client.initialize();

      // Start Claude CLI
      await this.claude.start();

      // Register as agent with broker role
      await this.client.register(CONFIG.agentName, CONFIG.agentRole, CONFIG.platform, [
        'code_review',
        'code_analysis',
        'architecture',
        'documentation',
        'task_coordination',
        'claude_cli',
      ]);

      // Set up message handlers
      this.setupHandlers();

      this.isRunning = true;
      console.log('\n🎧 Listening for messages from Redis network...');
      console.log('📋 Claude is acting as BROKER - routing and processing tasks\n');

      // Keep running
      await this.waitForShutdown();
    } catch (error) {
      console.error('Failed to start Claude agent:', error.message);
      try {
        await publishProviderFailureSignal(this.client, {
          channel: CONFIG.modelWatchdogChannel,
          sourceAgent: CONFIG.agentName,
          agentRole: CONFIG.agentRole,
          platform: CONFIG.platform,
          provider: 'anthropic',
          model: 'claude-code-cli',
          category: error.message.includes('Authentication') ? 'auth' : 'availability',
          message: error.message,
        });
        console.log('📡 Emitted watchdog failover signal');
      } catch (e) {
        // Ignore errors sending signal
      }
      await this.stop();
      process.exit(1);
    }
  }

  /**
   * Set up message handlers
   */
  setupHandlers() {
    // Handle direct messages
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

      msg.content = promptText;
      msg.type = 'message';
      msg.metadata = { ...(msg.metadata || {}), wasEvent: true };
      this.queueTask(msg);
    });

    // Handle direct messages
    this.client.onMessage('message', async (msg) => {
      console.log(`\n📨 Received message from ${msg.from.agentName}:`);
      console.log(`   ${msg.content.substring(0, 100)}...`);

      // Add to queue for sequential processing
      this.queueTask(msg);
    });

    // Handle commands
    this.client.onMessage('command', async (msg) => {
      console.log(`\n📋 Received command from ${msg.from.agentName}:`);
      console.log(`   ${msg.content}`);

      // Commands get priority processing
      this.queueTask(msg, true);
    });

    // Handle task assignments (broker specific)
    this.client.onMessage('task', async (msg) => {
      console.log(`\n🎯 Received task assignment:`);
      console.log(`   ${msg.content.substring(0, 100)}...`);

      this.queueTask(msg);
    });
  }

  /**
   * Add task to processing queue
   */
  queueTask(msg, priority = false) {
    if (priority) {
      this.taskQueue.unshift(msg);
    } else {
      this.taskQueue.push(msg);
    }

    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process task queue
   */
  async processQueue() {
    if (this.isProcessingQueue || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.taskQueue.length > 0) {
      const msg = this.taskQueue.shift();

      try {
        // Process through Claude
        const response = await this.claude.prompt(msg.content);

        // Send response back
        await this.client.send(response, {
          replyTo: msg.id,
          type: 'response',
          metadata: {
            processedBy: CONFIG.agentName,
            role: CONFIG.agentRole,
          },
        });

        console.log(`✅ Processed and responded to ${msg.from.agentName}`);
      } catch (error) {
        console.error(`❌ Error processing message:`, error.message);

        await this.client.send(`Error processing request: ${error.message}`, {
          replyTo: msg.id,
          type: 'error',
        });
      }
    }

    this.isProcessingQueue = false;
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
          // Local test: send to Claude and broadcast
          const response = await this.claude.prompt(line.trim());
          console.log(`\n🤖 Claude: ${response}\n`);
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
    this.claude.stop();
    await this.client.cleanup();
    console.log('👋 Claude agent stopped');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const agent = new ClaudeRedisAgent();
  await agent.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ClaudeRedisAgent, ClaudeCLIInterface };
