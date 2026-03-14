const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3000/ws';
const AGENT_ID = 'terminal-agent-007';

class MockAgent {
  constructor() {
    this.ws = null;
    this.connect();
  }

  connect() {
    console.log(`[MockAgent] Connecting to ${RELAY_URL}...`);
    this.ws = new WebSocket(RELAY_URL);

    this.ws.on('open', () => {
      console.log('[MockAgent] Connected');
      this.register();
    });

    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        this.handleMessage(msg);
      } catch (e) {
        console.error('[MockAgent] Parse error:', e);
      }
    });

    this.ws.on('close', () => {
      console.log('[MockAgent] Disconnected. Retrying in 3s...');
      setTimeout(() => this.connect(), 3000);
    });

    this.ws.on('error', (err) => {
      console.error('[MockAgent] Error:', err.message);
    });
  }

  register() {
    const msg = {
      id: crypto.randomUUID(),
      type: 'AGENT_REGISTER',
      timestamp: Date.now(),
      source: AGENT_ID,
      payload: {
        agent: {
          id: AGENT_ID,
          name: 'Terminal Agent',
          platform: 'vscode', // Pretend to be VS Code
          status: 'active',
          capabilities: ['code-execution', 'file-system'],
          channels: ['red', 'general']
        }
      }
    };
    this.send(msg);
  }

  joinChannel(channelId) {
    const msg = {
      id: crypto.randomUUID(),
      type: 'CHANNEL_JOIN',
      timestamp: Date.now(),
      source: AGENT_ID,
      payload: { channelId }
    };
    this.send(msg);
  }

  send(msg) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  handleMessage(msg) {
    // console.log(`[MockAgent] Received: ${msg.type}`);

    if (msg.type === 'WELCOME') {
      console.log('[MockAgent] Registered successfully');
      this.joinChannel('red');
    }

    if (msg.type === 'MESSAGE_SEND' || msg.type === 'CHANNEL_MESSAGE') {
      const content = msg.payload?.content || '';
      const from = msg.source || msg.from;
      
      console.log(`[MockAgent] 📩 Message from ${from}: ${content.substring(0, 50)}...`);

      if (content.includes('Fibonacci')) {
        console.log('[MockAgent] Received task! Executing...');
        setTimeout(() => {
          this.sendResponse(msg, '```python
def fib(n):
  if n <= 1: return n
  return fib(n-1) + fib(n-2)
```');
        }, 2000);
      }
    }
  }

  sendResponse(originalMsg, content) {
    const response = {
      id: crypto.randomUUID(),
      type: 'MESSAGE_SEND',
      timestamp: Date.now(),
      source: AGENT_ID,
      channel: originalMsg.channel || 'general',
      payload: {
        to: originalMsg.source, // Reply to sender
        content: content,
        messageType: 'text',
        metadata: {
          inResponseTo: originalMsg.id,
          senderId: AGENT_ID
        }
      }
    };
    this.send(response);
    console.log('[MockAgent] 📤 Sent response');
  }
}

new MockAgent();
