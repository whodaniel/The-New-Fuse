#!/usr/bin/env node
/**
 * TNF Relay Listener - Connects to relay and displays all messages
 * 
 * Usage:
 *   node relay-listener.js [channel]
 * 
 * Examples:
 *   node relay-listener.js                    # Listen on all channels
 *   node relay-listener.js "Test Channel 1"  # Listen on specific channel
 */

const WebSocket = require('ws');

// Configuration
const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3000/ws';
const AGENT_ID = `listener-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
const AGENT_NAME = 'AI Bridge Listener';
const TARGET_CHANNEL = process.argv[2] || null;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function log(color, prefix, message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${prefix}${colors.reset} ${message}`);
}

function logMessage(msg) {
  console.log('\n' + colors.bright + '═'.repeat(60) + colors.reset);
  console.log(`${colors.cyan}📨 MESSAGE RECEIVED${colors.reset}`);
  console.log('─'.repeat(60));
  console.log(`${colors.yellow}From:${colors.reset}    ${msg.from || 'unknown'}`);
  console.log(`${colors.yellow}To:${colors.reset}      ${msg.to || 'broadcast'}`);
  console.log(`${colors.yellow}Channel:${colors.reset} ${msg.channel || 'none'}`);
  console.log(`${colors.yellow}Type:${colors.reset}    ${msg.type || 'text'}`);
  console.log('─'.repeat(60));
  console.log(`${colors.green}Content:${colors.reset}`);
  console.log(msg.content || JSON.stringify(msg, null, 2));
  console.log(colors.bright + '═'.repeat(60) + colors.reset + '\n');
}

class RelayListener {
  constructor() {
    this.ws = null;
    this.channels = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  connect() {
    log(colors.cyan, '🔌', `Connecting to relay at ${RELAY_URL}...`);
    
    this.ws = new WebSocket(RELAY_URL);

    this.ws.on('open', () => {
      log(colors.green, '✅', 'Connected to relay!');
      this.reconnectAttempts = 0;
      this.register();
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (e) {
        log(colors.red, '❌', `Failed to parse message: ${e.message}`);
      }
    });

    this.ws.on('close', () => {
      log(colors.yellow, '⚠️', 'Disconnected from relay');
      this.scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      log(colors.red, '❌', `WebSocket error: ${err.message}`);
    });
  }

  register() {
    const registerMsg = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'AGENT_REGISTER',
      timestamp: Date.now(),
      source: AGENT_ID,
      payload: {
        agent: {
          id: AGENT_ID,
          name: AGENT_NAME,
          platform: 'cli-listener',
          status: 'active',
          capabilities: ['message-listening', 'ai-bridge'],
          channels: [],
        },
      },
    };

    this.send(registerMsg);
    log(colors.green, '📝', `Registered as "${AGENT_NAME}" (${AGENT_ID})`);

    // Request channel list
    this.send({ type: 'CHANNEL_LIST', source: AGENT_ID });
  }

  handleMessage(message) {
    const { type, payload } = message;

    switch (type) {
      case 'WELCOME':
        log(colors.cyan, '👋', 'Welcome message received');
        break;

      case 'AGENT_LIST':
        const agents = payload?.agents || [];
        log(colors.blue, '🤖', `${agents.length} agent(s) connected:`);
        agents.forEach(a => {
          console.log(`     • ${a.name} (${a.platform}) - ${a.status}`);
        });
        break;

      case 'CHANNEL_LIST':
        this.channels = payload?.channels || [];
        log(colors.blue, '📢', `${this.channels.length} channel(s) available:`);
        this.channels.forEach(ch => {
          console.log(`     • ${ch.name} (${ch.id}) - ${ch.members?.length || 0} members`);
        });

        // Join target channel if specified
        if (TARGET_CHANNEL) {
          const channel = this.channels.find(
            c => c.name.toLowerCase() === TARGET_CHANNEL.toLowerCase() || c.id === TARGET_CHANNEL
          );
          if (channel) {
            this.joinChannel(channel.id);
          } else {
            log(colors.yellow, '⚠️', `Channel "${TARGET_CHANNEL}" not found`);
          }
        } else {
          // Join all channels
          this.channels.forEach(ch => this.joinChannel(ch.id));
        }
        break;

      case 'AGENT_STATUS':
        const agent = payload?.agent;
        if (agent) {
          const status = agent.status === 'active' ? colors.green + '● online' : colors.red + '○ offline';
          log(colors.blue, '🤖', `Agent ${agent.name}: ${status}${colors.reset}`);
        }
        break;

      case 'CHANNEL_MESSAGE':
      case 'MESSAGE_RECEIVE':
        // This is what we're looking for!
        const msg = payload || message;
        logMessage(msg);
        
        // If this is an AI response, we could respond here
        if (msg.type === 'ai-response' || msg.content?.includes('[AI Response]')) {
          log(colors.magenta, '🤖', 'AI Response detected! This could trigger further processing...');
        }
        break;

      default:
        log(colors.dim, '📩', `${type}: ${JSON.stringify(payload || {}).substring(0, 100)}`);
    }
  }

  joinChannel(channelId) {
    this.send({
      type: 'CHANNEL_JOIN',
      source: AGENT_ID,
      payload: { channelId },
    });
    log(colors.green, '📢', `Joined channel: ${channelId}`);
  }

  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const fullMessage = {
        id: message.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        source: AGENT_ID,
        ...message,
      };
      this.ws.send(JSON.stringify(fullMessage));
    }
  }

  sendMessage(content, channel = null) {
    this.send({
      type: 'MESSAGE_SEND',
      channel: channel,
      payload: {
        to: 'broadcast',
        content: content,
        messageType: 'text',
      },
    });
    log(colors.green, '📤', `Sent: ${content}`);
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(5000 * Math.pow(1.5, this.reconnectAttempts), 30000);
      log(colors.yellow, '🔄', `Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), delay);
    } else {
      log(colors.red, '❌', 'Max reconnection attempts reached. Exiting.');
      process.exit(1);
    }
  }

  startHeartbeat() {
    setInterval(() => {
      this.send({ type: 'HEARTBEAT' });
    }, 30000);
  }
}

// Main
console.log('\n' + colors.bright + colors.cyan);
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║           🔊 TNF RELAY LISTENER                           ║');
console.log('║                                                           ║');
console.log('║   Listening for messages from the Fuse Connect extension ║');
console.log('║   AI responses will be displayed here                    ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(colors.reset + '\n');

if (TARGET_CHANNEL) {
  log(colors.cyan, '🎯', `Target channel: "${TARGET_CHANNEL}"`);
} else {
  log(colors.cyan, '🎯', 'Listening on ALL channels');
}

const listener = new RelayListener();
listener.connect();
listener.startHeartbeat();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n');
  log(colors.yellow, '👋', 'Shutting down listener...');
  if (listener.ws) {
    listener.ws.close();
  }
  process.exit(0);
});

// Interactive mode - allow sending messages from stdin
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (input) => {
  if (input.trim()) {
    const targetChannelId = TARGET_CHANNEL 
      ? listener.channels.find(c => c.name.toLowerCase() === TARGET_CHANNEL.toLowerCase())?.id 
      : null;
    listener.sendMessage(input.trim(), targetChannelId);
  }
});

console.log(colors.dim + 'Tip: Type a message and press Enter to broadcast it to the relay.\n' + colors.reset);
