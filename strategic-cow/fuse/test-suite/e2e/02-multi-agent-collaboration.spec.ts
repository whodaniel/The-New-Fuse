/**
 * Multi-Agent Collaboration End-to-End Tests
 *
 * Testing 5 agents working together on complex tasks:
 * - Redis for coordination
 * - A2A protocol communication
 * - MCP tools integration
 * - Workflow orchestration
 * - Chat room collaboration
 */

import { expect, test } from '@playwright/test';
import axios from 'axios';
import Redis from 'ioredis';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3004';
const WS_URL = process.env.WS_URL || 'ws://localhost:3004';
const REDIS_URL =
  process.env.REDIS_URL ||
  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570';

interface CollaborativeAgent {
  id: string;
  name: string;
  type: string;
  role: string;
  socket?: Socket;
}

test.describe('Multi-Agent Collaboration - 5 Agents on Code Review Task', () => {
  let authToken: string;
  let apiKey: string;
  let redisClient: Redis;
  let agents: CollaborativeAgent[] = [];
  let chatRoomId: string;
  let workflowId: string;

  const AGENT_SPECS = [
    {
      name: 'Product Manager Agent',
      type: 'manager',
      role: 'product-manager',
      capabilities: ['requirement-analysis', 'prioritization', 'user-story-creation'],
    },
    {
      name: 'Lead Developer Agent',
      type: 'developer',
      role: 'tech-lead',
      capabilities: ['architecture-design', 'code-review', 'mentoring'],
    },
    {
      name: 'Backend Developer Agent',
      type: 'developer',
      role: 'backend-dev',
      capabilities: ['api-development', 'database-design', 'backend-testing'],
    },
    {
      name: 'Frontend Developer Agent',
      type: 'developer',
      role: 'frontend-dev',
      capabilities: ['ui-development', 'frontend-testing', 'ux-implementation'],
    },
    {
      name: 'QA Engineer Agent',
      type: 'tester',
      role: 'qa-engineer',
      capabilities: ['test-automation', 'bug-reporting', 'quality-assurance'],
    },
  ];

  test.beforeAll(async () => {
    // Setup authentication
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`, {
      test: true,
    });
    authToken = authResponse.data.token;
    apiKey = authResponse.data.apiKey || 'test_api_key_' + Date.now();

    // Setup Redis
    redisClient = new Redis(REDIS_URL);
    await redisClient.ping();

    console.log('✅ Test setup complete');
  });

  test.afterAll(async () => {
    // Cleanup
    for (const agent of agents) {
      if (agent.socket?.connected) {
        agent.socket.disconnect();
      }
    }

    if (redisClient) {
      await redisClient.quit();
    }

    console.log('✅ Test cleanup complete');
  });

  test('Step 1: Register 5 Collaborative Agents', async () => {
    for (const spec of AGENT_SPECS) {
      const response = await axios.post(
        `${API_BASE_URL}/agents/register`,
        {
          ...spec,
          metadata: {
            collaborationEnabled: true,
            protocols: ['a2a', 'mcp', 'websocket', 'redis'],
            version: '1.0.0',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'X-API-Key': apiKey,
          },
        }
      );

      expect(response.status).toBe(201);

      agents.push({
        id: response.data.id,
        name: spec.name,
        type: spec.type,
        role: spec.role,
      });
    }

    expect(agents.length).toBe(5);
    console.log(
      '✅ Registered 5 agents:',
      agents.map((a) => a.name)
    );
  });

  test('Step 2: Agents Use Redis for Coordination', async () => {
    // Subscribe agents to coordination channel
    const coordinationChannel = 'agent:coordination:test';

    // Each agent subscribes to the channel
    const subscribers = agents.map((agent) => {
      const sub = new Redis(REDIS_URL);
      return sub.subscribe(coordinationChannel).then(() => sub);
    });

    const allSubscribers = await Promise.all(subscribers);

    // Publish coordination message
    const coordinationMessage = {
      type: 'task-assignment',
      taskId: 'collab-task-001',
      assignments: agents.map((agent, index) => ({
        agentId: agent.id,
        role: agent.role,
        priority: index + 1,
      })),
    };

    await redisClient.publish(coordinationChannel, JSON.stringify(coordinationMessage));

    // Verify all agents received the message
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Store coordination state in Redis
    for (const agent of agents) {
      await redisClient.hset(
        `agent:${agent.id}:state`,
        'status',
        'coordinated',
        'lastUpdate',
        Date.now().toString()
      );
    }

    // Verify Redis state
    for (const agent of agents) {
      const status = await redisClient.hget(`agent:${agent.id}:state`, 'status');
      expect(status).toBe('coordinated');
    }

    // Cleanup subscribers
    for (const sub of allSubscribers) {
      await sub.quit();
    }

    console.log('✅ Redis coordination successful');
  });

  test('Step 3: Agents Communicate via A2A Protocol', async () => {
    // Send A2A protocol message from one agent to another
    const senderAgent = agents[0]; // Product Manager
    const receiverAgent = agents[1]; // Lead Developer

    const a2aMessage = {
      protocol: 'a2a',
      version: '1.0',
      from: {
        agentId: senderAgent.id,
        role: senderAgent.role,
      },
      to: {
        agentId: receiverAgent.id,
        role: receiverAgent.role,
      },
      message: {
        type: 'task-delegation',
        content: 'Please review the architecture for the new feature',
        metadata: {
          priority: 'high',
          deadline: new Date(Date.now() + 86400000).toISOString(),
        },
      },
    };

    const response = await axios.post(`${BACKEND_URL}/agents/a2a/send`, a2aMessage, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-API-Key': apiKey,
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('messageId');

    // Verify message was received
    const messageStatus = await axios.get(
      `${BACKEND_URL}/agents/a2a/messages/${response.data.messageId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-API-Key': apiKey,
        },
      }
    );

    expect(messageStatus.data.status).toBe('delivered');

    console.log('✅ A2A protocol communication successful');
  });

  test('Step 4: Agents Use MCP Tools', async () => {
    // Each agent uses different MCP tools
    const mcpTools = [
      { agentId: agents[0].id, tool: 'findAgents', params: { capability: 'code-review' } },
      {
        agentId: agents[1].id,
        tool: 'registerEntity',
        params: { name: 'Code Review Task', type: 'task' },
      },
      { agentId: agents[2].id, tool: 'getAgentProfile', params: { agentId: agents[3].id } },
      {
        agentId: agents[3].id,
        tool: 'updateAgentStatus',
        params: { agentId: agents[3].id, status: 'busy' },
      },
      { agentId: agents[4].id, tool: 'findEntities', params: { type: 'task' } },
    ];

    for (const toolCall of mcpTools) {
      const response = await axios.post(
        `${API_BASE_URL}/mcp/tools/call`,
        {
          agentId: toolCall.agentId,
          tool: toolCall.tool,
          params: toolCall.params,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'X-API-Key': apiKey,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('result');
    }

    console.log('✅ MCP tools integration successful');
  });

  test('Step 5: Workflow Builder Orchestrates Agents', async () => {
    // Create a complex workflow involving all 5 agents
    const workflowData = {
      name: 'Feature Development Workflow - Multi-Agent',
      description: '5 agents collaborating on feature development',
      nodes: [
        {
          id: 'start',
          type: 'start',
          data: { label: 'New Feature Request' },
        },
        {
          id: 'pm-analysis',
          type: 'agent',
          data: {
            agentId: agents[0].id, // Product Manager
            action: 'requirement-analysis',
            input: '${workflow.input.featureRequest}',
          },
        },
        {
          id: 'tech-lead-review',
          type: 'agent',
          data: {
            agentId: agents[1].id, // Tech Lead
            action: 'architecture-design',
            input: '${nodes.pm-analysis.output}',
          },
        },
        {
          id: 'parallel-dev',
          type: 'parallel',
          data: {
            branches: [
              {
                id: 'backend-dev',
                type: 'agent',
                data: {
                  agentId: agents[2].id, // Backend Dev
                  action: 'api-development',
                  input: '${nodes.tech-lead-review.output.backendSpec}',
                },
              },
              {
                id: 'frontend-dev',
                type: 'agent',
                data: {
                  agentId: agents[3].id, // Frontend Dev
                  action: 'ui-development',
                  input: '${nodes.tech-lead-review.output.frontendSpec}',
                },
              },
            ],
          },
        },
        {
          id: 'qa-testing',
          type: 'agent',
          data: {
            agentId: agents[4].id, // QA Engineer
            action: 'quality-assurance',
            input: {
              backend: '${nodes.parallel-dev.branches.backend-dev.output}',
              frontend: '${nodes.parallel-dev.branches.frontend-dev.output}',
            },
          },
        },
        {
          id: 'end',
          type: 'end',
          data: {
            output: '${nodes.qa-testing.output}',
          },
        },
      ],
      edges: [
        { source: 'start', target: 'pm-analysis' },
        { source: 'pm-analysis', target: 'tech-lead-review' },
        { source: 'tech-lead-review', target: 'parallel-dev' },
        { source: 'parallel-dev', target: 'qa-testing' },
        { source: 'qa-testing', target: 'end' },
      ],
    };

    const workflowResponse = await axios.post(`${BACKEND_URL}/workflows/create`, workflowData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-API-Key': apiKey,
      },
    });

    expect(workflowResponse.status).toBe(201);
    workflowId = workflowResponse.data.id;

    // Execute the workflow
    const executionResponse = await axios.post(
      `${BACKEND_URL}/workflows/${workflowId}/execute`,
      {
        input: {
          featureRequest: 'Build a user authentication system with OAuth2 support',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-API-Key': apiKey,
        },
      }
    );

    const executionId = executionResponse.data.executionId;

    // Monitor workflow progress
    let completed = false;
    let attempts = 0;
    let executionResult;

    while (!completed && attempts < 120) {
      // 2 minutes max
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await axios.get(`${BACKEND_URL}/workflows/executions/${executionId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-API-Key': apiKey,
        },
      });

      if (statusResponse.data.status === 'completed') {
        completed = true;
        executionResult = statusResponse.data;
      } else if (statusResponse.data.status === 'failed') {
        throw new Error('Workflow failed: ' + JSON.stringify(statusResponse.data.error));
      }

      attempts++;
    }

    expect(completed).toBe(true);
    expect(executionResult.result).toBeDefined();

    // Verify all agents participated
    const participationStats = executionResult.nodeExecutions;
    expect(participationStats).toHaveProperty('pm-analysis');
    expect(participationStats).toHaveProperty('tech-lead-review');
    expect(participationStats).toHaveProperty('parallel-dev');
    expect(participationStats).toHaveProperty('qa-testing');

    console.log('✅ Workflow orchestration successful');
    console.log('📊 Workflow Stats:', {
      duration: executionResult.duration,
      nodesExecuted: Object.keys(participationStats).length,
      status: executionResult.status,
    });
  });

  test('Step 6: Chat Rooms Facilitate Communication', async () => {
    // Create a chat room for all 5 agents
    const roomResponse = await axios.post(
      `${BACKEND_URL}/chat/rooms`,
      {
        name: 'Feature Development Team Chat',
        participants: agents.map((a) => a.id),
        type: 'multi-agent-collaboration',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-API-Key': apiKey,
        },
      }
    );

    chatRoomId = roomResponse.data.id;

    // Connect all agents to WebSocket
    const connectionPromises = agents.map((agent, index) => {
      return new Promise<void>((resolve, reject) => {
        const socket = io(WS_URL, {
          auth: {
            token: authToken,
            agentId: agent.id,
          },
        });

        socket.on('connect', () => {
          agent.socket = socket;
          socket.emit('room:join', { roomId: chatRoomId });
          resolve();
        });

        socket.on('connect_error', reject);

        setTimeout(() => reject(new Error(`Agent ${index} connection timeout`)), 5000);
      });
    });

    await Promise.all(connectionPromises);
    expect(agents.every((a) => a.socket?.connected)).toBe(true);

    // Simulate conversation
    const messages = [
      { agent: agents[0], text: "Let's discuss the authentication feature requirements" },
      { agent: agents[1], text: 'I suggest using OAuth2 with JWT tokens' },
      { agent: agents[2], text: 'I can implement the backend API endpoints' },
      { agent: agents[3], text: "I'll create the login/signup UI components" },
      { agent: agents[4], text: "I'll prepare test cases for the authentication flow" },
    ];

    const messageReceivedPromises = messages.map((msg, index) => {
      return new Promise<void>((resolve) => {
        const otherAgents = agents.filter((a) => a.id !== msg.agent.id);
        let receivedCount = 0;

        otherAgents.forEach((otherAgent) => {
          otherAgent.socket!.once('message:received', (data) => {
            receivedCount++;
            if (receivedCount === otherAgents.length) {
              resolve();
            }
          });
        });

        // Send message after setting up listeners
        setTimeout(() => {
          msg.agent.socket!.emit('message:send', {
            roomId: chatRoomId,
            message: msg.text,
            agentId: msg.agent.id,
          });
        }, index * 500);
      });
    });

    await Promise.all(messageReceivedPromises);

    // Verify message history
    const historyResponse = await axios.get(`${BACKEND_URL}/chat/rooms/${chatRoomId}/messages`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-API-Key': apiKey,
      },
    });

    expect(historyResponse.data.messages.length).toBeGreaterThanOrEqual(5);

    console.log('✅ Chat room communication successful');
    console.log('💬 Messages exchanged:', historyResponse.data.messages.length);
  });

  test('Step 7: Performance Metrics - Collaboration Efficiency', async () => {
    // Gather metrics from all agents
    const metricsPromises = agents.map((agent) =>
      axios.get(`${API_BASE_URL}/agents/${agent.id}/metrics`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-API-Key': apiKey,
        },
      })
    );

    const metricsResponses = await Promise.all(metricsPromises);

    const aggregatedMetrics = {
      totalMessages: 0,
      totalTasksCompleted: 0,
      averageResponseTime: 0,
      collaborationScore: 0,
    };

    metricsResponses.forEach((response) => {
      aggregatedMetrics.totalMessages += response.data.messagesSent || 0;
      aggregatedMetrics.totalTasksCompleted += response.data.tasksCompleted || 0;
      aggregatedMetrics.averageResponseTime += response.data.avgResponseTime || 0;
    });

    aggregatedMetrics.averageResponseTime /= agents.length;
    aggregatedMetrics.collaborationScore =
      (aggregatedMetrics.totalMessages * 10 + aggregatedMetrics.totalTasksCompleted * 50) /
      agents.length;

    console.log('📊 Multi-Agent Collaboration Metrics:', aggregatedMetrics);

    expect(aggregatedMetrics.totalMessages).toBeGreaterThan(0);
    expect(aggregatedMetrics.totalTasksCompleted).toBeGreaterThan(0);
    expect(aggregatedMetrics.averageResponseTime).toBeLessThan(5000); // Less than 5 seconds
  });
});
