/**
 * Load Testing Suite
 *
 * Testing system under heavy load:
 * - 10+ agents running simultaneously
 * - 100+ messages per second
 * - Workflows with 20+ nodes
 * - Multiple concurrent workflows
 * - Database performance under load
 */

import { test, expect } from '@playwright/test';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import Redis from 'ioredis';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3004';
const WS_URL = process.env.WS_URL || 'ws://localhost:3004';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const NUM_AGENTS = 15;
const MESSAGES_PER_SECOND = 120;
const TEST_DURATION_SECONDS = 60;
const WORKFLOW_NODES = 25;
const CONCURRENT_WORKFLOWS = 5;

interface LoadTestAgent {
  id: string;
  name: string;
  socket?: Socket;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
}

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughput: number;
  errorRate: number;
}

test.describe('Load Testing - High Concurrency', () => {
  let authToken: string;
  let apiKey: string;
  let agents: LoadTestAgent[] = [];
  let redisClient: Redis;
  let performanceMetrics: PerformanceMetrics;

  test.setTimeout(300000); // 5 minutes timeout for load tests

  test.beforeAll(async () => {
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`, {
      test: true
    });
    authToken = authResponse.data.token;
    apiKey = authResponse.data.apiKey || 'test_api_key_' + Date.now();

    redisClient = new Redis(REDIS_URL);

    performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      throughput: 0,
      errorRate: 0
    };

    console.log('🚀 Starting load test setup...');
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

    console.log('✅ Load test cleanup complete');
  });

  test('Load Test 1: Register 15 Agents Simultaneously', async () => {
    console.log(`📝 Registering ${NUM_AGENTS} agents...`);

    const startTime = Date.now();
    const registrationPromises = [];

    for (let i = 0; i < NUM_AGENTS; i++) {
      const agentData = {
        name: `Load Test Agent ${i + 1}`,
        type: i % 3 === 0 ? 'developer' : i % 3 === 1 ? 'tester' : 'designer',
        capabilities: [
          'load-testing',
          'high-concurrency',
          `specialty-${i % 5}`
        ],
        metadata: {
          loadTestAgent: true,
          index: i,
          batchId: 'load-test-' + Date.now()
        }
      };

      const promise = axios.post(
        `${API_BASE_URL}/agents/register`,
        agentData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-API-Key': apiKey
          }
        }
      ).then(response => {
        agents.push({
          id: response.data.id,
          name: agentData.name,
          messagesSent: 0,
          messagesReceived: 0,
          errors: 0
        });
        return response;
      }).catch(error => {
        console.error(`Failed to register agent ${i}:`, error.message);
        throw error;
      });

      registrationPromises.push(promise);
    }

    const results = await Promise.allSettled(registrationPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    const duration = Date.now() - startTime;

    console.log(`✅ Registered ${successful}/${NUM_AGENTS} agents in ${duration}ms`);
    console.log(`   Failed: ${failed}`);

    expect(successful).toBeGreaterThanOrEqual(NUM_AGENTS * 0.95); // 95% success rate
    expect(agents.length).toBeGreaterThanOrEqual(NUM_AGENTS * 0.95);
  });

  test('Load Test 2: 100+ Messages Per Second', async () => {
    console.log(`💬 Starting message load test: ${MESSAGES_PER_SECOND} msg/s for ${TEST_DURATION_SECONDS}s...`);

    // Create a shared chat room
    const roomResponse = await axios.post(
      `${BACKEND_URL}/chat/rooms`,
      {
        name: 'Load Test Chat Room',
        participants: agents.map(a => a.id),
        type: 'load-test'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey
        }
      }
    );

    const roomId = roomResponse.data.id;

    // Connect all agents to WebSocket
    console.log('🔌 Connecting agents to WebSocket...');
    const connectionPromises = agents.map((agent, index) => {
      return new Promise<void>((resolve, reject) => {
        const socket = io(WS_URL, {
          auth: {
            token: authToken,
            agentId: agent.id
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 3
        });

        socket.on('connect', () => {
          agent.socket = socket;
          socket.emit('room:join', { roomId });

          socket.on('message:received', () => {
            agent.messagesReceived++;
          });

          socket.on('error', () => {
            agent.errors++;
          });

          resolve();
        });

        socket.on('connect_error', (error) => {
          console.error(`Agent ${index} connection error:`, error.message);
          reject(error);
        });

        setTimeout(() => reject(new Error(`Agent ${index} connection timeout`)), 10000);
      });
    });

    await Promise.allSettled(connectionPromises);
    const connectedAgents = agents.filter(a => a.socket?.connected);
    console.log(`✅ Connected ${connectedAgents.length}/${agents.length} agents`);

    // Send messages at target rate
    const messageInterval = 1000 / MESSAGES_PER_SECOND;
    const totalMessages = MESSAGES_PER_SECOND * TEST_DURATION_SECONDS;
    let messagesSent = 0;
    let messagesAcknowledged = 0;
    const responseTimes: number[] = [];

    const startTime = Date.now();

    while (Date.now() - startTime < TEST_DURATION_SECONDS * 1000 && messagesSent < totalMessages) {
      const sendPromises = [];

      for (let i = 0; i < 10 && messagesSent < totalMessages; i++) {
        const agent = connectedAgents[messagesSent % connectedAgents.length];

        if (agent && agent.socket?.connected) {
          const msgStartTime = Date.now();

          const promise = new Promise<void>((resolve) => {
            agent.socket!.emit(
              'message:send',
              {
                roomId,
                message: `Load test message ${messagesSent}`,
                agentId: agent.id,
                timestamp: Date.now()
              },
              (ack: any) => {
                const responseTime = Date.now() - msgStartTime;
                responseTimes.push(responseTime);
                messagesAcknowledged++;
                performanceMetrics.successfulRequests++;
                resolve();
              }
            );

            agent.messagesSent++;
            messagesSent++;

            // Timeout if no acknowledgment
            setTimeout(() => {
              performanceMetrics.failedRequests++;
              resolve();
            }, 5000);
          });

          sendPromises.push(promise);
        }
      }

      performanceMetrics.totalRequests = messagesSent;

      await Promise.race([
        Promise.allSettled(sendPromises),
        new Promise(resolve => setTimeout(resolve, messageInterval * 10))
      ]);

      await new Promise(resolve => setTimeout(resolve, messageInterval));
    }

    const actualDuration = Date.now() - startTime;
    const actualThroughput = (messagesSent / actualDuration) * 1000;

    // Calculate metrics
    if (responseTimes.length > 0) {
      performanceMetrics.averageResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      performanceMetrics.maxResponseTime = Math.max(...responseTimes);
      performanceMetrics.minResponseTime = Math.min(...responseTimes);
    }

    performanceMetrics.throughput = actualThroughput;
    performanceMetrics.errorRate =
      performanceMetrics.failedRequests / performanceMetrics.totalRequests;

    console.log('📊 Load Test Results:');
    console.log(`   Total Messages Sent: ${messagesSent}`);
    console.log(`   Messages Acknowledged: ${messagesAcknowledged}`);
    console.log(`   Actual Throughput: ${actualThroughput.toFixed(2)} msg/s`);
    console.log(`   Avg Response Time: ${performanceMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Max Response Time: ${performanceMetrics.maxResponseTime}ms`);
    console.log(`   Min Response Time: ${performanceMetrics.minResponseTime}ms`);
    console.log(`   Error Rate: ${(performanceMetrics.errorRate * 100).toFixed(2)}%`);

    // Verify message delivery
    const totalReceived = agents.reduce((sum, agent) => sum + agent.messagesReceived, 0);
    console.log(`   Total Messages Received by Agents: ${totalReceived}`);

    // Assertions
    expect(actualThroughput).toBeGreaterThan(MESSAGES_PER_SECOND * 0.8); // 80% of target
    expect(performanceMetrics.averageResponseTime).toBeLessThan(1000); // < 1 second
    expect(performanceMetrics.errorRate).toBeLessThan(0.05); // < 5% error rate
  });

  test('Load Test 3: Complex Workflow with 25 Nodes', async () => {
    console.log(`🔄 Creating workflow with ${WORKFLOW_NODES} nodes...`);

    // Create a complex workflow with many nodes
    const nodes = [];
    const edges = [];

    // Start node
    nodes.push({
      id: 'start',
      type: 'start',
      data: { label: 'Start Complex Workflow' }
    });

    // Create sequential and parallel nodes
    for (let i = 0; i < WORKFLOW_NODES - 2; i++) {
      const nodeId = `node-${i}`;
      const nodeType = i % 5 === 0 ? 'parallel' : 'agent';

      if (nodeType === 'parallel') {
        nodes.push({
          id: nodeId,
          type: 'parallel',
          data: {
            branches: [
              {
                id: `${nodeId}-branch-1`,
                type: 'agent',
                data: {
                  agentId: agents[i % agents.length]?.id,
                  action: 'process',
                  input: `\${nodes.${i > 0 ? `node-${i - 1}` : 'start'}.output}`
                }
              },
              {
                id: `${nodeId}-branch-2`,
                type: 'agent',
                data: {
                  agentId: agents[(i + 1) % agents.length]?.id,
                  action: 'validate',
                  input: `\${nodes.${i > 0 ? `node-${i - 1}` : 'start'}.output}`
                }
              }
            ]
          }
        });
      } else {
        nodes.push({
          id: nodeId,
          type: 'agent',
          data: {
            agentId: agents[i % agents.length]?.id,
            action: 'process',
            input: `\${nodes.${i > 0 ? `node-${i - 1}` : 'start'}.output}`
          }
        });
      }

      // Create edge from previous node
      edges.push({
        source: i === 0 ? 'start' : `node-${i - 1}`,
        target: nodeId
      });
    }

    // End node
    nodes.push({
      id: 'end',
      type: 'end',
      data: {
        output: `\${nodes.node-${WORKFLOW_NODES - 3}.output}`
      }
    });

    edges.push({
      source: `node-${WORKFLOW_NODES - 3}`,
      target: 'end'
    });

    const workflowData = {
      name: 'Load Test Complex Workflow',
      description: `Workflow with ${WORKFLOW_NODES} nodes for load testing`,
      nodes,
      edges
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

    console.log(`✅ Created workflow with ID: ${workflowId}`);

    // Execute the workflow
    const executionResponse = await axios.post(
      `${BACKEND_URL}/workflows/${workflowId}/execute`,
      {
        input: {
          data: 'Load test input data'
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

    // Monitor execution (with timeout)
    let completed = false;
    let attempts = 0;
    const maxAttempts = 180; // 3 minutes

    while (!completed && attempts < maxAttempts) {
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

      if (statusResponse.data.status === 'completed' || statusResponse.data.status === 'failed') {
        completed = true;
        console.log(`📊 Workflow completed with status: ${statusResponse.data.status}`);
        console.log(`   Duration: ${statusResponse.data.duration}ms`);
        console.log(`   Nodes executed: ${Object.keys(statusResponse.data.nodeExecutions || {}).length}`);
      }

      attempts++;
    }

    expect(completed).toBe(true);
  });

  test('Load Test 4: Multiple Concurrent Workflows', async () => {
    console.log(`🔄 Launching ${CONCURRENT_WORKFLOWS} concurrent workflows...`);

    const workflowPromises = [];

    for (let i = 0; i < CONCURRENT_WORKFLOWS; i++) {
      const promise = (async () => {
        // Create workflow
        const workflowData = {
          name: `Concurrent Workflow ${i + 1}`,
          description: `Workflow ${i + 1} for concurrency testing`,
          nodes: [
            {
              id: 'start',
              type: 'start',
              data: { label: 'Start' }
            },
            {
              id: 'agent-1',
              type: 'agent',
              data: {
                agentId: agents[i % agents.length]?.id,
                action: 'process',
                input: '${workflow.input}'
              }
            },
            {
              id: 'agent-2',
              type: 'agent',
              data: {
                agentId: agents[(i + 1) % agents.length]?.id,
                action: 'validate',
                input: '${nodes.agent-1.output}'
              }
            },
            {
              id: 'end',
              type: 'end',
              data: {
                output: '${nodes.agent-2.output}'
              }
            }
          ],
          edges: [
            { source: 'start', target: 'agent-1' },
            { source: 'agent-1', target: 'agent-2' },
            { source: 'agent-2', target: 'end' }
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

        // Execute workflow
        const executionResponse = await axios.post(
          `${BACKEND_URL}/workflows/${workflowResponse.data.id}/execute`,
          {
            input: {
              workflowIndex: i,
              data: `Concurrent test data ${i}`
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'X-API-Key': apiKey
            }
          }
        );

        return executionResponse.data.executionId;
      })();

      workflowPromises.push(promise);
    }

    const executionIds = await Promise.all(workflowPromises);
    console.log(`✅ Launched ${executionIds.length} concurrent workflows`);

    // Monitor all executions
    let allCompleted = false;
    let attempts = 0;
    const maxAttempts = 120;

    while (!allCompleted && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusPromises = executionIds.map(id =>
        axios.get(
          `${BACKEND_URL}/workflows/executions/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'X-API-Key': apiKey
            }
          }
        )
      );

      const statuses = await Promise.all(statusPromises);
      const completed = statuses.filter(
        s => s.data.status === 'completed' || s.data.status === 'failed'
      ).length;

      if (completed === executionIds.length) {
        allCompleted = true;
        const successful = statuses.filter(s => s.data.status === 'completed').length;
        console.log(`📊 All workflows completed: ${successful}/${executionIds.length} successful`);
      }

      attempts++;
    }

    expect(allCompleted).toBe(true);
  });

  test('Load Test 5: Database Performance Under Load', async () => {
    console.log('💾 Testing database performance under load...');

    const NUM_DB_OPERATIONS = 1000;
    const operations = [];

    for (let i = 0; i < NUM_DB_OPERATIONS; i++) {
      const operation = (async () => {
        const startTime = Date.now();

        try {
          // Random CRUD operation
          const opType = i % 4;

          switch (opType) {
            case 0: // Create
              await axios.post(
                `${API_BASE_URL}/agents/register`,
                {
                  name: `DB Load Test Agent ${i}`,
                  type: 'load-tester',
                  capabilities: ['db-test']
                },
                {
                  headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'X-API-Key': apiKey
                  }
                }
              );
              break;

            case 1: // Read
              if (agents.length > 0) {
                await axios.get(
                  `${API_BASE_URL}/agents/${agents[i % agents.length].id}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${authToken}`,
                      'X-API-Key': apiKey
                    }
                  }
                );
              }
              break;

            case 2: // Update
              if (agents.length > 0) {
                await axios.patch(
                  `${API_BASE_URL}/agents/${agents[i % agents.length].id}`,
                  {
                    metadata: { lastUpdated: Date.now() }
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${authToken}`,
                      'X-API-Key': apiKey
                    }
                  }
                );
              }
              break;

            case 3: // List
              await axios.get(
                `${API_BASE_URL}/agents/discover`,
                {
                  headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'X-API-Key': apiKey
                  }
                }
              );
              break;
          }

          return {
            success: true,
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            duration: Date.now() - startTime
          };
        }
      })();

      operations.push(operation);
    }

    const results = await Promise.allSettled(operations);
    const successful = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;

    const durations = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value.duration);

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);

    console.log('📊 Database Load Test Results:');
    console.log(`   Total Operations: ${NUM_DB_OPERATIONS}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Success Rate: ${((successful / NUM_DB_OPERATIONS) * 100).toFixed(2)}%`);
    console.log(`   Avg Duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`   Max Duration: ${maxDuration}ms`);

    expect(successful / NUM_DB_OPERATIONS).toBeGreaterThan(0.95); // 95% success rate
    expect(avgDuration).toBeLessThan(500); // < 500ms average
  });
});

test.describe('Load Testing - System Limits', () => {
  test('Find Maximum Concurrent Connections', async () => {
    console.log('🔍 Finding maximum concurrent WebSocket connections...');

    // This test will be implementation-specific
    // Add your max connection discovery logic here
  });

  test('Find Maximum Message Throughput', async () => {
    console.log('🔍 Finding maximum message throughput...');

    // This test will be implementation-specific
    // Add your throughput discovery logic here
  });
});
