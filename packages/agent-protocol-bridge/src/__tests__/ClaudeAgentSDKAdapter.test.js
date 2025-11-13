"use strict";
/**
 * Tests for Claude Agent SDK Adapter
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ClaudeAgentSDKAdapter_1 = require("../adapters/ClaudeAgentSDKAdapter");
describe('ClaudeAgentSDKAdapter', () => {
    let adapter;
    const mockConfig = {
        agentId: 'test-agent',
        agentName: 'Test Agent',
        model: 'claude-sonnet-4',
        apiKey: 'test-key',
        enableStreaming: false
    };
    beforeEach(() => {
        adapter = new ClaudeAgentSDKAdapter_1.ClaudeAgentSDKAdapter(mockConfig);
    });
    afterEach(async () => {
        await adapter.dispose();
    });
    describe('Initialization', () => {
        it('should initialize with provided configuration', () => {
            expect(adapter).toBeDefined();
            const status = adapter.getStatus();
            expect(status.agentId).toBe('test-agent');
            expect(status.agentName).toBe('Test Agent');
            expect(status.model).toBe('claude-sonnet-4');
        });
        it('should use default values for optional config', () => {
            const minimalAdapter = new ClaudeAgentSDKAdapter_1.ClaudeAgentSDKAdapter({
                agentId: 'minimal',
                agentName: 'Minimal Agent'
            });
            const status = minimalAdapter.getStatus();
            expect(status.model).toBe('claude-sonnet-4'); // default
            expect(status.streamingEnabled).toBe(false); // default
            expect(status.protocolMode).toBe('hybrid'); // default
            minimalAdapter.dispose();
        });
    });
    describe('Tool Registration', () => {
        it('should register custom tools', () => {
            const toolFn = jest.fn().mockResolvedValue({ result: 'success' });
            adapter.registerTool('test_tool', toolFn, 'A test tool');
            const status = adapter.getStatus();
            expect(status.toolsRegistered).toBe(1);
        });
        it('should track multiple tools', () => {
            adapter.registerTool('tool1', async () => ({}));
            adapter.registerTool('tool2', async () => ({}));
            adapter.registerTool('tool3', async () => ({}));
            const status = adapter.getStatus();
            expect(status.toolsRegistered).toBe(3);
        });
    });
    describe('A2A Message Conversion', () => {
        it('should convert execution result to A2A message', () => {
            const result = {
                success: true,
                response: 'Test response',
                usage: {
                    inputTokens: 10,
                    outputTokens: 20,
                    totalTokens: 30
                }
            };
            const a2aMessage = adapter.toA2AMessage(result);
            expect(a2aMessage.type).toBe('TASK_RESPONSE');
            expect(a2aMessage.senderId).toBe('test-agent');
            expect(a2aMessage.payload.response).toBe('Test response');
            expect(a2aMessage.payload.usage).toEqual(result.usage);
        });
        it('should convert A2A message to prompt string', () => {
            const a2aMessage = {
                id: 'msg-1',
                type: 'TASK_REQUEST',
                senderId: 'other-agent',
                recipientId: 'test-agent',
                priority: 'MEDIUM',
                payload: 'Execute this task',
                timestamp: new Date(),
                correlationId: undefined,
                replyTo: undefined
            };
            const prompt = adapter.fromA2AMessage(a2aMessage);
            expect(prompt).toBe('Execute this task');
        });
        it('should handle object payload in A2A message', () => {
            const a2aMessage = {
                id: 'msg-2',
                type: 'TASK_REQUEST',
                senderId: 'other-agent',
                recipientId: 'test-agent',
                priority: 'HIGH',
                payload: {
                    prompt: 'Custom prompt',
                    context: { userId: '123',
                        timestamp: new Date(),
                        correlationId: undefined,
                        replyTo: undefined
                    },
                    const: prompt = adapter.fromA2AMessage(a2aMessage),
                    expect(prompt) { }, : .toBe('Custom prompt')
                }
            };
        });
    });
    describe('Status and Metrics', () => {
        it('should return current adapter status', () => {
            const status = adapter.getStatus();
            expect(status).toMatchObject({
                agentId: 'test-agent',
                agentName: 'Test Agent',
                model: 'claude-sonnet-4',
                toolsRegistered: 0,
                mcpEnabled: false,
                a2aEnabled: true,
                streamingEnabled: false,
                protocolMode: 'hybrid'
            });
        });
        it('should reflect MCP enabled when client provided', () => {
            const mcpAdapter = new ClaudeAgentSDKAdapter_1.ClaudeAgentSDKAdapter({
                ...mockConfig,
                mcpClient: {} // Mock MCP client
            });
            const status = mcpAdapter.getStatus();
            expect(status.mcpEnabled).toBe(true);
            mcpAdapter.dispose();
        });
    });
    describe('Resource Cleanup', () => {
        it('should dispose resources', async () => {
            adapter.registerTool('tool1', async () => ({}));
            adapter.registerTool('tool2', async () => ({}));
            expect(adapter.getStatus().toolsRegistered).toBe(2);
            await adapter.dispose();
            // After disposal, tools should be cleared
            expect(adapter.getStatus().toolsRegistered).toBe(0);
        });
        it('should not throw on double disposal', async () => {
            await expect(adapter.dispose()).resolves.not.toThrow();
            await expect(adapter.dispose()).resolves.not.toThrow();
        });
    });
    describe('Configuration Validation', () => {
        it('should accept valid protocol modes', () => {
            const modes = [
                'native',
                'pydantic',
                'a2a',
                'hybrid'
            ];
            modes.forEach(mode => {
                const testAdapter = new ClaudeAgentSDKAdapter_1.ClaudeAgentSDKAdapter({
                    ...mockConfig,
                    protocolMode: mode
                });
                expect(testAdapter.getStatus().protocolMode).toBe(mode);
                testAdapter.dispose();
            });
        });
        it('should accept valid model names', () => {
            const models = [
                'claude-opus-4',
                'claude-sonnet-4',
                'claude-haiku-4',
                'claude-sonnet-3.5'
            ];
            models.forEach(model => {
                const testAdapter = new ClaudeAgentSDKAdapter_1.ClaudeAgentSDKAdapter({
                    ...mockConfig,
                    model
                });
                expect(testAdapter.getStatus().model).toBe(model);
                testAdapter.dispose();
            });
        });
    });
    describe('Event Emission', () => {
        it('should emit events during operations', async () => {
            const eventSpy = jest.fn();
            adapter.on('execution:start', eventSpy);
            adapter.on('execution:complete', eventSpy);
            adapter.on('execution:error', eventSpy);
            // Note: We can't actually test execution without a real API key
            // This just verifies the event emitter setup
            expect(adapter.listenerCount('execution:start')).toBe(1);
            expect(adapter.listenerCount('execution:complete')).toBe(1);
            expect(adapter.listenerCount('execution:error')).toBe(1);
        });
    });
});
//# sourceMappingURL=ClaudeAgentSDKAdapter.test.js.map