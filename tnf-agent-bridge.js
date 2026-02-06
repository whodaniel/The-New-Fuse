#!/usr/bin/env node
/**
 * TNF Agent Bridge - Hardened Terminal Connection
 *
 * Provides:
 * - Automatic Reconnect
 * - Heartbeat management
 * - Message signing
 * - Command-line interface for manual testing
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');

class TNFAgentBridge extends EventEmitter {
  constructor(config) {
    super();
    this.config = {
      relayUrl: config.relayUrl || 'ws://localhost:3000/ws',
      agentId: config.agentId || `agent-${Math.random().toString(36).substr(2, 5)}`,
      name: config.name || 'Generic Agent',
      platform: config.platform || 'cli-agent',
      capabilities: config.capabilities || [],
      reconnectDelay: config.reconnectDelay || 5000,
      heartbeatInterval: config.heartbeatInterval || 25000,
      ...config,
    };

    this.ws = null;
    this.heartbeatTimer = null;
    this.assignedId = null;
    this.currentChannel = null;
    this.isShuttingDown = false;
  }

  connect() {
    if (this.isShuttingDown) return;

    console.log(`[Bridge] Connecting to ${this.config.relayUrl}...`);
    this.ws = new WebSocket(this.config.relayUrl);

    this.ws.on('open', () => {
      console.log('[Bridge] Connected to relay');
      this.register();
      this.startHeartbeat();
      this.emit('connected');
    });

    this.ws.on('message', (data) => this.handleMessage(data));

    this.ws.on('close', () => {
      console.warn('[Bridge] Disconnected');
      this.stopHeartbeat();
      if (!this.isShuttingDown) {
        setTimeout(() => this.connect(), this.config.reconnectDelay);
      }
      this.emit('disconnected');
    });

    this.ws.on('error', (err) => {
      console.error('[Bridge] Error:', err.message);
    });
  }

  register() {
    this.send('AGENT_REGISTER', {
      agent: {
        id: this.config.agentId,
        name: this.config.name,
        platform: this.config.platform,
        capabilities: this.config.capabilities,
        metadata: {
          version: '1.0.0',
          hardened: true,
        },
      },
    });
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send('HEARTBEAT', { timestamp: Date.now() });
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  handleMessage(data) {
    try {
      const msg = JSON.parse(data.toString());
      const { type, payload, channel } = msg;

      if (type === 'PING') {
        this.send('PONG', { originalTimestamp: payload?.timestamp });
        return;
      }

      if (type === 'WELCOME') {
        console.log('[Bridge] Welcome received:', payload.message);
      }

      if (type === 'CHANNEL_MESSAGE' || type === 'MESSAGE_RECEIVE') {
        const content = payload?.content || '';

        // Detect ID assignment from orchestrator
        if (content.includes('Your Assigned ID:')) {
          const match = content.match(/AGENT-\d{2}/);
          if (match) {
            this.assignedId = match[0];
            console.log(`[Bridge] Discovered Assigned ID: ${this.assignedId}`);
          }
        }
      }

      this.emit('message', msg);
    } catch (e) {
      console.error('[Bridge] Failed to handle message:', e.message);
    }
  }

  send(type, payload, channelId = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      source: this.config.agentId,
      channel: channelId || this.currentChannel,
      payload,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(msg));
  }

  broadcast(content, metadata = {}) {
    const signedContent = this.assignedId ? `[${this.assignedId}] ${content}` : content;
    this.send('MESSAGE_SEND', {
      to: 'broadcast',
      content: signedContent,
      metadata,
    });
  }

  join(channelId) {
    this.send('CHANNEL_JOIN', { channelId: channelId });
    this.currentChannel = channelId;
  }

  shutdown() {
    this.isShuttingDown = true;
    this.stopHeartbeat();
    if (this.ws) this.ws.close();
  }
}

// Export for module use
module.exports = TNFAgentBridge;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const channelName = args[0] || 'general';

  const bridge = new TNFAgentBridge({
    agentId: `terminal-${process.pid}`,
    name: `Codex-Bridge-${process.pid}`,
    capabilities: ['terminal-access', 'system-monitor'],
  });

  bridge.connect();

  bridge.on('connected', () => {
    console.log(`[CLI] Joining ${channelName}...`);
    setTimeout(() => bridge.join(channelName), 1000);
  });

  bridge.on('message', (msg) => {
    if (msg.type === 'CHANNEL_MESSAGE' || msg.type === 'MESSAGE_RECEIVE') {
      const from = msg.payload?.from || msg.source || 'system';
      console.log(`\n[${from}] ${msg.payload?.content}`);
    }
  });

  process.on('SIGINT', () => {
    console.log('\n[CLI] Shutting down...');
    bridge.shutdown();
    process.exit(0);
  });
}
