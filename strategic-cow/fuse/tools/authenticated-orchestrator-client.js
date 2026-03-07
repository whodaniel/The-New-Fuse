#!/usr/bin/env node
/**
 * Authenticated Orchestrator Client
 *
 * Connects to the relay server with JWT authentication and demonstrates:
 * - JWT token generation
 * - WebSocket connection with authentication
 * - Sending authenticated messages
 * - Receiving responses
 */

const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

// Configuration
const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3001/ws';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Generate a JWT token for the orchestrator
 */
function generateOrchestratorToken() {
  const payload = {
    agentId: `orchestrator-claude-${Date.now()}`,
    name: 'Claude Code Orchestrator',
    platform: 'claude-code',
    capabilities: ['orchestration', 'task-delegation', 'code-analysis', 'system-improvement'],
    role: 'orchestrator',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
  });

  console.log('🔑 Generated JWT token for orchestrator');
  console.log('Agent ID:', payload.agentId);
  console.log('Token:', token);
  console.log('');

  return { token, agentId: payload.agentId };
}

/**
 * Connect to relay with authentication
 */
function connectToRelay(token, agentId) {
  return new Promise((resolve, reject) => {
    console.log('🔌 Connecting to relay:', RELAY_URL);

    const ws = new WebSocket(RELAY_URL);
    let authenticated = false;

    ws.on('open', () => {
      console.log('✅ WebSocket connected');

      // Send registration with JWT token
      const registrationMessage = {
        type: 'AGENT_REGISTER',
        token: token,
        payload: {
          agent: {
            id: agentId,
            name: 'Claude Code Orchestrator',
            platform: 'claude-code',
            capabilities: [
              'orchestration',
              'task-delegation',
              'code-analysis',
              'system-improvement',
            ],
            channels: ['General', 'Red'],
          },
        },
      };

      console.log('📤 Sending registration with JWT token...');
      ws.send(JSON.stringify(registrationMessage));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📥 Received message:', message.type);

        if (message.type === 'REGISTRATION_SUCCESS') {
          console.log('✅ Authentication successful!');
          console.log('   Agent ID:', message.payload?.agent?.id);
          console.log('   Channels:', message.payload?.agent?.channels?.join(', '));
          authenticated = true;
          resolve({ ws, agentId });
        } else if (message.type === 'REGISTRATION_ERROR') {
          console.error('❌ Authentication failed:', message.payload?.error);
          reject(new Error(message.payload?.error || 'Authentication failed'));
          ws.close();
        } else if (message.type === 'CHANNEL_MESSAGE') {
          console.log('📨 Channel message received:');
          console.log('   From:', message.payload?.sender?.name);
          console.log('   Channel:', message.payload?.channelName);
          console.log('   Content:', message.payload?.content);
        } else {
          console.log('   Payload:', JSON.stringify(message.payload, null, 2));
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      if (!authenticated) {
        reject(error);
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
      if (!authenticated) {
        reject(new Error('Connection closed before authentication'));
      }
    });

    // Timeout after 10 seconds if not authenticated
    setTimeout(() => {
      if (!authenticated) {
        console.error('⏱️  Authentication timeout');
        ws.close();
        reject(new Error('Authentication timeout'));
      }
    }, 10000);
  });
}

/**
 * Send a test message to a channel
 */
function sendTestMessage(ws, agentId, channelName, content) {
  const message = {
    type: 'MESSAGE_SEND',
    payload: {
      channelId: channelName,
      channelName: channelName,
      content: content,
      sender: {
        id: agentId,
        name: 'Claude Code Orchestrator',
        platform: 'claude-code',
      },
      metadata: {
        source: 'orchestrator',
        taskId: `task-${Date.now()}`,
        requiresResponse: true,
        priority: 'high',
      },
    },
  };

  console.log('');
  console.log('📤 Sending message to channel:', channelName);
  console.log('   Content:', content);
  ws.send(JSON.stringify(message));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Authenticated Orchestrator Client');
  console.log('=====================================');
  console.log('');

  try {
    // Step 1: Generate JWT token
    const { token, agentId } = generateOrchestratorToken();

    // Step 2: Connect to relay with authentication
    const { ws } = await connectToRelay(token, agentId);

    // Step 3: Send a test message to Red channel
    setTimeout(() => {
      sendTestMessage(
        ws,
        agentId,
        'Red',
        'Testing authenticated orchestrator connection. Please respond if you can see this message.'
      );
    }, 2000);

    // Step 4: Send a task delegation message
    setTimeout(() => {
      sendTestMessage(
        ws,
        agentId,
        'Red',
        JSON.stringify({
          type: 'TASK_DELEGATION',
          task: 'Echo this message back to confirm communication is working',
          requester: 'Claude Code Orchestrator',
          priority: 'high',
        })
      );
    }, 5000);

    // Keep connection alive
    console.log('');
    console.log('🎧 Listening for messages... (Press Ctrl+C to exit)');
    console.log('');

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
      }
    }, 30000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('');
      console.log('👋 Shutting down...');
      clearInterval(heartbeatInterval);
      ws.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  generateOrchestratorToken,
  connectToRelay,
  sendTestMessage,
};
