import { TraeAgent } from '../services/agent/trae-agent';

async function main(): Promise<void> {
  const agent = new TraeAgent();

  process.on('SIGINT', async () => {
    
    await agent.cleanup();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});