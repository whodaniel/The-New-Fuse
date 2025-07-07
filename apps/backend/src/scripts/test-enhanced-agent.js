"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enhanced_agent_1 = require("../services/agent/enhanced-agent");
async function testAgent() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const agent = new enhanced_agent_1.EnhancedAgent('TestAgent', redisUrl);
    agent.on('message', ({ channel, message }) => {
    });
    agent.on('error', (error) => {
        console.error('Agent error:', error);
    });
    try {
        await agent.initialize();
        // Keep the process running
        process.on('SIGINT', async () => {
            await agent.cleanup();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Failed to initialize agent:', error);
        process.exit(1);
    }
}
testAgent().catch(console.error);
