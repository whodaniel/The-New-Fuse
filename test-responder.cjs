const { FederationRelayClient } = require('./scripts/lib/federation-relay-client.cjs');

const client = new FederationRelayClient({
  relayUrl: 'ws://127.0.0.1:3000/ws',
  agentName: 'Test-Responder',
  platform: 'test',
});

client.on('registered', () => {
  console.log('Responder registered, joining fuse-activity-log...');
  client.joinChannel('fuse-activity-log');
});

client.on('channel_message', (msg) => {
  console.log('Responder received message:', msg);
});

client.connect();
console.log('Responder started...');
