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

const { spawn } = require('child_process');
const { RedisAgentClient } = require('./tnf-agent-cli.cjs');
const readline = require('readline');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  agentName: process.env.AGENT_NAME || 'gemini',
  agentRole: process.env.AGENT_ROLE || 'worker',
  platform: 'gemini',
  geminiCommand: process.env.GEMINI_CMD || 'gemini', // The gemini CLI command
  maxResponseTime: 120000, // 2 minutes max wait
};

// ============================================================================
// GEMINI CLI INTERFACE
// ============================================================================

class GeminiCLIInterface {
  constructor() {
    this.process = null;
    this.responseBuffer = '';
    this.responseCallback = null;
    this.isProcessing = false;
  }

  /**
   * Start a new Gemini CLI session
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🚀 Starting Gemini CLI process...`);

        // Start Gemini in interactive mode
        this.process = spawn(CONFIG.geminiCommand, [], {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
        });

        this.process.stdout.on('data', (data) => {
          this.handleOutput(data.toString());
        });

        this.process.stderr.on('data', (data) => {
          console.error(`Gemini stderr: ${data}`);
        });

        this.process.on('error', (error) => {
          console.error(`Gemini process error: ${error.message}`);
          reject(error);
        });

        this.process.on('close', (code) => {
          console.log(`Gemini process exited with code ${code}`);
        });

        // Give it a moment to start
        setTimeout(() => {
          console.log('✅ Gemini CLI started');
          resolve();
        }, 2000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle output from Gemini
   */
  handleOutput(text) {
    this.responseBuffer += text;

    // Check if response is complete (look for prompt indicator)
    // This may need adjustment based on Gemini CLI's actual output format
    if (
      this.responseBuffer.includes('> ') ||
      this.responseBuffer.includes('\n\n') ||
      this.responseBuffer.includes('[Done]')
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
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('Gemini CLI not started'));
        return;
      }

      this.isProcessing = true;
      this.responseBuffer = '';

      // Set up response callback
      this.responseCallback = (response) => {
        resolve(response);
      };

      // Set timeout
      const timeout = setTimeout(() => {
        if (this.isProcessing) {
          this.isProcessing = false;
          resolve(this.cleanResponse(this.responseBuffer) || '[No response within timeout]');
        }
      }, CONFIG.maxResponseTime);

      // Send the prompt
      this.process.stdin.write(text + '\n');

      console.log(`📝 Sent to Gemini: ${text.substring(0, 50)}...`);
    });
  }

  /**
   * Stop the Gemini CLI process
   */
  stop() {
    if (this.process) {
      this.process.stdin.write('/exit\n');
      this.process.kill();
      this.process = null;
    }
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
      ]);

      // Set up message handlers
      this.setupHandlers();

      this.isRunning = true;
      console.log('\n🎧 Listening for messages from Redis network...\n');

      // Keep running
      await this.waitForShutdown();
    } catch (error) {
      console.error('Failed to start Gemini agent:', error.message);
      await this.stop();
      process.exit(1);
    }
  }

  /**
   * Set up message handlers
   */
  setupHandlers() {
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
