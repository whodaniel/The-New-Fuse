"use strict";
/**
 * Unit tests for MCPAgentIntegration
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MCPAgentIntegration_1 = require("./MCPAgentIntegration");
// Mock implementations
const mockBroker = {
    registerService: vitest_1.vi.fn(),
    unregisterService: vitest_1.vi.fn(),
    discoverServices: vitest_1.vi.fn(),
    routeRequest: vitest_1.vi.fn(),
    getServiceHealth: vitest_1.vi.fn()
};
const mockClient = {
    connect: vitest_1.vi.fn(),
    disconnect: vitest_1.vi.fn(),
    sendRequest: vitest_1.vi.fn(),
    subscribeToNotifications: vitest_1.vi.fn(),
    listResources: vitest_1.vi.fn(),
    readResource: vitest_1.vi.fn(),
    callTool: vitest_1.vi.fn(),
    getServerCapabilities: vitest_1.vi.fn()
};
(0, vitest_1.describe)('MCPAgentIntegration', () => {
    let integration;
    let testAgent;
    (0, vitest_1.beforeEach)(() => {
        // Reset all mocks
        vitest_1.vi.clearAllMocks();
        // Create fresh integration instance
        integration = new MCPAgentIntegration_1.MCPAgentIntegration(mockBroker, mockClient, {
            defaultTimeout: 5000,
            maxRetries: 2,
            heartbeatInterval: 10000,
            enableAuditLog: false
        });
        // Create test agent
        testAgent = {
            id: 'test-agent-1',
            name: 'Test Agent',
            version: '1.0.0',
            description: 'A test agent',
            capabilities: ['chat', 'analysis'],
            resources: ['documents', 'data'],
            tools: ['calculator', 'translator'],
            endpoint: 'mcp://test-agent-1',
            status: 'active',
            createdAt: new Date(),
            lastActivity: new Date(),
            metadata: { type: 'test'
            }
        };
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('registerAgentAsMCPService', () => {
        (0, vitest_1.it)('should successfully register a valid agent', async () => {
            // Mock successful broker registration
            mockBroker.registerService.mockResolvedValue(undefined);
            const result = await integration.registerAgentAsMCPService(testAgent);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.agentId).toBe(testAgent.id);
            (0, vitest_1.expect)(result.endpoint).toBe(testAgent.endpoint);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(mockBroker.registerService).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('should fail when agent is missing required fields', async () => {
            const invalidAgent = { ...testAgent, id: '' };
            const result = await integration.registerAgentAsMCPService(invalidAgent);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toHaveLength(1);
            (0, vitest_1.expect)(result.errors[0]).toContain('Agent must have id and name');
            (0, vitest_1.expect)(mockBroker.registerService).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should fail when agent capabilities are not arrays', async () => {
            const invalidAgent = { ...testAgent, capabilities: 'not-an-array' };
            const result = await integration.registerAgentAsMCPService(invalidAgent);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toHaveLength(1);
            (0, vitest_1.expect)(result.errors[0]).toContain('must be arrays');
            (0, vitest_1.expect)(mockBroker.registerService).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle broker registration failure', async () => {
            mockBroker.registerService.mockRejectedValue(new Error('Broker error'));
            const result = await integration.registerAgentAsMCPService(testAgent);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.errors).toHaveLength(1);
            (0, vitest_1.expect)(result.errors[0]).toBe('Broker error');
        });
        (0, vitest_1.it)('should create proper service info from agent', async () => {
            mockBroker.registerService.mockResolvedValue(undefined);
            await integration.registerAgentAsMCPService(testAgent);
            const registerCall = mockBroker.registerService.mock.calls[0][0];
            (0, vitest_1.expect)(registerCall.id).toBe(testAgent.id);
            (0, vitest_1.expect)(registerCall.name).toBe(testAgent.name);
            (0, vitest_1.expect)(registerCall.version).toBe(testAgent.version);
            (0, vitest_1.expect)(registerCall.capabilities).toEqual(testAgent.capabilities);
            (0, vitest_1.expect)(registerCall.metadata.agentType).toBe('mcp-integrated');
        });
    });
    (0, vitest_1.describe)('unregisterAgent', () => {
        (0, vitest_1.beforeEach)(async () => {
            mockBroker.registerService.mockResolvedValue(undefined);
            await integration.registerAgentAsMCPService(testAgent);
        });
        (0, vitest_1.it)('should successfully unregister an agent', async () => {
            mockBroker.unregisterService.mockResolvedValue(undefined);
            const result = await integration.unregisterAgent(testAgent.id);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockBroker.unregisterService).toHaveBeenCalledWith(testAgent.id);
        });
        (0, vitest_1.it)('should handle broker unregistration failure', async () => {
            mockBroker.unregisterService.mockRejectedValue(new Error('Broker error'));
            const result = await integration.unregisterAgent(testAgent.id);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return true even for non-existent agents', async () => {
            mockBroker.unregisterService.mockResolvedValue(undefined);
            const result = await integration.unregisterAgent('non-existent');
            (0, vitest_1.expect)(result).toBe(true);
        });
    });
    (0, vitest_1.describe)('enableAgentMCPCommunication', () => {
        (0, vitest_1.beforeEach)(async () => {
            mockBroker.registerService.mockResolvedValue(undefined);
            mockBroker.getServiceHealth.mockResolvedValue({
                serviceId: testAgent.id,
                status: 'offline',
                responseTime: 100,
                errorRate: 0
            });
            await integration.registerAgentAsMCPService(testAgent);
        });
        (0, vitest_1.it)('should enable communication for registered agent', async () => {
            const result = await integration.enableAgentMCPCommunication(testAgent.id);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockBroker.getServiceHealth).toHaveBeenCalledWith(testAgent.id);
        });
        (0, vitest_1.it)('should fail for non-existent agent', async () => {
            const result = await integration.enableAgentMCPCommunication('non-existent');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('disableAgentMCPCommunication', () => {
        (0, vitest_1.beforeEach)(async () => {
            mockBroker.registerService.mockResolvedValue(undefined);
            mockBroker.getServiceHealth.mockResolvedValue({
                serviceId: testAgent.id,
                status: 'online',
                responseTime: 100,
                errorRate: 0
            });
            await integration.registerAgentAsMCPService(testAgent);
        });
        (0, vitest_1.it)('should disable communication for registered agent', async () => {
            const result = await integration.disableAgentMCPCommunication(testAgent.id);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false for non-existent agent', async () => {
            const result = await integration.disableAgentMCPCommunication('non-existent');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('routeAgentMessage', () => {
        const sourceAgent = 'source-agent';
        const targetAgent = 'target-agent';
        const testMessage = { content: 'Hello from source agent' };
        (0, vitest_1.beforeEach)(async () => {
            mockBroker.registerService.mockResolvedValue(undefined);
            // Register both agents
            await integration.registerAgentAsMCPService(testAgent);
            await integration.registerAgentAsMCPService({
                ...testAgent,
                id: targetAgent,
                name: 'Target Agent'
            });
        });
        (0, vitest_1.it)('should successfully route message between agents', async () => {
            mockBroker.routeRequest.mockResolvedValue({
                jsonrpc: '2.0',
                id: 'test-id',
                result: { success: true }
            });
            const result = await integration.routeAgentMessage(sourceAgent, targetAgent, testMessage);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.routingInfo.fromAgentId).toBe(sourceAgent);
            (0, vitest_1.expect)(result.routingInfo.toAgentId).toBe(targetAgent);
            (0, vitest_1.expect)(result.response).toEqual({ success: true });
            (0, vitest_1.expect)(mockBroker.routeRequest).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('should fail when target agent is not found', async () => {
            const result = await integration.routeAgentMessage(sourceAgent, 'non-existent', testMessage);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('not found or not registered');
            (0, vitest_1.expect)(mockBroker.routeRequest).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should fail when target agent is inactive', async () => {
            // Set target agent as inactive
            await integration.updateAgentStatus(targetAgent, 'inactive');
            const result = await integration.routeAgentMessage(sourceAgent, targetAgent, testMessage);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('is not active');
        });
        (0, vitest_1.it)('should retry on failure according to retry policy', async () => {
            mockBroker.routeRequest
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue({
                jsonrpc: '2.0',
                id: 'test-id',
                result: { success: true }
            });
            const result = await integration.routeAgentMessage(sourceAgent, targetAgent, testMessage, {
                retryPolicy: {
                    maxRetries: 1,
                    backoffMs: 10,
                    exponential: false
                }
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.retryCount).toBe(1);
            (0, vitest_1.expect)(mockBroker.routeRequest).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should fail after exhausting retries', async () => {
            mockBroker.routeRequest.mockRejectedValue(new Error('Persistent error'));
            const result = await integration.routeAgentMessage(sourceAgent, targetAgent, testMessage, {
                retryPolicy: {
                    maxRetries: 1,
                    backoffMs: 10,
                    exponential: false
                }
            });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.retryCount).toBe(2); // Initial attempt + 1 retry
            (0, vitest_1.expect)(result.error).toBe('Persistent error');
        });
    });
    (0, vitest_1.describe)('getAgentMCPCapabilities', () => {
        (0, vitest_1.beforeEach)(async () => {
            mockBroker.registerService.mockResolvedValue(undefined);
            mockBroker.getServiceHealth.mockResolvedValue({
                serviceId: testAgent.id,
                status: 'online',
                responseTime: 150,
                errorRate: 0.01
            });
            await integration.registerAgentAsMCPService(testAgent);
        });
        (0, vitest_1.it)('should return capabilities for registered agent', async () => {
            const result = await integration.getAgentMCPCapabilities(testAgent.id);
            (0, vitest_1.expect)(result.agentId).toBe(testAgent.id);
            (0, vitest_1.expect)(result.capabilities).toHaveLength(3); // Default capabilities
            (0, vitest_1.expect)(result.resources).toEqual(testAgent.resources);
            (0, vitest_1.expect)(result.tools).toEqual(testAgent.tools);
            (0, vitest_1.expect)(result.compatibility.supported).toBe(true);
            (0, vitest_1.expect)(result.performance.responseTime).toBe(150);
            (0, vitest_1.expect)(result.performance.errorRate).toBe(0.01);
        });
        (0, vitest_1.it)('should throw error for non-existent agent', async () => {
            await (0, vitest_1.expect)(integration.getAgentMCPCapabilities('non-existent')).rejects.toThrow('Agent non-existent not found');
        });
    });
    (0, vitest_1.describe)('listAgentEndpoints', () => {
        (0, vitest_1.it)('should return empty array when no agents registered', async () => {
            const result = await integration.listAgentEndpoints();
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
        (0, vitest_1.it)('should return all registered agent endpoints', async () => {
            mockBroker.registerService.mockResolvedValue(undefined);
            await integration.registerAgentAsMCPService(testAgent);
            await integration.registerAgentAsMCPService({
                ...testAgent,
                id: 'agent-2',
                name: 'Agent 2'
            });
            const result = await integration.listAgentEndpoints();
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result.map(e => e.agentId)).toContain(testAgent.id);
            (0, vitest_1.expect)(result.map(e => e.agentId)).toContain('agent-2');
        });
    });
    (0, vitest_1.describe)('findAgentsByCapability', () => {
        (0, vitest_1.beforeEach)(async () => {
            mockBroker.registerService.mockResolvedValue(undefined);
            await integration.registerAgentAsMCPService(testAgent);
        });
        (0, vitest_1.it)('should find agents with matching capability', async () => {
            const result = await integration.findAgentsByCapability('agent.communication');
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].id).toBe(testAgent.id);
        });
        (0, vitest_1.it)('should return empty array for non-matching capability', async () => {
            const result = await integration.findAgentsByCapability('non-existent-capability');
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('collaboration management', () => {
        (0, vitest_1.it)('should start and track collaboration', async () => {
            const participants = ['agent-1', 'agent-2'];
            const initiator = 'agent-1';
            const purpose = 'Test collaboration';
            const collaboration = await integration.startCollaboration(participants, initiator, purpose);
            (0, vitest_1.expect)(collaboration.participants).toEqual(participants);
            (0, vitest_1.expect)(collaboration.initiator).toBe(initiator);
            (0, vitest_1.expect)(collaboration.purpose).toBe(purpose);
            (0, vitest_1.expect)(collaboration.status).toBe('active');
        });
        (0, vitest_1.it)('should end collaboration', async () => {
            const collaboration = await integration.startCollaboration(['agent-1', 'agent-2'], 'agent-1', 'Test');
            const result = await integration.endCollaboration(collaboration.id);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false when ending non-existent collaboration', async () => {
            const result = await integration.endCollaboration('non-existent');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should get agent collaborations', async () => {
            const agentId = 'test-agent';
            await integration.startCollaboration([agentId, 'other-agent'], agentId, 'Test 1');
            await integration.startCollaboration(['different-agent', 'another-agent'], 'different-agent', 'Test 2');
            const collaborations = await integration.getAgentCollaborations(agentId);
            (0, vitest_1.expect)(collaborations).toHaveLength(1);
            (0, vitest_1.expect)(collaborations[0].participants).toContain(agentId);
        });
    });
    (0, vitest_1.describe)('agent status and health', () => {
        (0, vitest_1.beforeEach)(async () => {
            mockBroker.registerService.mockResolvedValue(undefined);
            mockBroker.getServiceHealth.mockResolvedValue({
                serviceId: testAgent.id,
                status: 'online',
                responseTime: 100,
                errorRate: 0.05
            });
            await integration.registerAgentAsMCPService(testAgent);
        });
        (0, vitest_1.it)('should update agent status', async () => {
            const result = await integration.updateAgentStatus(testAgent.id, 'busy');
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false for non-existent agent status update', async () => {
            const result = await integration.updateAgentStatus('non-existent', 'active');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should get agent health', async () => {
            const health = await integration.getAgentHealth(testAgent.id);
            (0, vitest_1.expect)(health.agentId).toBe(testAgent.id);
            (0, vitest_1.expect)(health.status).toBe('active');
            (0, vitest_1.expect)(health.responseTime).toBe(100);
            (0, vitest_1.expect)(health.errorRate).toBe(0.05);
            (0, vitest_1.expect)(health.availability).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should throw error for non-existent agent health', async () => {
            await (0, vitest_1.expect)(integration.getAgentHealth('non-existent')).rejects.toThrow('Agent non-existent not found');
        });
        (0, vitest_1.it)('should send agent heartbeat', async () => {
            const result = await integration.sendAgentHeartbeat(testAgent.id);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false for non-existent agent heartbeat', async () => {
            const result = await integration.sendAgentHeartbeat('non-existent');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
});
//# sourceMappingURL=MCPAgentIntegration.test.js.map