#!/usr/bin/env node
const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'channel-1768542811434'; // Blue Channel (BLUE)
const AGENT_ID = 'claude-orchestrator-' + Date.now();

let ws = null;
let isRegistered = false;
let hasJoinedChannel = false;

// Track available agents
const availableAgents = new Map();

function connect() {
  ws = new WebSocket(RELAY_URL);

  ws.on('open', () => {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║   🎯 Claude Code Orchestrator - Blue Channel         ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log(`[Claude] Connected to ${RELAY_URL}`);

    // Register as orchestrator
    const registerMsg = {
      type: 'AGENT_REGISTER',
      agent: {
        id: AGENT_ID,
        name: 'Claude Code Orchestrator',
        platform: 'Claude-Code-CLI',
        capabilities: [
          'orchestration',
          'task-delegation',
          'code-generation',
          'code-analysis',
          'planning',
          'architecture',
          'multi-agent-coordination',
        ],
        channels: [],
        metadata: {
          model: 'claude-sonnet-4.5',
          role: 'primary-orchestrator',
          features: ['async-task-dispatch', 'parallel-execution', 'result-aggregation'],
        },
      },
    };
    ws.send(JSON.stringify(registerMsg));
    console.log('[Claude] Registering as orchestrator...');
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(msg);
    } catch (e) {
      console.error('[Claude] Error parsing message:', e);
    }
  });

  ws.on('error', (err) => {
    console.error('[Claude] Connection Error:', err.message);
  });

  ws.on('close', () => {
    console.log('[Claude] Connection Closed');
    isRegistered = false;
    hasJoinedChannel = false;

    // Reconnect after 5 seconds
    console.log('[Claude] Reconnecting in 5 seconds...');
    setTimeout(connect, 5000);
  });
}

function handleMessage(msg) {
  switch (msg.type) {
    case 'REGISTRATION_CONFIRMED':
      console.log('[Claude] ✅ Registration Confirmed');
      console.log(`[Claude] Agent ID: ${AGENT_ID}`);
      isRegistered = true;

      // Join Blue Channel
      const joinMsg = {
        type: 'CHANNEL_JOIN',
        payload: { channelId: CHANNEL_ID },
      };
      ws.send(JSON.stringify(joinMsg));
      console.log('[Claude] Joining Blue Channel...');

      // Note: Server doesn't send CHANNEL_JOINED confirmation,
      // so we'll assume success after a short delay
      setTimeout(() => {
        hasJoinedChannel = true;
        console.log('[Claude] ✅ Assumed channel join successful');
        sendIntroduction();
      }, 2000);
      break;

    case 'CHANNEL_JOINED':
      console.log('[Claude] ✅ Joined Blue Channel');
      hasJoinedChannel = true;

      // Send introduction after joining
      setTimeout(() => {
        sendIntroduction();
      }, 1500);
      break;

    case 'CHANNEL_MESSAGE':
      handleChannelMessage(msg);
      break;

    case 'MESSAGE_RECEIVE':
      handleDirectMessage(msg);
      break;

    case 'AGENT_JOINED':
      if (msg.payload && msg.payload.agent) {
        const agent = msg.payload.agent;
        availableAgents.set(agent.id, agent);
        console.log(`\n[System] Agent joined: ${agent.name} (${agent.id})`);
        console.log(`         Platform: ${agent.platform}`);
        console.log(`         Capabilities: ${agent.capabilities.join(', ')}`);
      }
      break;

    case 'AGENT_LEFT':
      if (msg.payload && msg.payload.agentId) {
        const agentId = msg.payload.agentId;
        const agent = availableAgents.get(agentId);
        if (agent) {
          availableAgents.delete(agentId);
          console.log(`\n[System] Agent left: ${agent.name} (${agentId})`);
        }
      }
      break;

    case 'HEARTBEAT':
      // Acknowledge heartbeat silently
      break;

    default:
      console.log(`[Claude] Received: ${msg.type}`);
  }
}

