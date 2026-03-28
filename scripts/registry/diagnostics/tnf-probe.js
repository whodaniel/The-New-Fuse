const WebSocket = require('ws');
const RELAY_URL = 'ws://localhost:3000/ws';
const DIRECTOR_ID = 'director-prime';
const TARGET = 'page-agent-478166581-nx9zd';

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
    console.log(`Sending DIRECT command to ${TARGET}...`);
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: DIRECTOR_ID,
        payload: {
          to: TARGET,
          content:
            'DIRECT COMMAND: State your current URL and Page Title. Respond with exactly "ACK: [Title]"',
          messageType: 'text',
        },
      })
    );
  }, 1000);

  setTimeout(() => {
    console.log('Sending GLOBAL broadcast...');
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: DIRECTOR_ID,
        payload: {
          to: 'broadcast',
          content: '[DIRECTOR] GLOBAL ROLL CALL. All agents respond.',
          messageType: 'text',
        },
      })
    );
  }, 3000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'MESSAGE_RECEIVE' || msg.type === 'NEW_MESSAGE') {
    const payload = msg.payload || {};
    const from = payload.from || msg.source;
    if (from === DIRECTOR_ID) return;
    console.log(`REPLY FROM ${from}: ${payload.content}`);
  }
});

setTimeout(() => {
  console.log('Test timed out.');
  ws.close();
  process.exit(0);
}, 20000);
