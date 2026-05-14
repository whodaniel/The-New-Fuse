#!/usr/bin/env node
/**
 * ANTIGRAVITY-GEMINI COLLABORATION AGENT
 *
 * This script connects to the TNF relay and collaborates with Gemini AI
 * through the Chrome extension on the General channel.
 */

const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const AGENT_ID = 'antigravity-agent';
const AGENT_NAME = 'Antigravity AI (Claude)';

class CollaborationAgent {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.messageQueue = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to TNF Relay...');
      this.ws = new WebSocket(RELAY_URL);

      this.ws.on('open', () => {
        this.connected = true;
        console.log('✅ Connected to relay!');
        this.register();
        resolve();
      });

      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        this.handleMessage(msg);
      });

      this.ws.on('error', (err) => {
        console.error('❌ WebSocket error:', err.message);
        reject(err);
      });

      this.ws.on('close', () => {
        this.connected = false;
        console.log('🔌 Disconnected from relay');
      });
    });
  }

  register() {
    this.send({
      type: 'AGENT_REGISTER',
      payload: {
        agent: {
          id: AGENT_ID,
          name: AGENT_NAME,
          platform: 'antigravity-cli',
          status: 'active',
          capabilities: ['reasoning', 'code-generation', 'collaboration', 'task-orchestration'],
          channels: ['general'],
        },
      },
    });
  }

  send(data) {
    if (!this.ws || !this.connected) {
      console.log('⏳ Queuing message (not connected)');
      this.messageQueue.push(data);
      return;
    }

    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: AGENT_ID,
      timestamp: Date.now(),
      ...data,
    };

    this.ws.send(JSON.stringify(msg));
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'WELCOME':
        console.log('📨 Received WELCOME');
        // Flush queued messages
        while (this.messageQueue.length > 0) {
          this.send(this.messageQueue.shift());
        }
        break;

      case 'AGENT_LIST':
        const agents = msg.payload?.agents || [];
        console.log(`\n👥 Agents online: ${agents.map((a) => a.name).join(', ')}`);
        break;

      case 'CHANNEL_LIST':
        const channels = msg.payload?.channels || [];
        console.log(`📢 Channels: ${channels.map((c) => '#' + c.name).join(', ')}`);
        break;

      case 'MESSAGE_RECEIVE':
      case 'CHANNEL_MESSAGE':
        const payload = msg.payload;
        if (payload.from !== AGENT_ID) {
          console.log(`\n💬 ${payload.from}: ${payload.content}`);
        }
        break;

      case 'AGENT_STATUS':
        const agent = msg.payload?.agent;
        if (agent) {
          console.log(`👤 ${agent.name} is now ${agent.status}`);
        }
        break;
    }
  }

  sendToChannel(channel, content) {
    console.log(`\n📤 Sending to #${channel}: ${content.substring(0, 50)}...`);
    this.send({
      type: 'MESSAGE_SEND',
      channel: channel,
      payload: {
        to: 'broadcast',
        content: content,
        messageType: 'text',
      },
    });
  }

  joinChannel(channelId) {
    console.log(`📢 Joining channel #${channelId}`);
    this.send({
      type: 'CHANNEL_JOIN',
      payload: { channelId },
    });
  }

  async collaborate() {
    // Join the general channel
    this.joinChannel('general');

    await this.delay(1000);

    // Send initial greeting and task overview
    this.sendToChannel(
      'general',
      `
👋 Hello Gemini! This is Antigravity AI (Claude) connecting through the TNF relay system.

I'm here to collaborate with you on setting up the full TNF ecosystem. We have 3 tasks:

1️⃣ **Set up CloudRuntime cron jobs** for the self-improvement loop
2️⃣ **Demonstrate the Chrome extension** working with the relay (we're doing that now!)
3️⃣ **Show the Cloud Sandbox Live View** functionality

The fact that you're reading this message proves Task #2 is working! 🎉

Can you confirm you received this message? Let me know and we can proceed with the other tasks.
`
    );

    await this.delay(5000);

    // Send task details
    this.sendToChannel(
      'general',
      `
📋 **TASK 1: CloudRuntime Cron Jobs for Self-Improvement**

I'm creating a cron job configuration for CloudRuntime that will:
- Run health checks every hour
- Perform optimization analysis daily
- Do deep system review weekly

The cron jobs will trigger the TNF orchestrator to:
1. Check all service health endpoints
2. Analyze agent performance metrics
3. Optimize resource allocation
4. Update system configurations

Gemini, while I set this up, could you help by:
- Confirming the Cloud Sandbox endpoint is reachable
- Testing the Live View functionality from your browser
- Suggesting any additional self-improvement metrics we should track?
`
    );

    await this.delay(3000);

    // Send live view instructions
    this.sendToChannel(
      'general',
      `
📺 **TASK 3: Cloud Sandbox Live View**

The Live View feature allows humans to watch what AI agents are doing in headless cloud browsers.

**How it works:**
1. Cloud Sandbox runs Playwright with CDP (Chrome DevTools Protocol)
2. Screenshots are captured via CDP Screencasting
3. Frames are broadcast to connected viewers via Socket.IO
4. Humans can watch at: https://[sandbox-url]/viewer

**To test Live View:**
1. Navigate to the Cloud Sandbox health endpoint
2. Use the browser automation tools to navigate a page
3. Watch the live stream update in real-time

Gemini, can you try browsing to any URL from your tab and see if the system captures it correctly?
`
    );

    console.log('\n🎯 Collaboration messages sent! Waiting for responses...\n');
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Main execution
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                 ANTIGRAVITY-GEMINI COLLABORATION AGENT                       ║
║                                                                              ║
║  Connecting to TNF Relay to collaborate with Gemini AI on the General       ║
║  channel through the Chrome extension.                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  const agent = new CollaborationAgent();

  process.on('SIGINT', () => {
    console.log('\n👋 Closing collaboration...');
    agent.close();
    process.exit(0);
  });

  try {
    await agent.connect();
    await agent.collaborate();

    // Keep listening for responses
    console.log('👂 Listening for Gemini responses (Ctrl+C to stop)...\n');
  } catch (err) {
    console.error('Failed to start collaboration:', err);
    process.exit(1);
  }
}

main();
