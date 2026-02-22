#!/usr/bin/env node
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    if (request.method === 'initialize') {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'minimal-test', version: '1.0.0' }
        }
      }));
    } else if (request.method === 'tools/list') {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: { tools: [] }
      }));
    }
  } catch (e) {}
});
