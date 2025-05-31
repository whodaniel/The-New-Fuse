import { TraeAgent } from '../services/agent/trae-agent.js';
async function main() {
    const agent = new TraeAgent();
    process.on('SIGINT', async () => {
        await agent.cleanup();
        process.exit(0);
    });
}
main().catch(console.error);
