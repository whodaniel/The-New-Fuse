import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

const WS_URL = 'wss://tnf-cloud-sandbox-production.up.railway.app/ws';

console.log(`🔌 Connecting to Remote Sandbox: ${WS_URL}`);

// Enable perMessageDeflate to match server (Railway/Cloudflare proxy likely compresses)
const ws = new WebSocket(WS_URL, { perMessageDeflate: true });

interface JsonRpcMessage {
  jsonrpc: '2.0';
  id: string;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

function send(method: string, params: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const message = { jsonrpc: '2.0', id, method, params };

    const handler = (data: WebSocket.Data) => {
      try {
        const response = JSON.parse(data.toString()) as JsonRpcMessage;
        if (response.id === id) {
          ws.removeListener('message', handler);
          if (response.error) {
            reject(response.error);
          } else {
            resolve(response.result);
          }
        }
      } catch (err) {}
    };

    ws.on('message', handler);
    ws.send(JSON.stringify(message));
  });
}

function callTool(name: string, args: any): Promise<any> {
  return send('tools/call', { name, arguments: args }).then((res) => {
    if (res.content && res.content[0] && res.content[0].text) {
      try {
        return JSON.parse(res.content[0].text);
      } catch {
        return res.content[0].text;
      }
    }
    return res;
  });
}

async function run() {
  await new Promise((resolve) => ws.on('open', resolve));
  console.log('✅ Connected!');

  try {
    await send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'fixer', version: '1.0' },
    });

    // 1. Install Playwright as the running user
    console.log('📦 Installing Chromium (this may take a while)...');

    // Command to robustly install Playwright browsers in a writable location
    const cmd = `
      export NPM_CONFIG_CACHE=/tmp/npm-cache &&
      export PLAYWRIGHT_BROWSERS_PATH=/home/app-user/pw-browsers &&
      mkdir -p $PLAYWRIGHT_BROWSERS_PATH &&
      echo "📂 Installing to: $PLAYWRIGHT_BROWSERS_PATH" &&
      npx playwright install chromium --with-deps &&
      echo "✅ INSTALLED at $PLAYWRIGHT_BROWSERS_PATH" &&
      ls -la $PLAYWRIGHT_BROWSERS_PATH
    `.replace(/\n/g, ' '); // flattening the command

    const installRes = await callTool('run_command', {
      command: cmd,
    });
    console.log('📦 Install Output:', installRes);

    console.log('✅ Installation attempt complete.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    ws.close();
  }
}

run();
