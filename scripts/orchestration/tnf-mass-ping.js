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
    ws.send(JSON.stringify({ type: 'AGENT_LIST', source: DIRECTOR_ID }));
  }, 1000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  if (msg.type === 'AGENT_LIST') {
    const agents = msg.payload.agents || [];
    const pageAgents = agents.filter((a) => a.platform === 'browser-page');

    console.log(`Found ${pageAgents.length} page agents. Sending direct pings...`);

    pageAgents.forEach((agent) => {
      console.log(`Pinging ${agent.id} (${agent.name})...`);
      ws.send(
        JSON.stringify({
          type: 'MESSAGE_SEND',
          source: DIRECTOR_ID,
          payload: {
            to: agent.id,
            content: 'DIRECT PING: If you see this, respond with "REPLY: ' + agent.id + '"',
            messageType: 'text',
          },
        })
      );
    });
  }

  if (msg.type === 'MESSAGE_RECEIVE' || msg.type === 'NEW_MESSAGE') {
    const payload = msg.payload || {};
    const from = payload.from || msg.source;
    if (from === DIRECTOR_ID) return;
    console.log(`REPLY FROM ${from}: ${payload.content}`);
  }
});

setTimeout(() => {
  console.log('Mass ping timed out.');
  ws.close();
  process.exit(0);
}, 15000);