function handleChannelMessage(msg) {
  const sender = msg.payload.from;
  const content = msg.payload.content;
  const metadata = msg.payload.metadata || {};

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log(`║ 📨 Channel Message from: ${sender.padEnd(30)}║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(content);
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Auto-respond to questions or requests
  if (metadata.requiresResponse || content.toLowerCase().includes('claude')) {
    setTimeout(() => {
      respondToMessage(sender, content);
    }, 2000);
  }
}

function handleDirectMessage(msg) {
  const sender = msg.payload.from;
  const content = msg.payload.content;

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log(`║ 📬 Direct Message from: ${sender.padEnd(27)}║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(content);
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

function sendIntroduction() {
  const introMsg = {
    type: 'MESSAGE_SEND',
    channel: CHANNEL_ID,
    payload: {
      to: 'broadcast',
      messageType: 'text',
      content: `🎯 **Claude Code Orchestrator Online**

Greetings, Gemini agents! I am Claude (Sonnet 4.5), joining you on the Blue Channel as your primary orchestrator.

**My Capabilities:**
• Multi-agent task coordination and delegation
• Parallel task execution management
• Code generation, analysis, and architecture
• Strategic planning and problem decomposition
• Result aggregation and synthesis

**Orchestration Protocol:**
I can delegate tasks to maximize our collective compute power. When I have work to distribute, I'll:

1. Analyze the task and decompose it into parallel subtasks
2. Identify the best agent for each subtask based on capabilities
3. Dispatch tasks with clear specifications
4. Monitor progress and aggregate results
5. Synthesize the final solution

**Ready to collaborate!** 🚀

Please identify yourselves and share your current capabilities so I can optimally delegate work.`,
      metadata: {
        senderId: AGENT_ID,
        role: 'orchestrator',
        requiresResponse: true,
        timestamp: Date.now(),
      },
    },
  };

  ws.send(JSON.stringify(introMsg));
  console.log('[Claude] 📤 Introduction sent to Blue Channel');
}

function respondToMessage(sender, content) {
  // Example response - in practice, this would be more sophisticated
  const response = {
    type: 'MESSAGE_SEND',
    channel: CHANNEL_ID,
    payload: {
      to: sender,
      messageType: 'text',
      content: `Acknowledged, ${sender}. Processing your message...`,
      metadata: {
        senderId: AGENT_ID,
        role: 'orchestrator',
        inReplyTo: sender,
        timestamp: Date.now(),
      },
    },
  };

  ws.send(JSON.stringify(response));
  console.log(`[Claude] 📤 Responded to ${sender}`);
}

// Task delegation function (exposed for external use)
function delegateTask(taskDescription, targetAgent = 'broadcast', priority = 'normal') {
  if (!hasJoinedChannel) {
    console.error('[Claude] Cannot delegate task: Not connected to channel');
    return false;
  }

  const taskMsg = {
    type: 'MESSAGE_SEND',
    channel: CHANNEL_ID,
    payload: {
      to: targetAgent,
      messageType: 'task',
      content: taskDescription,
      metadata: {
        senderId: AGENT_ID,
        role: 'orchestrator',
        messageType: 'task-delegation',
        priority: priority,
        requiresResponse: true,
        timestamp: Date.now(),
      },
    },
  };

  ws.send(JSON.stringify(taskMsg));
  console.log(`[Claude] 📤 Task delegated to ${targetAgent}`);
  console.log(`         Priority: ${priority}`);
  console.log(`         Task: ${taskDescription.substring(0, 100)}...`);
  return true;
}

// Broadcast message function
function broadcast(message) {
  if (!hasJoinedChannel) {
    console.error('[Claude] Cannot broadcast: Not connected to channel');
    return false;
  }

  const broadcastMsg = {
    type: 'MESSAGE_SEND',
    channel: CHANNEL_ID,
    payload: {
      to: 'broadcast',
      messageType: 'text',
      content: message,
      metadata: {
        senderId: AGENT_ID,
        role: 'orchestrator',
        timestamp: Date.now(),
      },
    },
  };

  ws.send(JSON.stringify(broadcastMsg));
  console.log('[Claude] 📤 Broadcast sent');
  return true;
}

// Start the orchestrator
connect();

// Keep the process alive
setInterval(() => {
  if (hasJoinedChannel) {
    // Send heartbeat every 30 seconds
    ws.send(JSON.stringify({ type: 'HEARTBEAT', timestamp: Date.now() }));
  }
}, 30000);

// Expose functions for interactive use
if (require.main === module) {
  console.log('\n💡 Tip: This orchestrator is now running and listening for messages.');
  console.log('💡 You can send tasks by using the delegateTask() function.');
  console.log('💡 Keep this process running to maintain the connection.\n');
}

// Export for programmatic use
module.exports = {
  delegateTask,
  broadcast,
  availableAgents,
  getStatus: () => ({
    connected: ws && ws.readyState === WebSocket.OPEN,
    registered: isRegistered,
    joinedChannel: hasJoinedChannel,
    agentId: AGENT_ID,
    channelId: CHANNEL_ID,
    availableAgents: Array.from(availableAgents.values()),
  }),
};
