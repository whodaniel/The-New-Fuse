
import { config } from '../config/ConfigService.js';
import { RooCodeCommunication } from '../services/RooCodeCommunication.js';

async function main() {
  // Initialize Redis client
  const redisUrl = config.get<string>('communication.redis.url');
  const redisClient = new Redis(redisUrl);

  // Create two agents: A -> B
  const agentA = new RooCodeCommunication({ agentId: 'agentA', targetAgentId: 'agentB', redisClient });
  const agentB = new RooCodeCommunication({ agentId: 'agentB', targetAgentId: 'agentA', redisClient });

  // Agent B listens for heartbeat events
  agentB.on('heartbeat', ({ from, timestamp }) => {
    console.log(`[AgentB] Received heartbeat from ${from} at ${timestamp}`);
  });

  // Agent A listens for pong events
  agentA.on('heartbeat', ({ from, timestamp }) => {
    console.log(`[AgentA] Received pong from ${from} at ${timestamp}`);
    // Once received, disconnect
    agentA.disconnect();
    agentB.disconnect();
    process.exit(0);
  });

  // Initialize both agents
  await Promise.all([agentA.initialize(), agentB.initialize()]);

  // Agent A sends heartbeat ping
  console.log('[AgentA] Sending heartbeat ping to AgentB');
  await agentA.sendHeartbeat();
}

main().catch(err => {
  console.error('Redis demo error:', err);
  process.exit(1);
});