#!/usr/bin/env node
/**
 * Authenticated Orchestrator Client
 *
 * ORCHESTRATOR IMPROVEMENT: Security enhancement from federated intelligence
 * - Uses JWT authentication for relay registration
 * - Implements capability-based access control
 * - Connects to Red channel for task delegation
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const RED_CHANNEL_ID = 'channel-1768449642903';

// Token from generate-agent-token CLI
const AGENT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2VudElkIjoib3JjaGVzdHJhdG9yLWNsYXVkZSIsInBsYXRmb3JtIjoiY2xhdWRlLWNvZGUiLCJjYXBhYmlsaXRpZXMiOlsib3JjaGVzdHJhdGlvbiIsInRhc2stZGVsZWdhdGlvbiIsImNvZGUtbW9kaWZpY2F0aW9uIiwic3lzdGVtLWFuYWx5c2lzIiwiZmlsZS1zeXN0ZW0tYWNjZXNzIiwiZmVkZXJhdGVkLWludGVsbGlnZW5jZSJdLCJuYW1lIjoiY2xhdWRlLWNvZGUgYWdlbnQiLCJtZXRhZGF0YSI6eyJnZW5lcmF0ZWRBdCI6IjIwMjYtMDEtMTVUMDQ6NDE6NTYuNTIxWiIsImdlbmVyYXRlZEJ5IjoiZ2VuZXJhdGUtYWdlbnQtdG9rZW4gQ0xJIn0sImlhdCI6MTc2ODQ1MjExNiwiZXhwIjoxNzY4NTM4NTE2fQ.MBPY1_MXVKEC5SXI07i25TicUtM93QRQrfzm5wdGZos';

class AuthenticatedOrchestrator {
  constructor() {
    this.ws = null;
    this.agentId = 'orchestrator-claude';
    this.responses = [];
    this.taskId = null;
    this.startTime = null;
  }

  connect(url = 'ws://localhost:3001/ws') {
    return new Promise((resolve, reject) => {
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║  🛡️  AUTHENTICATED ORCHESTRATOR CONNECTING                ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');

      console.log(`[Orchestrator] 🎯 Target: ${url}`);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log('[Orchestrator] ✅ Connection established');

        // Register with JWT token
        console.log('[Orchestrator] 🔑 Sending AGENT_REGISTER with JWT...');
        this.send({
          type: 'AGENT_REGISTER',
          token: AGENT_TOKEN, // <-- JWT AUTHENTICATION
          id: this.agentId,
          name: 'Claude Code Authenticated Orchestrator',
          platform: 'claude-code',
          capabilities: [
            'orchestration',
            'task-delegation',
            'code-modification',
            'system-analysis',
          ],
        });

        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          this.handleMessage(JSON.parse(data.toString()));
        } catch (e) {
          console.error('[Orchestrator] ❌ Message parse error:', e.message);
        }
      });

      this.ws.on('error', (error) => {
        console.error('[Orchestrator] ❌ WebSocket error:', error.message);
        reject(error);
      });

      this.ws.on('close', (code, reason) => {
        console.log(`[Orchestrator] 🔌 Connection closed (code: ${code})`);
        if (reason) console.log(`[Orchestrator]    Reason: ${reason}`);
      });
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'REGISTRATION_CONFIRMED':
        console.log('\n[Orchestrator] 🔓 AUTHENTICATION SUCCESSFUL');
        console.log(`[Orchestrator]    Relay ID: ${message.payload.relayInfo.id}`);
        console.log(`[Orchestrator]    Version: ${message.payload.relayInfo.version}`);
        console.log(
          `[Orchestrator]    Secure: ${message.payload.relayInfo.authenticated ? '✅ Yes' : '❌ No'}`
        );

        // Auto-join Red channel upon registration
        this.joinRedChannel();
        break;

      case 'REGISTRATION_ERROR':
        console.error('\n[Orchestrator] 🚫 AUTHENTICATION FAILED');
        console.error(`[Orchestrator]    Error: ${message.payload.error}`);
        console.error(`[Orchestrator]    Code: ${message.payload.code}`);
        break;

      case 'CHANNEL_JOINED':
        console.log(`[Orchestrator] 📢 Joined channel: ${message.channelId}`);
        break;

      case 'NEW_MESSAGE':
        const msg = message.message;
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

        // Log all messages (not just task-related)
        console.log(`\n[Orchestrator] 📥 Message from ${msg?.from || 'unknown'} (${elapsed}s)`);
        if (msg?.metadata?.correlationId) {
          console.log(`[Orchestrator]    🔗 Correlation: ${msg.metadata.correlationId}`);
        }
        if (msg?.metadata?.isAIResponse) {
          console.log(
            `[Orchestrator]    🤖 AI Response from: ${msg.metadata.platform || 'unknown'}`
          );
        }

        // Track all responses with metadata
        if (msg?.content) {
          this.responses.push({
            agentId: msg.from,
            content: msg.content,
            timestamp: Date.now(),
            elapsed: parseFloat(elapsed),
            metadata: msg.metadata || {},
          });
        }
        break;

      default:
        // Other messages
        break;
    }
  }

  joinRedChannel() {
    console.log('[Orchestrator] 🔴 Joining Red channel...');
    this.send({
      type: 'CHANNEL_JOIN',
      channelId: RED_CHANNEL_ID,
    });
  }

  async runTestTask() {
    this.taskId = `auth-test-${Date.now()}`;
    this.startTime = Date.now();

    // FEDERATION IMPROVEMENT: Generate correlation ID for response matching
    const correlationId = `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('\n[Orchestrator] 📝 Sending authenticated test task...');
    console.log(`[Orchestrator]    Task ID: ${this.taskId}`);
    console.log(`[Orchestrator]    Correlation ID: ${correlationId}`);

    this.send({
      type: 'MESSAGE_SEND',
      channel: RED_CHANNEL_ID,
      payload: {
        to: 'broadcast',
        content: `AUTHENTICATED TEST: This message was sent by a verified orchestrator with JWT token. Response requested. Task ID: ${this.taskId}`,
        messageType: 'orchestrator-task',
        metadata: {
          taskId: this.taskId,
          correlationId: correlationId,
          source: 'orchestrator',
          requiresResponse: true,
          authenticated: true,
          sentAt: new Date().toISOString(),
        },
      },
    });

    // Wait for responses
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Check for correlated responses
    const correlatedResponses = this.responses.filter(
      (r) => r.metadata?.correlationId === correlationId || r.metadata?.taskId === this.taskId
    );

    console.log(
      `\n[Orchestrator] 🔗 Correlated responses: ${correlatedResponses.length}/${this.responses.length}`
    );

    return this.responses;
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  const orchestrator = new AuthenticatedOrchestrator();

  try {
    await orchestrator.connect();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await orchestrator.runTestTask();

    console.log(
      `\n[Orchestrator] Test complete. Received ${orchestrator.responses.length} responses.`
    );
    orchestrator.disconnect();
  } catch (error) {
    console.error('\n[Orchestrator] ❌ Error:', error.message);
    orchestrator.disconnect();
  }
}

if (require.main === module) {
  main();
}
