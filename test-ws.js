const WebSocket = require('ws');
const ws = new WebSocket('ws://127.0.0.1:3000/ws');
ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'A2A_BRIDGE_PING', payload: { }}));
});
ws.on('message', (m) => console.log(String(m)));
setTimeout(() => process.exit(0), 1000);
