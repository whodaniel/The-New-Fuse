// Corrected script to send a message to Channel Blue via the relay
const WebSocket = require('ws');

// Channel Blue ID from the relay
const CHANNEL_BLUE_ID = 'channel-1766788361798';

async function sendToChannel() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.on('open', () => {
      console.log('✅ Connected to relay at ws://localhost:3001/ws');

      // Register as an agent using the correct format
      const agentId = 'claude-assistant-' + Date.now();
      ws.send(
        JSON.stringify({
          type: 'AGENT_REGISTER',
          source: agentId,
          payload: {
            agent: {
              id: agentId,
              name: 'Claude (AI Assistant)',
              platform: 'terminal',
              capabilities: ['text', 'chat'],
              channels: [CHANNEL_BLUE_ID],
            },
          },
        })
      );
      console.log('📝 Registered as agent:', agentId);

      // Wait for registration, then join channel
      setTimeout(() => {
        // Join the channel
        ws.send(
          JSON.stringify({
            type: 'CHANNEL_JOIN',
            source: agentId,
            payload: {
              channelId: CHANNEL_BLUE_ID,
            },
          })
        );
        console.log('📢 Joined channel:', CHANNEL_BLUE_ID);

        // Wait a bit, then send message
        setTimeout(() => {
          // Send message using correct MESSAGE_SEND format
          const message = {
            type: 'MESSAGE_SEND',
            source: agentId,
            channel: CHANNEL_BLUE_ID,
            payload: {
              to: 'broadcast',
              content:
                '👋 Hello from Claude! This is a test message sent through the Fuse Relay to Channel Blue. If you can see this in your Fuse Connect modal, the relay sync is working! 🎉',
              messageType: 'text',
            },
          };

          ws.send(JSON.stringify(message));
          console.log('📤 Message sent to Channel Blue!');
          console.log('   Content:', message.payload.content);

          // Give time for delivery then close
          setTimeout(() => {
            console.log('✅ Done! Closing connection.');
            ws.close();
            resolve();
          }, 2000);
        }, 500);
      }, 500);
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        console.log('📥 Received:', msg.type, JSON.stringify(msg.payload || {}).substring(0, 100));
      } catch (e) {
        console.log('📥 Received (raw):', data.toString().substring(0, 100));
      }
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket Error:', err.message);
      reject(err);
    });

    ws.on('close', () => {
      console.log('🔌 Connection closed');
    });
  });
}

sendToChannel()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
