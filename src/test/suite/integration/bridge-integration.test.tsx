import * as assert from 'assert';
import { AugmentBridge } from '../../../../apps/backend/src/scripts/augment-bridge.js';
import { AG2Bridge } from '../../../../packages/integrations/ag2/ag2-integration/src/ag2-bridge.js';
import { ErrorRecovery } from '../../../../apps/backend/src/core/error-recovery.js';
import { CoreSystem } from '../../../../apps/backend/src/core/system.js';

suite('Bridge Integration Tests', () => {
    let augmentBridge: AugmentBridge;
    let ag2Bridge: AG2Bridge;

    setup(async () => {
        augmentBridge = new AugmentBridge(new ErrorRecovery(), new CoreSystem());
        ag2Bridge = new AG2Bridge({
            pythonServiceUrl: 'http://localhost:5000',
            timeout: 5000,
            retryAttempts: 3
        });
    });

    test('AugmentBridge Initialization and Communication', async () => {
        // Initialize AugmentBridge
        await augmentBridge.initialize();
        
        // Test subscription
        await augmentBridge.subscribe(['agent:trae', 'agent:broadcast']);
        
        // Test message handling
        const messagePromise = new Promise((resolve) => {
            augmentBridge.onMessage('collaboration_response', async (response) => {
                resolve(response);
            });
        });

        // Send test message
        await augmentBridge.pubClient.publish('agent:trae', JSON.stringify({
            type: 'collaboration_response',
            source: 'trae',
            details: { status: 'accepted' }
        }));

        const response = await messagePromise;
        assert.ok(response, 'Message handling failed');
    });

    test('AG2Bridge Features and Tools', async () => {
        // Test health check
        const isHealthy = await ag2Bridge.isHealthy();
        assert.strictEqual(isHealthy, true, 'AG2Bridge health check failed');

        // Test features
        const features = await ag2Bridge.getFeatures();
        assert.ok(features.length > 0, 'No features returned');

        // Test tool registration
        const testTool = {
            id: 'test-tool',
            name: 'Test Tool',
            description: 'Test tool for integration',
            execute: async (args: Record<string, unknown>) => ({ result: 'success' })
        };

        await ag2Bridge.registerTool(testTool);
        
        // Verify tool registration
        const tools = await ag2Bridge.getTools();
        assert.ok(tools.some(tool => tool.id === 'test-tool'), 'Tool registration failed');
    });

    test('Bridge Cross-Communication', async () => {
        // Initialize both bridges
        await augmentBridge.initialize();
        const isHealthy = await ag2Bridge.isHealthy();
        assert.ok(isHealthy, 'AG2Bridge not healthy');

        // Set up message handling for cross-bridge communication
        const messagePromise = new Promise((resolve) => {
            augmentBridge.onMessage('ag2_response', async (response) => {
                resolve(response);
            });
        });

        // Send message through AG2Bridge and relay to AugmentBridge
        const ag2Message = {
            type: 'test_message',
            content: 'Integration test',
            timestamp: Date.now()
        };

        const ag2Response = await ag2Bridge.sendMessage(ag2Message);
        
        // Relay AG2 response to AugmentBridge
        await augmentBridge.pubClient.publish('agent:broadcast', JSON.stringify({
            type: 'ag2_response',
            source: 'ag2',
            details: ag2Response
        }));

        const response = await messagePromise;
        assert.ok(response, 'Cross-bridge communication failed');
    });

    test('Error Recovery and Retry Mechanism', async () => {
        // Test AG2Bridge retry mechanism
        const originalExecuteTool = ag2Bridge.executeTool;
        let attempts = 0;

        // Mock executeTool to fail twice then succeed
        ag2Bridge.executeTool = async (toolId: string, args: Record<string, unknown>) => {
            attempts++;
            if (attempts < 3) {
                throw new Error('Simulated failure');
            }
            return { success: true };
        };

        try {
            const result = await ag2Bridge.executeTool('test-tool', {});
            assert.ok(result.success, 'Tool execution failed');
            assert.strictEqual(attempts, 3, 'Retry mechanism failed');
        } finally {
            ag2Bridge.executeTool = originalExecuteTool;
        }

        // Test AugmentBridge error recovery
        const errorRecoveryPromise = new Promise((resolve) => {
            augmentBridge.onMessage('error_recovery', async (response) => {
                resolve(response);
            });
        });

        // Simulate error and recovery
        await augmentBridge.pubClient.publish('agent:broadcast', JSON.stringify({
            type: 'error_recovery',
            source: 'system',
            details: { error: 'test_error', recovery: true }
        }));

        const recoveryResponse = await errorRecoveryPromise;
        assert.ok(recoveryResponse, 'Error recovery failed');
    });

    teardown(async () => {
        // Cleanup
        await augmentBridge.pubClient.quit();
        // Add any necessary AG2Bridge cleanup
    });
});