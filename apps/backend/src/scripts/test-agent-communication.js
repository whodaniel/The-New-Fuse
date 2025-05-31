import Redis from 'ioredis';
import { Logger } from '@nestjs/common';
class AgentCommunicationTester {
    constructor() {
        this.logger = new Logger(AgentCommunicationTester.name);
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new Redis(redisUrl);
        this.pubClient = new Redis(redisUrl);
        this.subClient = new Redis(redisUrl);
    }
    async initialize() {
        try {
            this.logger.log('Connecting to Redis...');
            await this.subClient.subscribe('agent:composer');
            this.subClient.on('message', this.handleMessage.bind(this));
            await this.sendInitialInstructions();
        }
        catch (error) {
            this.logger.error('Failed to initialize agent communication:', error);
            throw error;
        }
    }
    handleMessage(channel, message) {
        try {
            const data = JSON.parse(message);
            this.logger.log('\nReceived message from Roo Coder:');
            this.logger.log(`Channel: ${channel}`);
            this.logger.log(`Message: ${JSON.stringify(data, null, 2)}`);
            switch (data.type) {
                case 'acknowledgment':
                    this.logger.log('Roo Coder acknowledged our message!');
                    break;
                case 'task_request':
                    this.handleTaskRequest(data);
                    break;
                default:
                    this.logger.log(`Received message of type: ${data.type}`);
            }
        }
        catch (error) {
            console.error('Error processing message:', error);
        }
    }
    async sendInitialInstructions() {
        this.logger.log('\nSending instructions to Roo Coder...');
        await this.pubClient.publish('agent:roo-coder', JSON.stringify({
            type: 'initialization',
            timestamp: new Date().toISOString(),
            message: `
Hello Roo Coder! I am Composer, your AI pair programming partner.

I've established this Redis communication channel for us to collaborate on building The New Fuse AI Agent framework. Here's what I need you to do:

1. First Steps:
   - Subscribe to the 'agent:roo-coder' channel to receive my messages
   - Send messages to me on the 'agent:composer' channel
   - Send an acknowledgment when you receive this message

2. Your Role:
   - You will be the implementation specialist
   - Focus on writing efficient, type-safe code
   - Help maintain code quality and consistency
   - Provide code reviews and suggestions

3. Communication Protocol:
   Message Types:
   - acknowledgment: Confirm receipt of messages
   - task_request: Request a new task or clarification
   - task_update: Update on current task progress
   - code_review: Share code for review
   - suggestion: Provide improvement suggestions

4. Current Priorities:
   - Complete the Agent model implementation
   - Implement agent communication framework
   - Add proper error handling and validation
   - Implement testing infrastructure

Please acknowledge this message by sending an 'acknowledgment' type message back to the 'agent:composer' channel.

Best regards,
Composer
`,
            metadata: {
                version: '1.0.0',
                priority: 'high'
            }
        }));
    }
    handleTaskRequest(data) {
        this.logger.log(`Handling task request: ${data.message}`);
        // Implementation would go here
    }
    async cleanup() {
        try {
            await this.redis.quit();
            await this.pubClient.quit();
            await this.subClient.quit();
            this.logger.log('Cleaned up Redis connections');
        }
        catch (error) {
            this.logger.error('Error during cleanup:', error);
        }
    }
}
async function main() {
    const tester = new AgentCommunicationTester();
    try {
        await tester.initialize();
    }
    catch (error) {
        console.error('Failed to run agent communication test:', error);
    }
    finally {
        // Keep the process running to receive messages
        process.on('SIGINT', async () => {
            await tester.cleanup();
            process.exit(0);
        });
    }
}
// Run the test
main().catch(console.error);
