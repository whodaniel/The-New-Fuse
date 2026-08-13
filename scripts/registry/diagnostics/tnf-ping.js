const WebSocket = require('ws');
const RELAY_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const DIRECTOR_ID = 'director-prime';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: DIRECTOR_ID,
      payload: { agent: { id: DIRECTOR_ID, name: 'Director' } },
    })
  );

  setTimeout(() => {
    console.log('Sending broadcast...');
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: DIRECTOR_ID,
        payload: {
          to: 'broadcast',
          content: 'PING TEST ' + Date.now(),
          messageType: 'text',
        },
      })
    );
  }, 1000);

  setTimeout(() => ws.close(), 2000);
});
