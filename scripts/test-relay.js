const WebSocket = require('ws');

const urls = [
  'ws://127.0.0.1:3000/ws',
  'ws://localhost:3001/ws',
  'ws://localhost:3005/ws',
  'ws://127.0.0.1:3000/ws',
];

async function test(url) {
  return new Promise((resolve) => {
    console.log(`Testing ${url}...`);
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      console.log(`  Timeout for ${url}`);
      ws.terminate();
      resolve(false);
    }, 2000);

    ws.on('open', () => {
      console.log(`  SUCCESS: Connected to ${url}`);
      clearTimeout(timeout);
      ws.close();
      resolve(true);
    });

    ws.on('error', (err) => {
      console.log(`  FAILED: ${url} - ${err.message}`);
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function run() {
  for (const url of urls) {
    await test(url);
  }
}

run();
