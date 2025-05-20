import { AgentCoordinator } from '../services/agent/agent-coordinator.js';

async function testCoordinator(): any {
    const coordinator = new AgentCoordinator('CoordinatorAgent');
    
    try {
        await coordinator.start();

        // Test coordination by simulating messages
        setTimeout(async () => {
            
            // Simulate a message from Trae
            const message = {
                type: 'code_review',
                timestamp: new Date().toISOString(),
                metadata: {
                    version: '1.0.0',
                    priority: 'high',
                    source: 'trae'
                },
                details: {
                    code: 'function example(): any { return true; }',
                    context: 'Testing coordinator functionality'
                }
            };
            
            await coordinator['agent'].publish('agent:trae', message);

            // Simulate response from Roo Coder after 1 second
            setTimeout(async () => {
                
                const response = {
                    type: 'code_review_response',
                    timestamp: new Date().toISOString(),
                    metadata: {
                        version: '1.0.0',
                        priority: 'high',
                        source: 'roo-coder'
                    },
                    details: {
                        feedback: 'Code looks good, but consider adding type annotations',
                        suggestions: ['Add return type annotation', 'Add function documentation'],
                        approved: true
                    }
                };
                
                await coordinator['agent'].publish('agent:roo-coder', response);
            }, 1000);
        }, 2000);
        
        // Keep the process running
        process.on('SIGINT', async () => {
            
            await coordinator.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Failed to start coordinator:', error);
        process.exit(1);
    }
}

testCoordinator().catch(console.error);
