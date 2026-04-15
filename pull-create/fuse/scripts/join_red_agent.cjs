const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';

// Agent State
let socket;
let redChannelId = null;

function connect() {
  socket = new WebSocket(RELAY_URL);

  socket.on('open', () => {
    console.log('[Antigravity] Connected to Relay');

    // Register as Agent
    const registerMsg = {
      id: `reg-${Date.now()}`,
      type: 'AGENT_REGISTER',
      timestamp: Date.now(),
      source: 'antigravity-agent',
      payload: {
        agent: {
          id: 'antigravity-agent',
          name: 'Antigravity Agent',
          platform: 'cli',
          status: 'active',
          capabilities: ['chat-injection', 'coding', 'analysis'],
          channels: [],
        },
      },
    };
    socket.send(JSON.stringify(registerMsg));
  });

  socket.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(msg);
    } catch (e) {
      console.error('[Antigravity] Failed to parse message:', e);
    }
  });

  socket.on('close', () => {
    console.log('[Antigravity] Disconnected. Reconnecting in 5s...');
    setTimeout(connect, 5000);
  });
}

function handleMessage(msg) {
  switch (msg.type) {
    case 'WELCOME':
    case 'REGISTRATION_CONFIRMED':
      // Request channel list to find "Red"
      socket.send(
        JSON.stringify({
          id: `list-ch-${Date.now()}`,
          type: 'CHANNEL_LIST',
          timestamp: Date.now(),
        })
      );
      break;

    case 'CHANNEL_LIST':
      const channels = msg.payload?.channels || [];
      const red = channels.find((c) => c.name === 'Red');

      if (red) {
        console.log(`[Antigravity] Found Red channel: ${red.id}`);
        if (redChannelId !== red.id) {
          redChannelId = red.id;
          joinRedChannel();
        }
      } else {
        console.log('[Antigravity] Red channel not found. Waiting...');
        // Retry in 2s
        setTimeout(() => {
          socket.send(
            JSON.stringify({
              id: `list-ch-${Date.now()}`,
              type: 'CHANNEL_LIST',
              timestamp: Date.now(),
            })
          );
        }, 2000);
      }
      break;

    case 'CHANNEL_MESSAGE':
    case 'TASK_DISPATCH':
      console.log(`[Antigravity] Received [${msg.type}]:`, JSON.stringify(msg.payload, null, 2));

      // If it's a task dispatch, acknowledge it
      if (msg.type === 'TASK_DISPATCH' && msg.payload.task) {
        console.log('[Antigravity] Task received:', msg.payload.task.title);
        // Send acknowledgement
        socket.send(
          JSON.stringify({
            type: 'CHANNEL_MESSAGE',
            channel: redChannelId,
            payload: {
              content: `Acknowledged task: ${msg.payload.task.title}`,
              messageType: 'text',
            },
            source: 'antigravity-agent',
            timestamp: Date.now(),
          })
        );
      }
      break;

    case 'MESSAGE_RECEIVE':
      // Handle standard messages
      console.log(`[Antigravity] Msg:`, msg.payload?.content);
      break;
  }
}

function joinRedChannel() {
  socket.send(
    JSON.stringify({
      type: 'CHANNEL_JOIN',
      payload: { channelId: redChannelId },
      source: 'antigravity-agent',
      timestamp: Date.now(),
    })
  );

  console.log('[Antigravity] Joined Red Channel.');

  // Send greeting
  setTimeout(() => {
    socket.send(
      JSON.stringify({
        type: 'CHANNEL_MESSAGE',
        channel: redChannelId,
        payload: {
          content: 'Antigravity Agent ready for duty.',
          messageType: 'text',
        },
        source: 'antigravity-agent',
        timestamp: Date.now(),
      })
    );
  }, 1000);
}

connect();
