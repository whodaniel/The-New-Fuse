/**
 * Unit tests for MCPAgentIntegration
 */

// @ts-expect-error - Jest globals are available without import
import type { Agent, IMCPBroker, IMCPClient } from '../interfaces/index.js';
import { MCPAgentIntegration } from './MCPAgentIntegration.js';

// Mock implementations
const mockBroker: IMCPBroker = {
  registerService: jest.fn(),
  unregisterService: jest.fn(),
  discoverServices: jest.fn(),
  routeRequest: jest.fn(),
  getServiceHealth: jest.fn(),
};

const mockClient: IMCPClient = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendRequest: jest.fn(),
  subscribeToNotifications: jest.fn(),
  listResources: jest.fn(),
  readResource: jest.fn(),
  callTool: jest.fn(),
  getServerCapabilities: jest.fn(),
};

describe('MCPAgentIntegration', () => {
  let integration: MCPAgentIntegration;
  let testAgent: Agent;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh integration instance
    integration = new MCPAgentIntegration(mockBroker, mockClient, {
      defaultTimeout: 5000,
      maxRetries: 2,
      heartbeatInterval: 10000,
      enableAuditLog: false,
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
      status: 'active' as any,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: { type: 'test' },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registerAgentAsMCPService', () => {
    it('should successfully register a valid agent', async () => {
      // Mock successful broker registration
      (mockBroker.registerService as Mock).mockResolvedValue(undefined);

      const result = await integration.registerAgentAsMCPService(testAgent);

      expect(result.success).toBe(true);
      expect(result.agentId).toBe(testAgent.id);
      expect(result.endpoint).toBe(testAgent.endpoint);
      expect(result.errors).toHaveLength(0);
      expect(mockBroker.registerService).toHaveBeenCalledOnce();
    });

    it('should fail when agent is missing required fields', async () => {
      const invalidAgent = { ...testAgent, id: '' };

      const result = await integration.registerAgentAsMCPService(invalidAgent);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Agent must have id and name');
      expect(mockBroker.registerService).not.toHaveBeenCalled();
    });

    it('should fail when agent capabilities are not arrays', async () => {
      const invalidAgent = { ...testAgent, capabilities: 'not-an-array' as any };

      const result = await integration.registerAgentAsMCPService(invalidAgent);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('must be arrays');
      expect(mockBroker.registerService).not.toHaveBeenCalled();
    });

    it('should handle broker registration failure', async () => {
      (mockBroker.registerService as Mock).mockRejectedValue(new Error('Broker error'));

      const result = await integration.registerAgentAsMCPService(testAgent);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Broker error');
    });

    it('should create proper service info from agent', async () => {
      (mockBroker.registerService as Mock).mockResolvedValue(undefined);

      await integration.registerAgentAsMCPService(testAgent);

      const registerCall = (mockBroker.registerService as Mock).mock.calls[0][0];
      expect(registerCall.id).toBe(testAgent.id);
      expect(registerCall.name).toBe(testAgent.name);
      expect(registerCall.version).toBe(testAgent.version);
      expect(registerCall.capabilities).toEqual(testAgent.capabilities);
      expect(registerCall.metadata.agentType).toBe('mcp-integrated');
    });
  });

  describe('unregisterAgent', () => {
    beforeEach(async () => {
      (mockBroker.registerService as Mock).mockResolvedValue(undefined);
      await integration.registerAgentAsMCPService(testAgent);
    });

    it('should successfully unregister an agent', async () => {
      (mockBroker.unregisterService as Mock).mockResolvedValue(undefined);

      const result = await integration.unregisterAgent(testAgent.id);

      expect(result).toBe(true);
      expect(mockBroker.unregisterService).toHaveBeenCalledWith(testAgent.id);
    });

    it('should handle broker unregistration failure', async () => {
      (mockBroker.unregisterService as Mock).mockRejectedValue(new Error('Broker error'));

      const result = await integration.unregisterAgent(testAgent.id);

      expect(result).toBe(false);
    });

    it('should return true even for non-existent agents', async () => {
      (mockBroker.unregisterService as Mock).mockResolvedValue(undefined);

      const result = await integration.unregisterAgent('non-existent');

      expect(result).toBe(true);
    });
  });

  describe('enableAgentMCPCommunication', () => {
    beforeEach(async () => {
      (mockBroker.registerService as Mock).mockResolvedValue(undefined);
      (mockBroker.getServiceHealth as Mock).mockResolvedValue({
        serviceId: testAgent.id,
        status: 'offline',
        responseTime: 100,
        errorRate: 0,
      });
      await integration.registerAgentAsMCPService(testAgent);
    });

    it('should enable communication for registered agent', async () => {
      const result = await integration.enableAgentMCPCommunication(testAgent.id);

      expect(result).toBe(true);
      expect(mockBroker.getServiceHealth).toHaveBeenCalledWith(testAgent.id);
    });

    it('should fail for non-existent agent', async () => {
      const result = await integration.enableAgentMCPCommunication('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('disableAgentMCPCommunication', () => {
    beforeEach(async () => {
      (mockBroker.registerService as Mock).mockResolvedValue(undefined);
      (mockBroker.getServiceHealth as Mock).mockResolvedValue({
        serviceId: testAgent.id,
        status: 'online',
        responseTime: 100,
        errorRate: 0,
      });
      await integration.registerAgentAsMCPService(testAgent);
    });

    it('should disable communication for registered agent', async () => {
      const result = await integration.disableAgentMCPCommunication(testAgent.id);

      expect(result).toBe(true);
    });

    it('should return false for non-existent agent', async () => {
      const result = await integration.disableAgentMCPCommunication('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('routeAgentMessage', () => {
    const sourceAgent = 'source-agent';
    const targetAgent = 'target-agent';
    const testMessage = { content: 'Hello from source agent' };

    beforeEach(async () => {
      (mockBroker.registerService as Mock).mockResolvedValue(undefined);

      // Register both agents
      await integration.registerAgentAsMCPService(testAgent);
      await integration.registerAgentAsMCPService({
        ...testAgent,
        id: targetAgent,
        name: 'Target Agent',
      });
    });

    it('should successfully route message between agents', async () => {
      (mockBroker.routeRequest as Mock).mockResolvedValue({
        jsonrpc: '2.0',
        id: 'test-id',
        result: { success: true },
      });

      const result = await integration.routeAgentMessage(sourceAgent, targetAgent, testMessage);

      expect(result.success).toBe(true);
      expect(result.routingInfo.fromAgentId).toBe(sourceAgent);
      expect(result.routingInfo.toAgentId).toBe(targetAgent);
      expect(result.response).toEqual({ success: true });
      expect(mockBroker.routeRequest).toHaveBeenCalledOnce();
    });

    it('should fail when target agent is not found', async () => {
      const result = await integration.routeAgentMessage(sourceAgent, 'non-existent', testMessage);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found or not registered');
      expect(mockBroker.routeRequest).not.toHaveBeenCalled();
    });

    it('should fail when target agent is inactive', async () => {
      // Set target agent as inactive
      await integration.updateAgentStatus(targetAgent, 'inactive' as any);

      const result = await integration.routeAgentMessage(sourceAgent, targetAgent, testMessage);

      expect(result.success).toBe(false);
      expect(result.error).toContain('is not active');
    });

    it('should retry on failure according to retry policy', async () => {
      (mockBroker.routeRequest as Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          jsonrpc: '2.0',
          id: 'test-id',
          result: { success: true },
        });

      const result = await integration.routeAgentMessage(sourceAgent, targetAgent, testMessage, {
        retryPolicy: {
          maxRetries: 1,
          backoffMs: 10,
          exponential: false,
        },
      });

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(1);
      expect(mockBroker.routeRequest).toHaveBeenCalledTimes(2);
    });

    it('should fail after exhausting retries', async () => {
      (mockBroker.routeRequest as Mock).mockRejectedValue(new Error('Persistent error'));

      const result = await integration.routeAgentMessage(sourceAgent, targetAgent, testMessage, {
        retryPolicy: {
          maxRetries: 1,
          backoffMs: 10,
          exponential: false,
        },
      });

      expect(result.success).toBe(false);
      expect(result.retryCount).toBe(2); // Initial attempt + 1 retry
      expect(result.error).toBe('Persistent error');
    });
  });

  describe('getAgentMCPCapabilities', () => {
    beforeEach(async () => {
      (mockBroker.registerService as Mock).mockResolvedValue(undefined);
      (mockBroker.getServiceHealth as Mock).mockResolvedValue({
        serviceId: testAgent.id,
        status: 'online',
        responseTime: 150,
        errorRate: 0.01,
      });
      await integration.registerAgentAsMCPService(testAgent);
    });

    it('should return capabilities for registered agent', async () => {
      const result = await integration.getAgentMCPCapabilities(testAgent.id);

      expect(result.agentId).toBe(testAgent.id);
      expect(result.capabilities).toHaveLength(3); // Default capabilities
      expect(result.resources).toEqual(testAgent.resources);
      expect(result.tools).toEqual(testAgent.tools);
      expect(result.compatibility.supported).toBe(true);
      expect(result.performance.responseTime).toBe(150);
      expect(result.performance.errorRate).toBe(0.01);
    });

    it('should throw error for non-existent agent', async () => {
      await expect(integration.getAgentMCPCapabilities('non-existent')).rejects.toThrow(
        'Agent non-existent not found'
      );
    });
  });

  describe('listAgentEndpoints', () => {
    it('should return empty array when no agents registered', async () => {
      const result = await integration.listAgentEndpoints();
      expect(result).toHaveLength(0);
    });

    it('should return all registered agent endpoints', async () => {
      (mockBroker.registerService as Mock).mockResolvedValue(undefined);

      await integration.registerAgentAsMCPService(testAgent);
      await integration.registerAgentAsMCPService({
        ...testAgent,
        id: 'agent-2',
        name: 'Agent 2',
      });

      const result = await integration.listAgentEndpoints();

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.agentId)).toContain(testAgent.id);
      expect(result.map((e) => e.agentId)).toContain('agent-2');
    });
  });

  describe('findAgentsByCapability', () => {
    beforeEach(async () => {
      (mockBroker.registerService as Mock).mockResolvedValue(undefined);
      await integration.registerAgentAsMCPService(testAgent);
    });

    it('should find agents with matching capability', async () => {
      const result = await integration.findAgentsByCapability('agent.communication');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testAgent.id);
    });

    it('should return empty array for non-matching capability', async () => {
      const result = await integration.findAgentsByCapability('non-existent-capability');

      expect(result).toHaveLength(0);
    });
  });

  describe('collaboration management', () => {
    it('should start and track collaboration', async () => {
      const participants = ['agent-1', 'agent-2'];
      const initiator = 'agent-1';
      const purpose = 'Test collaboration';

      const collaboration = await integration.startCollaboration(participants, initiator, purpose);

      expect(collaboration.participants).toEqual(participants);
      expect(collaboration.initiator).toBe(initiator);
      expect(collaboration.purpose).toBe(purpose);
      expect(collaboration.status).toBe('active');
    });

    it('should end collaboration', async () => {
      const collaboration = await integration.startCollaboration(
        ['agent-1', 'agent-2'],
        'agent-1',
        'Test'
      );

      const result = await integration.endCollaboration(collaboration.id);

      expect(result).toBe(true);
    });

    it('should return false when ending non-existent collaboration', async () => {
      const result = await integration.endCollaboration('non-existent');

      expect(result).toBe(false);
    });

    it('should get agent collaborations', async () => {
      const agentId = 'test-agent';

      await integration.startCollaboration([agentId, 'other-agent'], agentId, 'Test 1');

      await integration.startCollaboration(
        ['different-agent', 'another-agent'],
        'different-agent',
        'Test 2'
      );

      const collaborations = await integration.getAgentCollaborations(agentId);

      expect(collaborations).toHaveLength(1);
      expect(collaborations[0].participants).toContain(agentId);
    });
  });

  describe('agent status and health', () => {
    beforeEach(async () => {
      (mockBroker.registerService as Mock).mockResolvedValue(undefined);
      (mockBroker.getServiceHealth as Mock).mockResolvedValue({
        serviceId: testAgent.id,
        status: 'online',
        responseTime: 100,
        errorRate: 0.05,
      });
      await integration.registerAgentAsMCPService(testAgent);
    });

    it('should update agent status', async () => {
      const result = await integration.updateAgentStatus(testAgent.id, 'busy' as any);

      expect(result).toBe(true);
    });

    it('should return false for non-existent agent status update', async () => {
      const result = await integration.updateAgentStatus('non-existent', 'active' as any);

      expect(result).toBe(false);
    });

    it('should get agent health', async () => {
      const health = await integration.getAgentHealth(testAgent.id);

      expect(health.agentId).toBe(testAgent.id);
      expect(health.status).toBe('active');
      expect(health.responseTime).toBe(100);
      expect(health.errorRate).toBe(0.05);
      expect(health.availability).toBeGreaterThan(0);
    });

    it('should throw error for non-existent agent health', async () => {
      await expect(integration.getAgentHealth('non-existent')).rejects.toThrow(
        'Agent non-existent not found'
      );
    });

    it('should send agent heartbeat', async () => {
      const result = await integration.sendAgentHeartbeat(testAgent.id);

      expect(result).toBe(true);
    });

    it('should return false for non-existent agent heartbeat', async () => {
      const result = await integration.sendAgentHeartbeat('non-existent');

      expect(result).toBe(false);
    });
  });
});
