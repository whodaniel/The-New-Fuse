/**
 * MCP Integration Tests
 *
 * Tests the complete MCP integration including:
 * - Server startup and tool registration
 * - Client connections and tool calls
 * - Agent-to-agent communication
 * - MCP-A2A bridge functionality
 * - Multi-agent coordination scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MCPModule } from '../mcp.module';
import { MCPServerService } from '../mcp-server.service';
import { MCPToolRegistry } from '../mcp-tool-registry.service';
import { MCPA2ABridge } from '../mcp-a2a-bridge.service';
import { MCPClient } from '@the-new-fuse/mcp-core/client';

describe('MCP Integration Tests', () => {
  let module: TestingModule;
  let mcpServer: MCPServerService;
  let toolRegistry: MCPToolRegistry;
  let bridge: MCPA2ABridge;
  let client: MCPClient;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MCPModule],
    }).compile();

    mcpServer = module.get<MCPServerService>(MCPServerService);
    toolRegistry = module.get<MCPToolRegistry>(MCPToolRegistry);
    bridge = module.get<MCPA2ABridge>(MCPA2ABridge);

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create client
    client = new MCPClient({
      name: 'test-client',
      version: '1.0.0',
      timeout: 10000,
    });

    await client.connect('ws://localhost:3100');
  });

  afterAll(async () => {
    await client.disconnect();
    await module.close();
  });

  describe('Server Initialization', () => {
    it('should start MCP server successfully', async () => {
      const status = await mcpServer.getServerStatus();
      expect(status).toBeDefined();
      expect(status.server).toBeDefined();
      expect(status.server.name).toBe('the-new-fuse-mcp-server');
    });

    it('should register all tools', async () => {
      const tools = toolRegistry.getAllTools();
      expect(tools.length).toBeGreaterThanOrEqual(15); // We defined 15+ tools
    });

    it('should have tool groups', () => {
      const groups = toolRegistry.getToolGroups();
      expect(groups).toContain('workflow');
      expect(groups).toContain('task');
      expect(groups).toContain('agent');
      expect(groups).toContain('resource');
      expect(groups).toContain('communication');
      expect(groups).toContain('system');
    });
  });

  describe('Tool Execution', () => {
    it('should execute workflow.list tool', async () => {
      const response = await client.callTool('workflow.list', {
        limit: 10,
      });

      expect(response).toBeDefined();
      expect(response.result).toBeDefined();
      expect(response.result.workflows).toBeDefined();
      expect(Array.isArray(response.result.workflows)).toBe(true);
    });

    it('should execute workflow.create tool', async () => {
      const response = await client.callTool('workflow.create', {
        name: 'Test Workflow',
        description: 'A test workflow',
      });

      expect(response).toBeDefined();
      expect(response.result.success).toBe(true);
      expect(response.result.workflowId).toBeDefined();
    });

    it('should execute task.create tool', async () => {
      const response = await client.callTool('task.create', {
        title: 'Test Task',
        assignedTo: 'test_agent',
        priority: 'normal',
      });

      expect(response).toBeDefined();
      expect(response.result.success).toBe(true);
      expect(response.result.taskId).toBeDefined();
    });

    it('should execute agent.discover tool', async () => {
      const response = await client.callTool('agent.discover', {
        status: 'active',
      });

      expect(response).toBeDefined();
      expect(response.result.agents).toBeDefined();
      expect(Array.isArray(response.result.agents)).toBe(true);
    });

    it('should execute system.health tool', async () => {
      const response = await client.callTool('system.health', {});

      expect(response).toBeDefined();
      expect(response.result.status).toBe('healthy');
      expect(response.result.services).toBeDefined();
    });
  });

  describe('Resource Access', () => {
    it('should read workflows resource', async () => {
      const response = await client.readResource('fuse://workflows');

      expect(response).toBeDefined();
      expect(response.contents).toBeDefined();
      expect(response.contents.length).toBeGreaterThan(0);
    });

    it('should read agents resource', async () => {
      const response = await client.readResource('fuse://agents');

      expect(response).toBeDefined();
      expect(response.contents).toBeDefined();
    });

    it('should read status resource', async () => {
      const response = await client.readResource('fuse://status');

      expect(response).toBeDefined();
      expect(response.contents).toBeDefined();
    });

    it('should list all resources', async () => {
      const response = await client.callTool('resource.list', {});

      expect(response).toBeDefined();
      expect(response.result.resources).toBeDefined();
      expect(response.result.resources.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('MCP-A2A Bridge', () => {
    it('should register A2A agent', async () => {
      const result = await bridge.registerA2AAgent({
        id: 'test_agent_001',
        name: 'Test Agent',
        capabilities: ['testing', 'data_processing'],
        tools: ['process_data', 'validate_data'],
      });

      expect(result.success).toBe(true);
      expect(result.endpoint).toBeDefined();
    });

    it('should discover registered agents', async () => {
      const agents = await bridge.discoverAgents({
        protocol: 'all',
        status: 'all',
      });

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    it('should route message between agents', async () => {
      // Register two agents
      await bridge.registerA2AAgent({
        id: 'sender_agent',
        name: 'Sender Agent',
        capabilities: ['messaging'],
      });

      await bridge.registerA2AAgent({
        id: 'receiver_agent',
        name: 'Receiver Agent',
        capabilities: ['messaging'],
      });

      // Route message
      const result = await bridge.routeA2AToMCP(
        'sender_agent',
        'receiver_agent',
        { text: 'Hello from sender!' },
        {
          messageType: 'request',
          priority: 'normal',
        }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should start collaboration', async () => {
      const result = await bridge.startCollaboration(
        ['test_agent_001', 'sender_agent', 'receiver_agent'],
        'test_agent_001',
        'Integration test collaboration'
      );

      expect(result.success).toBe(true);
      expect(result.collaborationId).toBeDefined();
    });

    it('should get bridge stats', async () => {
      const stats = await bridge.getBridgeStats();

      expect(stats).toBeDefined();
      expect(stats.registeredAgents).toBeGreaterThan(0);
      expect(stats.mcpAgents).toBeDefined();
      expect(stats.a2aAgents).toBeDefined();
    });
  });

  describe('Multi-Agent Coordination', () => {
    it('should coordinate workflow execution across agents', async () => {
      // Register coordinator agent
      await bridge.registerA2AAgent({
        id: 'coordinator',
        name: 'Coordinator Agent',
        capabilities: ['workflow_coordination'],
      });

      // Register worker agents
      await bridge.registerA2AAgent({
        id: 'worker_1',
        name: 'Worker 1',
        capabilities: ['data_processing'],
      });

      await bridge.registerA2AAgent({
        id: 'worker_2',
        name: 'Worker 2',
        capabilities: ['api_integration'],
      });

      // Create workflow
      const workflowResponse = await client.callTool('workflow.create', {
        name: 'Multi-Agent Test Workflow',
        description: 'Test workflow for multi-agent coordination',
      });

      expect(workflowResponse.result.success).toBe(true);

      // Create tasks for workers
      const task1 = await client.callTool('task.create', {
        title: 'Process Data',
        assignedTo: 'worker_1',
        priority: 'normal',
      });

      const task2 = await client.callTool('task.create', {
        title: 'Fetch API Data',
        assignedTo: 'worker_2',
        priority: 'normal',
      });

      expect(task1.result.success).toBe(true);
      expect(task2.result.success).toBe(true);

      // Start collaboration
      const collaboration = await bridge.startCollaboration(
        ['coordinator', 'worker_1', 'worker_2'],
        'coordinator',
        'Execute multi-agent workflow'
      );

      expect(collaboration.success).toBe(true);
    });

    it('should broadcast message to multiple agents', async () => {
      const response = await client.callTool('communication.broadcast', {
        message: 'Test broadcast message',
        targets: ['coordinator', 'worker_1', 'worker_2'],
        priority: 'normal',
      });

      expect(response.result.success).toBe(true);
      expect(response.result.broadcastId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool name', async () => {
      await expect(
        client.callTool('invalid.tool', {})
      ).rejects.toThrow();
    });

    it('should handle missing required parameters', async () => {
      await expect(
        client.callTool('task.create', {
          // Missing required 'title' and 'assignedTo'
        })
      ).rejects.toThrow();
    });

    it('should handle non-existent resource', async () => {
      await expect(
        client.readResource('fuse://nonexistent')
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent tool calls', async () => {
      const calls = Array.from({ length: 10 }, (_, i) =>
        client.callTool('system.health', {})
      );

      const results = await Promise.all(calls);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.result.status).toBe('healthy');
      });
    });

    it('should handle rapid sequential calls', async () => {
      const results = [];

      for (let i = 0; i < 20; i++) {
        const result = await client.callTool('agent.discover', {
          status: 'active',
        });
        results.push(result);
      }

      expect(results).toHaveLength(20);
    });
  });
});

/**
 * Load test (optional - run separately)
 */
describe('MCP Load Tests', () => {
  // These tests can be skipped in normal test runs
  const isLoadTest = process.env.RUN_LOAD_TESTS === 'true';

  (isLoadTest ? it : it.skip)(
    'should handle 100 concurrent connections',
    async () => {
      const clients: MCPClient[] = [];

      // Create 100 clients
      for (let i = 0; i < 100; i++) {
        const testClient = new MCPClient({
          name: `load-test-client-${i}`,
          version: '1.0.0',
          timeout: 10000,
        });
        await testClient.connect('ws://localhost:3100');
        clients.push(testClient);
      }

      // Each client makes a request
      const calls = clients.map((c) =>
        c.callTool('system.health', {})
      );

      const results = await Promise.all(calls);

      expect(results).toHaveLength(100);

      // Disconnect all clients
      await Promise.all(clients.map((c) => c.disconnect()));
    },
    60000 // 60 second timeout
  );
});
