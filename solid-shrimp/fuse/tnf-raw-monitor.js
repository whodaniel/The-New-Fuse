const WebSocket = require('ws');
const RELAY_URL = 'ws://localhost:3000/ws';
const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('Connected to relay for RAW MONITORING');
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: 'monitor',
      payload: { agent: { id: 'monitor', name: 'RAW MONITOR' } },
    })
  );
});

ws.on('message', (data) => {
  console.log('RAW:', data.toString());
});

ws.on('close', () => console.log('Disconnected'));
ws.on('error', (err) => console.log('ERR:', err.message));
