/**
 * Agent Lifecycle End-to-End Tests
 *
 * Comprehensive testing of complete agent lifecycle:
 * 1. Registration
 * 2. Onboarding
 * 3. Discovery
 * 4. Task Execution
 * 5. Communication
 * 6. Workflow Participation
 * 7. Graceful Shutdown
 */

import { test, expect } from '@playwright/test';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3004';
const WS_URL = process.env.WS_URL || 'ws://localhost:3004';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  capabilities: string[];
  metadata?: Record<string, any>;
}

interface Task {
  id: string;
  agentId: string;
  status: string;
  result?: any;
}

test.describe('Agent Lifecycle - Complete Journey', () => {
  let agentId: string;
  let apiKey: string;
  let wsClient: Socket;
  let authToken: string;

  test.beforeAll(async () => {
    // Setup authentication
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`, {
      test: true
    });
    authToken = authResponse.data.token;
    apiKey = authResponse.data.apiKey || 'test_api_key_' + Date.now();
  });

  test.afterAll(async () => {
    // Cleanup
    if (wsClient?.connected) {
      wsClient.disconnect();
    }
  });

  test('Step 1: Agent Registration', async () => {
    const agentData = {
      name: 'E2E Test Agent - Developer',
      type: 'developer',
      capabilities: [
        'code-generation',
        'debugging',
        'testing',
        'code-review',
        'documentation'
      ],
      metadata: {
        version: '1.0.0',
        provider: 'OpenAI',
        model: 'gpt-4',
        maxTokens: 4096,
        temperature: 0.7,
        specialty: 'full-stack-development'
      }
    };

    const response = await axios.post(
      `${API_BASE_URL}/agents/register`,
      agentData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('name', agentData.name);
    expect(response.data).toHaveProperty('status', 'active');

    agentId = response.data.id;

    console.log('✅ Agent registered successfully:', agentId);
  });

  test('Step 2: Agent Onboarding - Receive System Info', async () => {
    // Agent receives onboarding information
    const onboardingResponse = await axios.get(
      `${API_BASE_URL}/agents/${agentId}/onboarding`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    expect(onboardingResponse.status).toBe(200);
    expect(onboardingResponse.data).toHaveProperty('systemInfo');
    expect(onboardingResponse.data).toHaveProperty('availableProtocols');
    expect(onboardingResponse.data).toHaveProperty('messagingEndpoints');

    // Verify onboarding includes necessary information
    expect(onboardingResponse.data.availableProtocols).toContain('mcp');
    expect(onboardingResponse.data.availableProtocols).toContain('websocket');
    expect(onboardingResponse.data.availableProtocols).toContain('redis');

    console.log('✅ Agent onboarding complete');
  });

  test('Step 3: Agent Discovery - Find Other Agents', async () => {
    // First, register a few more agents for discovery
    const agentTypes = [
      { name: 'Designer Agent', type: 'designer', capabilities: ['ui-design', 'ux-research'] },
      { name: 'QA Agent', type: 'tester', capabilities: ['testing', 'qa', 'automation'] },
      { name: 'DevOps Agent', type: 'devops', capabilities: ['deployment', 'monitoring', 'ci-cd'] }
    ];

    for (const agentType of agentTypes) {
      await axios.post(
        `${API_BASE_URL}/agents/register`,
        agentType,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-API-Key': apiKey
          }
        }
      );
    }

    // Now discover agents
    const discoveryResponse = await axios.get(
      `${API_BASE_URL}/agents/discover`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        },
        params: {
          status: 'active'
        }
      }
    );

    expect(discoveryResponse.status).toBe(200);
    expect(discoveryResponse.data.agents).toBeDefined();
    expect(discoveryResponse.data.agents.length).toBeGreaterThanOrEqual(4);

    // Find specific capabilities
    const codingAgents = await axios.get(
      `${API_BASE_URL}/agents/discover`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        },
        params: {
          capability: 'code-generation'
        }
      }
    );

    expect(codingAgents.data.agents.length).toBeGreaterThan(0);

    console.log('✅ Agent discovery successful - found', discoveryResponse.data.agents.length, 'agents');
  });

  test('Step 4: Agent Executes Task', async () => {
    // Assign a task to the agent
    const taskData = {
      agentId: agentId,
      type: 'code-generation',
      description: 'Generate a simple TypeScript function to calculate factorial',
      priority: 'high',
      timeout: 30000,
      input: {
        language: 'typescript',
        functionality: 'factorial calculator',
        includeTests: true
      }
    };

    const taskResponse = await axios.post(
      `${BACKEND_URL}/tasks/create`,
      taskData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    expect(taskResponse.status).toBe(201);
    const taskId = taskResponse.data.id;

    // Poll for task completion
    let taskCompleted = false;
    let attempts = 0;
    let taskResult;

    while (!taskCompleted && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await axios.get(
        `${BACKEND_URL}/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-API-Key': apiKey
          }
        }
      );

      if (statusResponse.data.status === 'completed') {
        taskCompleted = true;
        taskResult = statusResponse.data;
      } else if (statusResponse.data.status === 'failed') {
        throw new Error('Task failed: ' + JSON.stringify(statusResponse.data.error));
      }

      attempts++;
    }

    expect(taskCompleted).toBe(true);
    expect(taskResult.result).toBeDefined();

    console.log('✅ Agent executed task successfully');
  });

  test('Step 5: Agent Communication via Chat', async () => {
    // Establish WebSocket connection for real-time chat
    wsClient = io(WS_URL, {
      auth: {
        token: authToken,
        agentId: agentId
      }
    });

    await new Promise<void>((resolve, reject) => {
      wsClient.on('connect', () => {
        console.log('✅ WebSocket connected');
        resolve();
      });

      wsClient.on('connect_error', (error) => {
        reject(error);
      });

      setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    });

    // Create a chat room
    const roomResponse = await axios.post(
      `${BACKEND_URL}/chat/rooms`,
      {
        name: 'Agent Collaboration Room',
        participants: [agentId],
        type: 'agent-chat'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    const roomId = roomResponse.data.id;

    // Send a message
    const messagePromise = new Promise<void>((resolve) => {
      wsClient.on('message:received', (data) => {
        expect(data.message).toContain('Hello from agent');
        resolve();
      });
    });

    wsClient.emit('message:send', {
      roomId: roomId,
      message: 'Hello from agent ' + agentId,
      agentId: agentId
    });

    await messagePromise;

    console.log('✅ Agent communication via chat successful');
  });

  test('Step 6: Agent Participates in Workflow', async () => {
    // Create a workflow that includes our agent
    const workflowData = {
      name: 'E2E Test Workflow - Code Review Process',
      description: 'Complete code review workflow with multiple agents',
      nodes: [
        {
          id: 'start',
          type: 'start',
          data: {
            label: 'Start Code Review'
          }
        },
        {
          id: 'agent-code-gen',
          type: 'agent',
          data: {
            agentId: agentId,
            action: 'code-generation',
            input: '${workflow.input.codeRequest}'
          }
        },
        {
          id: 'agent-review',
          type: 'agent',
          data: {
            agentType: 'tester',
            action: 'code-review',
            input: '${nodes.agent-code-gen.output}'
          }
        },
        {
          id: 'end',
          type: 'end',
          data: {
            output: '${nodes.agent-review.output}'
          }
        }
      ],
      edges: [
        { source: 'start', target: 'agent-code-gen' },
        { source: 'agent-code-gen', target: 'agent-review' },
        { source: 'agent-review', target: 'end' }
      ]
    };

    const workflowResponse = await axios.post(
      `${BACKEND_URL}/workflows/create`,
      workflowData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    expect(workflowResponse.status).toBe(201);
    const workflowId = workflowResponse.data.id;

    // Execute the workflow
    const executionResponse = await axios.post(
      `${BACKEND_URL}/workflows/${workflowId}/execute`,
      {
        input: {
          codeRequest: 'Create a function to reverse a string'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    const executionId = executionResponse.data.executionId;

    // Wait for workflow completion
    let workflowCompleted = false;
    let attempts = 0;

    while (!workflowCompleted && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await axios.get(
        `${BACKEND_URL}/workflows/executions/${executionId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-API-Key': apiKey
          }
        }
      );

      if (statusResponse.data.status === 'completed') {
        workflowCompleted = true;
        expect(statusResponse.data.result).toBeDefined();
      } else if (statusResponse.data.status === 'failed') {
        throw new Error('Workflow failed');
      }

      attempts++;
    }

    expect(workflowCompleted).toBe(true);

    console.log('✅ Agent participated in workflow successfully');
  });

  test('Step 7: Agent Goes Offline Gracefully', async () => {
    // Update agent status to offline
    const offlineResponse = await axios.patch(
      `${API_BASE_URL}/agents/${agentId}/status`,
      {
        status: 'offline',
        reason: 'Graceful shutdown for testing'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    expect(offlineResponse.status).toBe(200);
    expect(offlineResponse.data.status).toBe('offline');

    // Verify agent no longer appears in active discovery
    const discoveryResponse = await axios.get(
      `${API_BASE_URL}/agents/discover`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        },
        params: {
          status: 'active'
        }
      }
    );

    const agentStillActive = discoveryResponse.data.agents.find(
      (a: Agent) => a.id === agentId
    );

    expect(agentStillActive).toBeUndefined();

    // Disconnect WebSocket
    if (wsClient?.connected) {
      wsClient.disconnect();
    }

    // Verify graceful shutdown metrics
    const metricsResponse = await axios.get(
      `${API_BASE_URL}/agents/${agentId}/metrics`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    expect(metricsResponse.data).toHaveProperty('lastSeen');
    expect(metricsResponse.data).toHaveProperty('totalTasksCompleted');
    expect(metricsResponse.data).toHaveProperty('uptime');

    console.log('✅ Agent went offline gracefully');
    console.log('📊 Agent Metrics:', {
      totalTasksCompleted: metricsResponse.data.totalTasksCompleted,
      uptime: metricsResponse.data.uptime,
      successRate: metricsResponse.data.successRate
    });
  });
});

test.describe('Agent Lifecycle - Edge Cases', () => {
  let authToken: string;
  let apiKey: string;

  test.beforeAll(async () => {
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`, {
      test: true
    });
    authToken = authResponse.data.token;
    apiKey = authResponse.data.apiKey || 'test_api_key_' + Date.now();
  });

  test('Should handle duplicate registration attempts', async () => {
    const agentData = {
      name: 'Duplicate Test Agent',
      type: 'developer',
      capabilities: ['testing']
    };

    // Register once
    const firstResponse = await axios.post(
      `${API_BASE_URL}/agents/register`,
      agentData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    expect(firstResponse.status).toBe(201);

    // Try to register again with same name
    try {
      await axios.post(
        `${API_BASE_URL}/agents/register`,
        agentData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-API-Key': apiKey
          }
        }
      );
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(409); // Conflict
    }
  });

  test('Should handle agent status transitions', async () => {
    const agentData = {
      name: 'Status Transition Agent',
      type: 'developer',
      capabilities: ['testing']
    };

    const createResponse = await axios.post(
      `${API_BASE_URL}/agents/register`,
      agentData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    const agentId = createResponse.data.id;
    const statuses = ['busy', 'idle', 'error', 'offline', 'active'];

    for (const status of statuses) {
      const response = await axios.patch(
        `${API_BASE_URL}/agents/${agentId}/status`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-API-Key': apiKey
          }
        }
      );

      expect(response.data.status).toBe(status);
    }
  });
});
