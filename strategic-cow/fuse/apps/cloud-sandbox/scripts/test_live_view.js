import { WebSocket } from 'ws';

// Connection details
const SANDBOX_URL = 'wss://tnf-cloud-sandbox-v2-production.up.railway.app/ws';

console.log(`🔌 Connecting to Sandbox MCP at ${SANDBOX_URL}...`);
const ws = new WebSocket(SANDBOX_URL, {
  perMessageDeflate: false,
});

ws.on('open', () => {
  console.log('✅ Connected to Sandbox MCP');

  // 1. Navigate to a visual page
  console.log('⏳ Waiting 15s for viewer to be ready...');
  setTimeout(() => {
    sendToolCall('browser_navigate', { url: 'https://example.com' });
  }, 15000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('📩 Received:', JSON.stringify(msg, null, 2).substring(0, 200) + '...');

  if (msg.result) {
    // If navigation succeeded, take a screenshot explicitly (just in case)
    // although browser_navigate is wrapped with 'withBroadcast'
    if (msg.id === '1') {
      console.log('✅ Navigation complete, sending click...');
      // 2. Click something or just wait
      setTimeout(() => {
        sendToolCall('browser_screenshot', { path: '/tmp/test.png' }, '2');
      }, 2000);
    } else if (msg.id === '2') {
      console.log('✅ Screenshot complete. Test finished.');
      ws.close();
      process.exit(0);
    }
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err);
  process.exit(1);
});

function sendToolCall(name, args, id = '1') {
  console.log(`🛠️ Calling tool: ${name}`);
  const request = {
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: {
      name,
      arguments: args,
    },
  };
  ws.send(JSON.stringify(request));
}
