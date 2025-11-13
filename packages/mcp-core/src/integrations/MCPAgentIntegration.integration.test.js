"use strict";
/**
 * Integration tests for MCPAgentIntegration
 *
 * These tests verify the end-to-end functionality of agent-to-agent MCP communication,
 * including message routing, capability discovery, and collaboration tracking.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MCPAgentIntegration_1 = require("./MCPAgentIntegration");
const IMCPAgentIntegration_1 = require("../interfaces/IMCPAgentIntegration");
// Mock implementations for integration testing
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
(0, vitest_1.describe)('MCPAgentIntegration Integration Tests', () => {
    let integration;
    let testAgent1;
    let testAgent2;
    (0, vitest_1.beforeEach)(async () => {
        // Reset all mocks
        vitest_1.vi.clearAllMocks();
        // Setup successful mock responses
        mockBroker.registerService.mockResolvedValue(undefined);
        mockBroker.unregisterService.mockResolvedValue(undefined);
        mockBroker.getServiceHealth.mockResolvedValue({
            serviceId: 'test',
            status: 'online',
            responseTime: 100,
            errorRate: 0.01
        });
        integration = new MCPAgentIntegration_1.MCPAgentIntegration(mockBroker, mockClient, {
            defaultTimeout: 5000,
            maxRetries: 2,
            heartbeatInterval: 1000,
            enableAuditLog: false
        });
        // Create test agents
        testAgent1 = {
            id: 'agent-1',
            name: 'Test Agent 1',
            version: '1.0.0',
            description: 'First test agent',
            capabilities: ['chat', 'analysis'],
            resources: ['documents', 'data'],
            tools: ['calculator', 'translator'],
            endpoint: 'mcp://agent-1',
            status: IMCPAgentIntegration_1.AgentStatus.ACTIVE,
            createdAt: new Date(),
            lastActivity: new Date(),
            metadata: { type: 'test', priority: 'high',
                testAgent2 = {
                    id: 'agent-2',
                    name: 'Test Agent 2',
                    version: '1.0.0',
                    description: 'Second test agent',
                    capabilities: ['search', 'summarization'],
                    resources: ['web', 'knowledge-base'],
                    tools: ['search-engine', 'summarizer'],
                    endpoint: 'mcp://agent-2',
                    status: IMCPAgentIntegration_1.AgentStatus.ACTIVE,
                    createdAt: new Date(),
                    lastActivity: new Date(),
                    metadata: { type: 'test', priority: 'medium'
                    }
                } }
        };
    });
    (0, vitest_1.afterEach)(async () => {
        // Clean up - no need to unregister with mocked broker
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Agent Registration and Discovery', () => {
        (0, vitest_1.it)('should register multiple agents and discover them', async () => {
            // Register both agents
            const result1 = await integration.registerAgentAsMCPService(testAgent1);
            const result2 = await integration.registerAgentAsMCPService(testAgent2);
            (0, vitest_1.expect)(result1.success).toBe(true);
            (0, vitest_1.expect)(result2.success).toBe(true);
            // List all registered agents
            const endpoints = await integration.listAgentEndpoints();
            (0, vitest_1.expect)(endpoints).toHaveLength(2);
            const agentIds = endpoints.map(e => e.agentId);
            (0, vitest_1.expect)(agentIds).toContain(testAgent1.id);
            (0, vitest_1.expect)(agentIds).toContain(testAgent2.id);
        });
        (0, vitest_1.it)('should find agents by capability', async () => {
            await integration.registerAgentAsMCPService(testAgent1);
            await integration.registerAgentAsMCPService(testAgent2);
            // Find agents with 'chat' capability
            const chatAgents = await integration.findAgentsByCapability('agent.communication');
            (0, vitest_1.expect)(chatAgents).toHaveLength(2); // Both agents should have default communication capability
            // Find agents with specific capability
            const analysisAgents = await integration.findAgentsByCapability('analysis');
            (0, vitest_1.expect)(analysisAgents).toHaveLength(0); // No agents have this as a default capability
        });
        (0, vitest_1.it)('should get agent MCP capabilities', async () => {
            await integration.registerAgentAsMCPService(testAgent1);
            const capabilities = await integration.getAgentMCPCapabilities(testAgent1.id);
            (0, vitest_1.expect)(capabilities.agentId).toBe(testAgent1.id);
            (0, vitest_1.expect)(capabilities.capabilities).toHaveLength(3); // Default capabilities
            (0, vitest_1.expect)(capabilities.resources).toEqual(testAgent1.resources);
            (0, vitest_1.expect)(capabilities.tools).toEqual(testAgent1.tools);
            (0, vitest_1.expect)(capabilities.compatibility.supported).toBe(true);
        });
    });
    (0, vitest_1.describe)('Agent Communication Routing', () => {
        (0, vitest_1.beforeEach)(async () => {
            // Register both agents for communication tests
            await integration.registerAgentAsMCPService(testAgent1);
            await integration.registerAgentAsMCPService(testAgent2);
        });
        (0, vitest_1.it)('should route messages between agents', async () => {
            const message = {
                type: 'request',
                content: 'Hello from agent 1',
                timestamp: new Date().toISOString()
            };
            // Mock the broker's routeRequest method to simulate successful routing
            mockBroker.routeRequest.mockResolvedValue({
                jsonrpc: '2.0',
                id: 'test-id',
                result: { success: true, response: 'Hello back from agent 2' }
            });
            const result = await integration.routeAgentMessage(testAgent1.id, testAgent2.id, message);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.routingInfo.fromAgentId).toBe(testAgent1.id);
            (0, vitest_1.expect)(result.routingInfo.toAgentId).toBe(testAgent2.id);
            (0, vitest_1.expect)(result.response).toEqual({ success: true, response: 'Hello back from agent 2' });
            (0, vitest_1.expect)(result.retryCount).toBe(0);
        });
        (0, vitest_1.it)('should handle message routing with custom routing options', async () => {
            const message = { content: 'Priority message' };
            mockBroker.routeRequest.mockResolvedValue({
                jsonrpc: '2.0',
                id: 'test-id',
                result: { received: true }
            });
            const result = await integration.routeAgentMessage(testAgent1.id, testAgent2.id, message, {
                messageType: 'notification',
                priority: 'high',
                timeout: 10000,
                retryPolicy: {
                    maxRetries: 1,
                    backoffMs: 500,
                    exponential: false
                }
            });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.routingInfo.messageType).toBe('notification');
            (0, vitest_1.expect)(result.routingInfo.priority).toBe('high');
            (0, vitest_1.expect)(result.routingInfo.timeout).toBe(10000);
        });
        (0, vitest_1.it)('should retry failed message routing', async () => {
            const message = { content: 'Test retry' };
            // Mock first call to fail, second to succeed
            mockBroker.routeRequest
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                jsonrpc: '2.0',
                id: 'test-id',
                result: { success: true }
            });
            const result = await integration.routeAgentMessage(testAgent1.id, testAgent2.id, message, {
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
        (0, vitest_1.it)('should fail when target agent is inactive', async () => {
            // Set agent 2 as inactive
            await integration.updateAgentStatus(testAgent2.id, IMCPAgentIntegration_1.AgentStatus.INACTIVE);
            const message = { content: 'Test message' };
            const result = await integration.routeAgentMessage(testAgent1.id, testAgent2.id, message);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('is not active');
        });
    });
    (0, vitest_1.describe)('Agent Collaboration Tracking', () => {
        (0, vitest_1.beforeEach)(async () => {
            await integration.registerAgentAsMCPService(testAgent1);
            await integration.registerAgentAsMCPService(testAgent2);
        });
        (0, vitest_1.it)('should track collaboration between agents', async () => {
            const collaboration = await integration.startCollaboration([testAgent1.id, testAgent2.id], testAgent1.id, 'Document analysis task');
            (0, vitest_1.expect)(collaboration.participants).toEqual([testAgent1.id, testAgent2.id]);
            (0, vitest_1.expect)(collaboration.initiator).toBe(testAgent1.id);
            (0, vitest_1.expect)(collaboration.purpose).toBe('Document analysis task');
            (0, vitest_1.expect)(collaboration.status).toBe('active');
            (0, vitest_1.expect)(collaboration.messageCount).toBe(0);
            // Check that both agents have this collaboration
            const agent1Collaborations = await integration.getAgentCollaborations(testAgent1.id);
            const agent2Collaborations = await integration.getAgentCollaborations(testAgent2.id);
            (0, vitest_1.expect)(agent1Collaborations).toHaveLength(1);
            (0, vitest_1.expect)(agent2Collaborations).toHaveLength(1);
            (0, vitest_1.expect)(agent1Collaborations[0].id).toBe(collaboration.id);
            (0, vitest_1.expect)(agent2Collaborations[0].id).toBe(collaboration.id);
        });
        (0, vitest_1.it)('should end collaboration and clean up', async () => {
            const collaboration = await integration.startCollaboration([testAgent1.id, testAgent2.id], testAgent1.id, 'Test collaboration');
            const endResult = await integration.endCollaboration(collaboration.id);
            (0, vitest_1.expect)(endResult).toBe(true);
            // Collaboration should still exist but be marked as completed
            const agent1Collaborations = await integration.getAgentCollaborations(testAgent1.id);
            (0, vitest_1.expect)(agent1Collaborations).toHaveLength(0); // Only active collaborations are returned
        });
        (0, vitest_1.it)('should handle multiple concurrent collaborations', async () => {
            // Create a third agent for multi-collaboration testing
            const testAgent3 = {
                ...testAgent1,
                id: 'agent-3',
                name: 'Test Agent 3'
            };
            await integration.registerAgentAsMCPService(testAgent3);
            // Start multiple collaborations
            const collab1 = await integration.startCollaboration([testAgent1.id, testAgent2.id], testAgent1.id, 'Task 1');
            const collab2 = await integration.startCollaboration([testAgent1.id, testAgent3.id], testAgent1.id, 'Task 2');
            const collab3 = await integration.startCollaboration([testAgent2.id, testAgent3.id], testAgent2.id, 'Task 3');
            // Agent 1 should be in 2 collaborations
            const agent1Collaborations = await integration.getAgentCollaborations(testAgent1.id);
            (0, vitest_1.expect)(agent1Collaborations).toHaveLength(2);
            // Agent 2 should be in 2 collaborations
            const agent2Collaborations = await integration.getAgentCollaborations(testAgent2.id);
            (0, vitest_1.expect)(agent2Collaborations).toHaveLength(2);
            // Agent 3 should be in 2 collaborations
            const agent3Collaborations = await integration.getAgentCollaborations(testAgent3.id);
            (0, vitest_1.expect)(agent3Collaborations).toHaveLength(2);
            // Clean up
            await integration.unregisterAgent(testAgent3.id);
        });
    });
    (0, vitest_1.describe)('Agent Status and Health Management', () => {
        (0, vitest_1.beforeEach)(async () => {
            await integration.registerAgentAsMCPService(testAgent1);
        });
        (0, vitest_1.it)('should update and track agent status', async () => {
            // Update status to busy
            const updateResult = await integration.updateAgentStatus(testAgent1.id, IMCPAgentIntegration_1.AgentStatus.BUSY);
            (0, vitest_1.expect)(updateResult).toBe(true);
            // Send heartbeat
            const heartbeatResult = await integration.sendAgentHeartbeat(testAgent1.id);
            (0, vitest_1.expect)(heartbeatResult).toBe(true);
            // Get health status
            const health = await integration.getAgentHealth(testAgent1.id);
            (0, vitest_1.expect)(health.agentId).toBe(testAgent1.id);
            (0, vitest_1.expect)(health.status).toBe(IMCPAgentIntegration_1.AgentStatus.BUSY);
            (0, vitest_1.expect)(health.availability).toBeGreaterThan(0.9); // Should be highly available with recent heartbeat
        });
        (0, vitest_1.it)('should enable and disable agent MCP communication', async () => {
            // Disable communication
            const disableResult = await integration.disableAgentMCPCommunication(testAgent1.id);
            (0, vitest_1.expect)(disableResult).toBe(true);
            // Enable communication
            const enableResult = await integration.enableAgentMCPCommunication(testAgent1.id);
            (0, vitest_1.expect)(enableResult).toBe(true);
        });
        (0, vitest_1.it)('should handle agent availability degradation over time', async () => {
            // Get initial health
            const initialHealth = await integration.getAgentHealth(testAgent1.id);
            (0, vitest_1.expect)(initialHealth.availability).toBeGreaterThan(0.9);
            // Wait a bit and check availability (should still be high due to recent registration)
            await new Promise(resolve => setTimeout(resolve, 100));
            const laterHealth = await integration.getAgentHealth(testAgent1.id);
            (0, vitest_1.expect)(laterHealth.availability).toBeGreaterThan(0.8); // Should still be reasonably high
        });
    });
    (0, vitest_1.describe)('Error Handling and Edge Cases', () => {
        (0, vitest_1.it)('should handle registration of agent with duplicate ID', async () => {
            // Register agent first time
            const result1 = await integration.registerAgentAsMCPService(testAgent1);
            (0, vitest_1.expect)(result1.success).toBe(true);
            // Try to register same agent again
            const result2 = await integration.registerAgentAsMCPService(testAgent1);
            (0, vitest_1.expect)(result2.success).toBe(true); // Should succeed (re-registration)
        });
        (0, vitest_1.it)('should handle message routing to non-existent agent', async () => {
            await integration.registerAgentAsMCPService(testAgent1);
            const result = await integration.routeAgentMessage(testAgent1.id, 'non-existent-agent', { content: 'test' });
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('not found or not registered');
        });
        (0, vitest_1.it)('should handle operations on unregistered agents', async () => {
            // Try to get capabilities for non-existent agent
            await (0, vitest_1.expect)(integration.getAgentMCPCapabilities('non-existent')).rejects.toThrow('not found');
            // Try to update status for non-existent agent
            const statusResult = await integration.updateAgentStatus('non-existent', IMCPAgentIntegration_1.AgentStatus.ACTIVE);
            (0, vitest_1.expect)(statusResult).toBe(false);
            // Try to send heartbeat for non-existent agent
            const heartbeatResult = await integration.sendAgentHeartbeat('non-existent');
            (0, vitest_1.expect)(heartbeatResult).toBe(false);
        });
        (0, vitest_1.it)('should handle collaboration with non-existent agents', async () => {
            // Start collaboration with mix of existing and non-existing agents
            const collaboration = await integration.startCollaboration([testAgent1.id, 'non-existent'], testAgent1.id, 'Mixed collaboration');
            // Should still create collaboration (validation is not strict)
            (0, vitest_1.expect)(collaboration.participants).toContain(testAgent1.id);
            (0, vitest_1.expect)(collaboration.participants).toContain('non-existent');
        });
    });
    (0, vitest_1.describe)('Performance and Scalability', () => {
        (0, vitest_1.it)('should handle multiple concurrent agent registrations', async () => {
            const agents = [];
            const registrationPromises = [];
            // Create 10 test agents
            for (let i = 0; i < 10; i++) {
                const agent = {
                    ...testAgent1,
                    id: `agent-${i},`,
                    name: `Test Agent ${i}`
                };
                agents.push(agent);
                registrationPromises.push(integration.registerAgentAsMCPService(agent));
            }
            // Register all agents concurrently
            const results = await Promise.all(registrationPromises);
            // All registrations should succeed
            results.forEach(result => {
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            // Verify all agents are registered
            const endpoints = await integration.listAgentEndpoints();
            (0, vitest_1.expect)(endpoints).toHaveLength(10);
            // Clean up
            const unregisterPromises = agents.map(agent => integration.unregisterAgent(agent.id));
            await Promise.all(unregisterPromises);
        });
        (0, vitest_1.it)('should handle rapid message routing between agents', async () => {
            await integration.registerAgentAsMCPService(testAgent1);
            await integration.registerAgentAsMCPService(testAgent2);
            // Mock successful routing
            mockBroker.routeRequest.mockResolvedValue({
                jsonrpc: '2.0',
                id: 'test-id',
                result: { success: true }
            });
            // Send multiple messages rapidly
            const messagePromises = [];
            for (let i = 0; i < 20; i++) {
                messagePromises.push(integration.routeAgentMessage(testAgent1.id, testAgent2.id, { content: Message, $ }, { i } ` }
          )
        );
      }

      const results = await Promise.all(messagePromises);
      
      // All messages should be routed successfully
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});));
            }
        });
    });
});
//# sourceMappingURL=MCPAgentIntegration.integration.test.js.map