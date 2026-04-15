#!/usr/bin/env node
/**
 * Task Delegation Script - Send tasks to Blue Channel
 * Usage: node orchestrate-send-task.js "Your task description here"
 */

const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'channel-1768542811434'; // Blue Channel (BLUE)
const AGENT_ID = 'claude-task-sender-' + Date.now();

// Get task from command line args
const taskDescription = process.argv.slice(2).join(' ');

if (!taskDescription) {
  console.error('❌ Error: No task description provided');
  console.log('\nUsage: node orchestrate-send-task.js "Your task description here"');
  console.log('\nExamples:');
  console.log(
    '  node orchestrate-send-task.js "Analyze the performance bottlenecks in the relay server"'
  );
  console.log(
    '  node orchestrate-send-task.js "Generate unit tests for the stall detector module"'
  );
  process.exit(1);
}

const ws = new WebSocket(RELAY_URL);
let taskSent = false;

ws.on('open', () => {
  console.log('🔗 Connected to relay server');

  // Register
  const registerMsg = {
    type: 'AGENT_REGISTER',
    agent: {
      id: AGENT_ID,
      name: 'Claude Task Sender',
      platform: 'CLI',
      capabilities: ['task-delegation'],
      channels: [],
    },
  };
  ws.send(JSON.stringify(registerMsg));
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data);

    if (msg.type === 'REGISTRATION_CONFIRMED') {
      console.log('✅ Registered successfully');

      // Join channel
      const joinMsg = {
        type: 'CHANNEL_JOIN',
        payload: { channelId: CHANNEL_ID },
      };
      ws.send(JSON.stringify(joinMsg));

      // Send task after short delay
      setTimeout(() => {
        sendTask();
      }, 1500);
    } else if (msg.type === 'CHANNEL_MESSAGE') {
      const sender = msg.payload.from;
      const content = msg.payload.content;
      console.log(`\n📨 Response from ${sender}:`);
      console.log('─'.repeat(60));
      console.log(content);
      console.log('─'.repeat(60));
    } else if (msg.type === 'MESSAGE_RECEIVE') {
      const sender = msg.payload.from;
      const content = msg.payload.content;
      console.log(`\n📬 Direct message from ${sender}:`);
      console.log('─'.repeat(60));
      console.log(content);
      console.log('─'.repeat(60));
    }
  } catch (e) {
    console.error('Error parsing message:', e);
  }
});

ws.on('error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n🔌 Connection closed');
  if (taskSent) {
    console.log('✅ Task delegation complete');
    process.exit(0);
  }
});

function sendTask() {
  console.log('\n🎯 Delegating task to Blue Channel...');
  console.log('─'.repeat(60));
  console.log(`Task: ${taskDescription}`);
  console.log('─'.repeat(60));

  const taskMsg = {
    type: 'MESSAGE_SEND',
    channel: CHANNEL_ID,
    payload: {
      to: 'broadcast',
      messageType: 'task',
      content: `🎯 **Task Assignment from Claude Orchestrator**

${taskDescription}

**Instructions:**
- Please acknowledge receipt of this task
- Share your approach or any clarifying questions
- Provide updates as you make progress
- Report your results when complete

This task is being delegated to leverage your specialized capabilities. Thank you for your collaboration!`,
      metadata: {
        senderId: AGENT_ID,
        role: 'orchestrator',
        messageType: 'task-delegation',
        priority: 'normal',
        requiresResponse: true,
        taskDescription: taskDescription,
        timestamp: Date.now(),
      },
    },
  };

  ws.send(JSON.stringify(taskMsg));
  taskSent = true;
  console.log('✅ Task sent successfully');
  console.log('\n⏳ Listening for responses (press Ctrl+C to exit)...\n');
}

// Keep alive for responses
const keepAlive = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'HEARTBEAT', timestamp: Date.now() }));
  }
}, 30000);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down task sender...');
  clearInterval(keepAlive);
  if (ws) {
    ws.close();
  }
  process.exit(0);
});
