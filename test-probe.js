const { FederationRelayClient } = require('./scripts/lib/federation-relay-client.cjs');
const client = new FederationRelayClient({ relayUrl: 'ws://127.0.0.1:3000/ws', agentId: 'test' });
client.on('error', e => console.error('ERR:', e.message));
client.on('connected', () => console.log('connected!'));
client.on('registered', () => console.log('registered!'));
client.connect('ws://127.0.0.1:3000/ws').then(() => console.log('connect resolved')).catch(e => console.error('catch:', e));
setTimeout(() => process.exit(0), 1000);
