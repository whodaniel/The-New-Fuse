import { AgentCoordinator } from '../services/agent/agent-coordinator';

// Simple mock FeatureTracker for testing
class MockFeatureTracker {
  track(feature: string, metadata?: any): void {
    // Mock implementation
  }
}

async function testCoordinator(): Promise<void> {
  const mockFeatureTracker = new MockFeatureTracker();
  const coordinator = new AgentCoordinator('CoordinatorAgent');

  try {
    await coordinator.start();

    // Test coordination by simulating messages
    setTimeout(async () => {
      // Simulate a message from Trae
      const message = {
        id: 'test-message-1',
        type: 'code_review',
        content: 'function example(): any { return true; }',
        sender: 'trae',
        timestamp: new Date(),
        metadata: {
          version: '1.0.0',
          priority: 'high' as const,
        },
      };

      await coordinator.handleMessage(message);

      // Simulate response from Roo Coder after 1 second
      setTimeout(async () => {
        const response = {
          id: 'test-message-2',
          type: 'code_review_response',
          content: 'Code looks good, but consider adding type annotations',
          sender: 'roo-coder',
          timestamp: new Date(),
          metadata: {
            version: '1.0.0',
            priority: 'high' as const,
          },
        };

        await coordinator.handleMessage(response);
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
