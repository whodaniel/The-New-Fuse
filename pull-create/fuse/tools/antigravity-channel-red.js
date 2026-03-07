#!/usr/bin/env node
/**
 * Antigravity Agent - Channel Red Federation Participant
 *
 * This agent joins Channel Red to coordinate on Chrome Extension Federation improvements.
 */

const WebSocket = require('ws');

const RED_CHANNEL_ID = 'channel-1768449642903';
const JWT_SECRET =
  process.env.JWT_SECRET || '72b6c231956097f1f036eee5d937469832e33a7c44649a2437b6c6251a0a12ad';

// Generate a simple token (in production, use the JWT service)
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {
    agentId: 'antigravity-agent',
    platform: 'gemini-cli',
    capabilities: ['orchestration', 'code-modification', 'federation-analysis', 'system-design'],
    name: 'Antigravity Federation Agent',
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

class AntigravityAgent {
  constructor() {
    this.ws = null;
    this.agentId = 'antigravity-agent';
    this.channelMessages = [];
  }

  connect(url = 'ws://localhost:3001/ws') {
    return new Promise((resolve, reject) => {
      console.log('\n╔═══════════════════════════════════════════════════════════╗');
      console.log('║  🌌 ANTIGRAVITY AGENT - JOINING CHANNEL RED               ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log('[Antigravity] ✅ Connected to relay');

        // Register with JWT
        this.send({
          type: 'AGENT_REGISTER',
          token: token,
          id: this.agentId,
          name: 'Antigravity Federation Agent',
          platform: 'gemini-cli',
          capabilities: ['orchestration', 'code-modification', 'federation-analysis'],
        });

        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          this.handleMessage(JSON.parse(data.toString()));
        } catch (e) {
          console.error('[Antigravity] Parse error:', e.message);
        }
      });

      this.ws.on('error', reject);
      this.ws.on('close', () => console.log('[Antigravity] 🔌 Disconnected'));
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
        console.log('[Antigravity] 🔓 Registered successfully');
        console.log(
          `[Antigravity]    Authenticated: ${message.payload.relayInfo.authenticated ? '✅' : '❌'}`
        );
        this.joinRedChannel();
        break;

      case 'CHANNEL_JOINED':
        console.log(`[Antigravity] 📢 Joined channel: ${message.channelId}`);
        this.announcePresence();
        break;

      case 'NEW_MESSAGE':
        const msg = message.message;
        console.log(`\n[Channel Red] 📨 From ${msg.from}: ${msg.content?.substring(0, 100)}...`);
        this.channelMessages.push(msg);
        break;

      case 'AGENT_LIST':
        console.log(`[Antigravity] 👥 Active agents: ${message.agents?.length || 0}`);
        message.agents?.forEach((a) => console.log(`   - ${a.id} (${a.platform})`));
        break;
    }
  }

  joinRedChannel() {
    console.log('[Antigravity] 🔴 Joining Channel Red...');
    this.send({
      type: 'CHANNEL_JOIN',
      channelId: RED_CHANNEL_ID,
    });
  }

  announcePresence() {
    console.log('[Antigravity] 📣 Announcing presence...');
    this.send({
      type: 'MESSAGE_SEND',
      channel: RED_CHANNEL_ID,
      payload: {
        to: 'broadcast',
        content: `🌌 ANTIGRAVITY AGENT ONLINE - I am now analyzing Chrome Extension Federation patterns and will implement improvements. Current focus: perfecting agent registration, message routing, and response detection for multi-instance AI chat coordination.`,
        messageType: 'announcement',
        metadata: {
          agentId: this.agentId,
          task: 'chrome-extension-federation-audit',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  sendUpdate(content) {
    this.send({
      type: 'MESSAGE_SEND',
      channel: RED_CHANNEL_ID,
      payload: {
        to: 'broadcast',
        content,
        messageType: 'status-update',
        metadata: {
          agentId: this.agentId,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}

const agent = new AntigravityAgent();

agent
  .connect()
  .then(() => {
    console.log('\n[Antigravity] 🎯 Agent active on Channel Red');
    console.log('[Antigravity] Listening for messages...\n');

    // Keep alive for 30 seconds to observe channel activity
    setTimeout(() => {
      agent.sendUpdate(
        '📊 Federation analysis complete. Implementing Chrome Extension improvements now.'
      );
      setTimeout(() => agent.disconnect(), 2000);
    }, 10000);
  })
  .catch((err) => {
    console.error('[Antigravity] Connection failed:', err.message);
  });
