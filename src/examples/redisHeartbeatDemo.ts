import { ProtocolFactory, ProtocolType } from '../protocols/ProtocolFactory.js';
import { RooCodeCommunication } from '../services/RooCodeCommunication.js';

async function main() {
  const protocolFactory = new ProtocolFactory();
  const protocolA = protocolFactory.createProtocol({
    type: ProtocolType.REDIS,
    agentId: 'agentA',
    redisUrl: 'redis://localhost:6379',
  });
  const protocolB = protocolFactory.createProtocol({
    type: ProtocolType.REDIS,
    agentId: 'agentB',
    redisUrl: 'redis://localhost:6379',
  });

  const agentA = new RooCodeCommunication({
    agentId: 'agentA',
    targetAgentId: 'agentB',
    protocol: protocolA
  });
  const agentB = new RooCodeCommunication({
    agentId: 'agentB',
    targetAgentId: 'agentA',
    protocol: protocolB
  });

  agentB.on('heartbeat', ({ from, timestamp }) =>
    console.log(`[AgentB] heartbeat from ${from} at ${timestamp}`)
  );
  agentA.on('heartbeat', ({ from, timestamp }) => {
    console.log(`[AgentA] pong from ${from} at ${timestamp}`);
    agentA.disconnect();
    agentB.disconnect();
    process.exit(0);
  });

  await Promise.all([agentA.initialize(), agentB.initialize()]);

  console.log('[AgentA] sending heartbeat ping to AgentB');
  await agentA.sendHeartbeat();
}

main().catch(err => {
  console.error('Demo error:', err);
  process.exit(1);
});