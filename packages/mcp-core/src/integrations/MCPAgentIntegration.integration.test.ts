/**
 * Integration tests for MCPAgentIntegration
 * 
 * These tests verify the end-to-end functionality of agent-to-agent MCP communication,
 * including message routing, capability discovery, and collaboration tracking.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { MCPAgentIntegration } from './MCPAgentIntegration';
import { AgentStatus } from '../interfaces/IMCPAgentIntegration';
import type { Agent, IMCPBroker, IMCPClient } from '../interfaces';

// Mock implementations for integration testing
const mockBroker: IMCPBroker = {
  registerService: vi.fn(),
  unregisterService: vi.fn(),
  discoverServices: vi.fn(),
  routeRequest: vi.fn(),
  getServiceHealth: vi.fn()
};

const mockClient: IMCPClient = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendRequest: vi.fn(),
  subscribeToNotifications: vi.fn(),
  listResources: vi.fn(),
  readResource: vi.fn(),
  callTool: vi.fn(),
  getServerCapabilities: vi.fn()
};

describe('MCPAgentIntegration Integration Tests', () => {
  let integration: MCPAgentIntegration;
  let testAgent1: Agent;
  let testAgent2: Agent;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup successful mock responses
    (mockBroker.registerService as Mock).mockResolvedValue(undefined);
    (mockBroker.unregisterService as Mock).mockResolvedValue(undefined);
    (mockBroker.getServiceHealth as Mock).mockResolvedValue({
      serviceId: 'test',
      status: 'online',
      responseTime: 100,
      errorRate: 0.01
    });

    integration = new MCPAgentIntegration(mockBroker, mockClient, {
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
      status: AgentStatus.ACTIVE,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: { type: 'test', priority: 'high' }
    };

    testAgent2 = {
      id: 'agent-2',
      name: 'Test Agent 2',
      version: '1.0.0',
      description: 'Second test agent',
      capabilities: ['search', 'summarization'],
      resources: ['web', 'knowledge-base'],
      tools: ['search-engine', 'summarizer'],
      endpoint: 'mcp://agent-2',
      status: AgentStatus.ACTIVE,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: { type: 'test', priority: 'medium' }
    };
  });

  afterEach(async () => {
    // Clean up - no need to unregister with mocked broker
    vi.restoreAllMocks();
  });

  describe('Agent Registration and Discovery', () => {
    it('should register multiple agents and discover them', async () => {
      // Register both agents
      const result1 = await integration.registerAgentAsMCPService(testAgent1);
      const result2 = await integration.registerAgentAsMCPService(testAgent2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // List all registered agents
      const endpoints = await integration.listAgentEndpoints();
      expect(endpoints).toHaveLength(2);
      
      const agentIds = endpoints.map(e => e.agentId);
      expect(agentIds).toContain(testAgent1.id);
      expect(agentIds).toContain(testAgent2.id);
    });

    it('should find agents by capability', async () => {
      await integration.registerAgentAsMCPService(testAgent1);
      await integration.registerAgentAsMCPService(testAgent2);

      // Find agents with 'chat' capability
      const chatAgents = await integration.findAgentsByCapability('agent.communication');
      expect(chatAgents).toHaveLength(2); // Both agents should have default communication capability

      // Find agents with specific capability
      const analysisAgents = await integration.findAgentsByCapability('analysis');
      expect(analysisAgents).toHaveLength(0); // No agents have this as a default capability
    });

    it('should get agent MCP capabilities', async () => {
      await integration.registerAgentAsMCPService(testAgent1);

      const capabilities = await integration.getAgentMCPCapabilities(testAgent1.id);
      
      expect(capabilities.agentId).toBe(testAgent1.id);
      expect(capabilities.capabilities).toHaveLength(3); // Default capabilities
      expect(capabilities.resources).toEqual(testAgent1.resources);
      expect(capabilities.tools).toEqual(testAgent1.tools);
      expect(capabilities.compatibility.supported).toBe(true);
    });
  });

  describe('Agent Communication Routing', () => {
    beforeEach(async () => {
      // Register both agents for communication tests
      await integration.registerAgentAsMCPService(testAgent1);
      await integration.registerAgentAsMCPService(testAgent2);
    });

    it('should route messages between agents', async () => {
      const message = {
        type: 'request',
        content: 'Hello from agent 1',
        timestamp: new Date().toISOString()
      };

      // Mock the broker's routeRequest method to simulate successful routing
      (mockBroker.routeRequest as Mock).mockResolvedValue({
        jsonrpc: '2.0',
        id: 'test-id',
        result: { success: true, response: 'Hello back from agent 2' }
      });

      const result = await integration.routeAgentMessage(
        testAgent1.id,
        testAgent2.id,
        message
      );

      expect(result.success).toBe(true);
      expect(result.routingInfo.fromAgentId).toBe(testAgent1.id);
      expect(result.routingInfo.toAgentId).toBe(testAgent2.id);
      expect(result.response).toEqual({ success: true, response: 'Hello back from agent 2' });
      expect(result.retryCount).toBe(0);
    });

    it('should handle message routing with custom routing options', async () => {
      const message = { content: 'Priority message' };
      
      (mockBroker.routeRequest as Mock).mockResolvedValue({
        jsonrpc: '2.0',
        id: 'test-id',
        result: { received: true }
      });

      const result = await integration.routeAgentMessage(
        testAgent1.id,
        testAgent2.id,
        message,
        {
          messageType: 'notification',
          priority: 'high',
          timeout: 10000,
          retryPolicy: {
            maxRetries: 1,
            backoffMs: 500,
            exponential: false
          }
        }
      );

      expect(result.success).toBe(true);
      expect(result.routingInfo.messageType).toBe('notification');
      expect(result.routingInfo.priority).toBe('high');
      expect(result.routingInfo.timeout).toBe(10000);
    });

    it('should retry failed message routing', async () => {
      const message = { content: 'Test retry' };
      
      // Mock first call to fail, second to succeed
      (mockBroker.routeRequest as Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          jsonrpc: '2.0',
          id: 'test-id',
          result: { success: true }
        });

      const result = await integration.routeAgentMessage(
        testAgent1.id,
        testAgent2.id,
        message,
        {
          retryPolicy: {
            maxRetries: 1,
            backoffMs: 10,
            exponential: false
          }
        }
      );

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(1);
      expect(mockBroker.routeRequest).toHaveBeenCalledTimes(2);
    });

    it('should fail when target agent is inactive', async () => {
      // Set agent 2 as inactive
      await integration.updateAgentStatus(testAgent2.id, AgentStatus.INACTIVE);

      const message = { content: 'Test message' };
      
      const result = await integration.routeAgentMessage(
        testAgent1.id,
        testAgent2.id,
        message
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('is not active');
    });
  });

  describe('Agent Collaboration Tracking', () => {
    beforeEach(async () => {
      await integration.registerAgentAsMCPService(testAgent1);
      await integration.registerAgentAsMCPService(testAgent2);
    });

    it('should track collaboration between agents', async () => {
      const collaboration = await integration.startCollaboration(
        [testAgent1.id, testAgent2.id],
        testAgent1.id,
        'Document analysis task'
      );

      expect(collaboration.participants).toEqual([testAgent1.id, testAgent2.id]);
      expect(collaboration.initiator).toBe(testAgent1.id);
      expect(collaboration.purpose).toBe('Document analysis task');
      expect(collaboration.status).toBe('active');
      expect(collaboration.messageCount).toBe(0);

      // Check that both agents have this collaboration
      const agent1Collaborations = await integration.getAgentCollaborations(testAgent1.id);
      const agent2Collaborations = await integration.getAgentCollaborations(testAgent2.id);

      expect(agent1Collaborations).toHaveLength(1);
      expect(agent2Collaborations).toHaveLength(1);
      expect(agent1Collaborations[0].id).toBe(collaboration.id);
      expect(agent2Collaborations[0].id).toBe(collaboration.id);
    });

    it('should end collaboration and clean up', async () => {
      const collaboration = await integration.startCollaboration(
        [testAgent1.id, testAgent2.id],
        testAgent1.id,
        'Test collaboration'
      );

      const endResult = await integration.endCollaboration(collaboration.id);
      expect(endResult).toBe(true);

      // Collaboration should still exist but be marked as completed
      const agent1Collaborations = await integration.getAgentCollaborations(testAgent1.id);
      expect(agent1Collaborations).toHaveLength(0); // Only active collaborations are returned
    });

    it('should handle multiple concurrent collaborations', async () => {
      // Create a third agent for multi-collaboration testing
      const testAgent3: Agent = {
        ...testAgent1,
        id: 'agent-3',
        name: 'Test Agent 3'
      };
      await integration.registerAgentAsMCPService(testAgent3);

      // Start multiple collaborations
      const collab1 = await integration.startCollaboration(
        [testAgent1.id, testAgent2.id],
        testAgent1.id,
        'Task 1'
      );

      const collab2 = await integration.startCollaboration(
        [testAgent1.id, testAgent3.id],
        testAgent1.id,
        'Task 2'
      );

      const collab3 = await integration.startCollaboration(
        [testAgent2.id, testAgent3.id],
        testAgent2.id,
        'Task 3'
      );

      // Agent 1 should be in 2 collaborations
      const agent1Collaborations = await integration.getAgentCollaborations(testAgent1.id);
      expect(agent1Collaborations).toHaveLength(2);

      // Agent 2 should be in 2 collaborations
      const agent2Collaborations = await integration.getAgentCollaborations(testAgent2.id);
      expect(agent2Collaborations).toHaveLength(2);

      // Agent 3 should be in 2 collaborations
      const agent3Collaborations = await integration.getAgentCollaborations(testAgent3.id);
      expect(agent3Collaborations).toHaveLength(2);

      // Clean up
      await integration.unregisterAgent(testAgent3.id);
    });
  });

  describe('Agent Status and Health Management', () => {
    beforeEach(async () => {
      await integration.registerAgentAsMCPService(testAgent1);
    });

    it('should update and track agent status', async () => {
      // Update status to busy
      const updateResult = await integration.updateAgentStatus(testAgent1.id, AgentStatus.BUSY);
      expect(updateResult).toBe(true);

      // Send heartbeat
      const heartbeatResult = await integration.sendAgentHeartbeat(testAgent1.id);
      expect(heartbeatResult).toBe(true);

      // Get health status
      const health = await integration.getAgentHealth(testAgent1.id);
      expect(health.agentId).toBe(testAgent1.id);
      expect(health.status).toBe(AgentStatus.BUSY);
      expect(health.availability).toBeGreaterThan(0.9); // Should be highly available with recent heartbeat
    });

    it('should enable and disable agent MCP communication', async () => {
      // Disable communication
      const disableResult = await integration.disableAgentMCPCommunication(testAgent1.id);
      expect(disableResult).toBe(true);

      // Enable communication
      const enableResult = await integration.enableAgentMCPCommunication(testAgent1.id);
      expect(enableResult).toBe(true);
    });

    it('should handle agent availability degradation over time', async () => {
      // Get initial health
      const initialHealth = await integration.getAgentHealth(testAgent1.id);
      expect(initialHealth.availability).toBeGreaterThan(0.9);

      // Wait a bit and check availability (should still be high due to recent registration)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const laterHealth = await integration.getAgentHealth(testAgent1.id);
      expect(laterHealth.availability).toBeGreaterThan(0.8); // Should still be reasonably high
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle registration of agent with duplicate ID', async () => {
      // Register agent first time
      const result1 = await integration.registerAgentAsMCPService(testAgent1);
      expect(result1.success).toBe(true);

      // Try to register same agent again
      const result2 = await integration.registerAgentAsMCPService(testAgent1);
      expect(result2.success).toBe(true); // Should succeed (re-registration)
    });

    it('should handle message routing to non-existent agent', async () => {
      await integration.registerAgentAsMCPService(testAgent1);

      const result = await integration.routeAgentMessage(
        testAgent1.id,
        'non-existent-agent',
        { content: 'test' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found or not registered');
    });

    it('should handle operations on unregistered agents', async () => {
      // Try to get capabilities for non-existent agent
      await expect(
        integration.getAgentMCPCapabilities('non-existent')
      ).rejects.toThrow('not found');

      // Try to update status for non-existent agent
      const statusResult = await integration.updateAgentStatus('non-existent', AgentStatus.ACTIVE);
      expect(statusResult).toBe(false);

      // Try to send heartbeat for non-existent agent
      const heartbeatResult = await integration.sendAgentHeartbeat('non-existent');
      expect(heartbeatResult).toBe(false);
    });

    it('should handle collaboration with non-existent agents', async () => {
      // Start collaboration with mix of existing and non-existing agents
      const collaboration = await integration.startCollaboration(
        [testAgent1.id, 'non-existent'],
        testAgent1.id,
        'Mixed collaboration'
      );

      // Should still create collaboration (validation is not strict)
      expect(collaboration.participants).toContain(testAgent1.id);
      expect(collaboration.participants).toContain('non-existent');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent agent registrations', async () => {
      const agents: Agent[] = [];
      const registrationPromises: Promise<any>[] = [];

      // Create 10 test agents
      for (let i = 0; i < 10; i++) {
        const agent: Agent = {
          ...testAgent1,
          id: `agent-${i}`,
          name: `Test Agent ${i}`
        };
        agents.push(agent);
        registrationPromises.push(integration.registerAgentAsMCPService(agent));
      }

      // Register all agents concurrently
      const results = await Promise.all(registrationPromises);
      
      // All registrations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all agents are registered
      const endpoints = await integration.listAgentEndpoints();
      expect(endpoints).toHaveLength(10);

      // Clean up
      const unregisterPromises = agents.map(agent => 
        integration.unregisterAgent(agent.id)
      );
      await Promise.all(unregisterPromises);
    });

    it('should handle rapid message routing between agents', async () => {
      await integration.registerAgentAsMCPService(testAgent1);
      await integration.registerAgentAsMCPService(testAgent2);

      // Mock successful routing
      (mockBroker.routeRequest as Mock).mockResolvedValue({
        jsonrpc: '2.0',
        id: 'test-id',
        result: { success: true }
      });

      // Send multiple messages rapidly
      const messagePromises: Promise<any>[] = [];
      for (let i = 0; i < 20; i++) {
        messagePromises.push(
          integration.routeAgentMessage(
            testAgent1.id,
            testAgent2.id,
            { content: `Message ${i}` }
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
});