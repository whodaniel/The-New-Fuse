import WebSocket from 'ws';

const RELAY_URL = 'ws://localhost:3001/ws';
const BLUE_CHANNEL_ID = 'channel-1768256017068';

const ws = new WebSocket(RELAY_URL);

console.log('Starting structured response listener...');

ws.on('open', () => {
  console.log(`[Listener] Connected. Joining Blue Channel...`);

  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      payload: { agentId: 'json-validator', name: 'JSONValidator', capabilities: ['testing'] },
    })
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        payload: { channelId: BLUE_CHANNEL_ID },
      })
    );
  }, 500);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());

    // Listener Update: Relay sends downstream messages as CHANNEL_MESSAGE or MESSAGE_RECEIVE
    if (
      msg.type === 'MESSAGE_SEND' ||
      msg.type === 'CHANNEL_MESSAGE' ||
      msg.type === 'MESSAGE_RECEIVE'
    ) {
      const payload = msg.payload || {};
      const content = payload.content;
      const from = payload.from;

      console.log(`\n[MSG from ${from} (${msg.type})]:`);
      console.log(content);

      // Attempt to parse validation
      if (from !== 'browser-1768255383942-40pf5zso0') {
        if (content && content.trim().startsWith('{')) {
          try {
            const json = JSON.parse(content);
            console.log('\n✅ VALID JSON DETECTED!');
            console.log('Fields found:', Object.keys(json));
          } catch (e) {
            // console.log("\n⚠️ Response received but NOT valid JSON.");
          }
        }
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
});
