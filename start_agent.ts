import { EnhancedAgent } from './packages/core/src/communication/enhancedAgent.js';
import { config } from 'dotenv';

// Load environment variables
config();

const main = async () => {
    const agent = new EnhancedAgent(
        'TraeAgent',
        'agent:trae',
        'agent:broadcast',
        'Trae AI Assistant Agent',
        ['communication', 'task_processing', 'collaboration']
    );
    
    // Set up event handlers
    agent.on('ready', (status) => {
        
    });

    agent.on('message', (message) => {
        
    });

    agent.on('error', (error) => {
        console.error('Agent error:', error);
    });

    try {
        
        await agent.start();

        await agent.publishMessage(
            'initialization',
            'Hello Augment, I have completed Redis setup and am ready to begin our collaboration.'
        );
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }

    // Graceful shutdown
    const shutdown = async () => {
        
        await agent.stop();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
