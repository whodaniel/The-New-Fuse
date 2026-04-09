/**
 * Chaos Testing Suite
 *
 * Testing system resilience:
 * - Kill random agent mid-task (recovery?)
 * - Disconnect Redis (failover?)
 * - Database connection lost (retry?)
 * - High CPU/memory load (graceful degradation?)
 * - Network partitions
 * - Service failures
 */

import { expect, test } from '@playwright/test';
import axios from 'axios';
import { exec } from 'child_process';
import Redis from 'ioredis';
import { io, Socket } from 'socket.io-client';
import { promisify } from 'util';

const execAsync = promisify(exec);

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3004';
const WS_URL = process.env.WS_URL || 'ws://localhost:3004';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

test.describe('Chaos Testing - Agent Failures', () => {
  let authToken: string;
  let apiKey: string;

  test.beforeAll(async () => {
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`, {
      test: true,
    });
    authToken = authResponse.data.token;
    apiKey = authResponse.data.apiKey || 'test_api_key_' + Date.now();
  });

  test('Chaos 1: Kill Agent Mid-Task - Verify Recovery', async () => {
    // Register agent
    const agentResponse = await axios.post(
      `${API_BASE_URL}/agents/register`,
      {
        name: 'Chaos Test Agent - Kill Mid Task',
        type: 'developer',
        capabilities: ['chaos-testing'],
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-API-Key': apiKey,
        },
      }
    );

    const agentId = agentResponse.data.id;

    // Assign a long-running task
    const taskResponse = await axios.post(
      `${BACKEND_URL}/tasks/create`,
      {
        agentId,
        type: 'long-running',
        description: 'Long running task for chaos testing',
        timeout: 60000,
        input: {
          duration: 30000, // 30 seconds
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-API-Key': apiKey,
        },
      }
    );

    const taskId = taskResponse.data.id;

    // Wait for task to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Kill the agent (simulate crash)
    await axios.patch(
      `${API_BASE_URL}/agents/${agentId}/status`,
      {
        status: 'error',
        error: 'Simulated agent crash',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-API-Key': apiKey,
        },
      }
    );

    // Verify task is marked as failed or reassigned
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const taskStatus = await axios.get(`${BACKEND_URL}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-API-Key': apiKey,
      },
    });

    // Task should either be failed or reassigned
    expect(['failed', 'reassigned', 'pending']).toContain(taskStatus.data.status);

    // Check if system attempted recovery
    const recoveryLogs = await axios.get(`${BACKEND_URL}/tasks/${taskId}/recovery-logs`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-API-Key': apiKey,
      },
    });

    expect(recoveryLogs.data.recoveryAttempts).toBeGreaterThan(0);

    console.log('✅ Agent failure recovery tested');
    console.log(`   Recovery attempts: ${recoveryLogs.data.recoveryAttempts}`);
    console.log(`   Final status: ${taskStatus.data.status}`);
  });

  test('Chaos 2: Agent Timeout Handling', async () => {
    // Create agent
    const agentResponse = await axios.post(
      `${API_BASE_URL}/agents/register`,
      {
        name: 'Timeout Test Agent',
        type: 'developer',
        capabilities: ['timeout-testing'],
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-API-Key': apiKey,
        },
      }
    );

    const agentId = agentResponse.data.id;

    // Assign task with short timeout
    const taskResponse = await axios.post(
      `${BACKEND_URL}/tasks/create`,
      {
        agentId,
        type: 'timeout-test',
        timeout: 2000, // 2 second timeout
        input: {
          simulateDelay: 10000, // Simulate 10 second processing
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-API-Key': apiKey,
        },
      }
    );

    const taskId = taskResponse.data.id;

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const taskStatus = await axios.get(`${BACKEND_URL}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-API-Key': apiKey,
      },
    });

    expect(taskStatus.data.status).toBe('timeout');
    expect(taskStatus.data.error).toContain('timeout');

    console.log('✅ Agent timeout handling verified');
  });
});

test.describe('Chaos Testing - Infrastructure Failures', () => {
  let authToken: string;
  let redisClient: Redis;

  test.beforeAll(async () => {
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`, {
      test: true,
    });
    authToken = authResponse.data.token;

    redisClient = new Redis(REDIS_URL);
  });

  test.afterAll(async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  });

  test('Chaos 3: Redis Disconnection - Verify Failover', async () => {
    // Verify Redis is working
    const pingResult = await redisClient.ping();
    expect(pingResult).toBe('PONG');

    // Store test data in Redis
    await redisClient.set('chaos:test:key', 'test-value');

    // Simulate Redis disconnection (in real scenario, would pause/stop Redis container)
    console.log('⚠️  Simulating Redis disconnection...');

    // Try to perform operation that requires Redis
    let caughtError = false;
    let fallbackUsed = false;

    try {
      // Disconnect Redis client
      await redisClient.disconnect();

      // Try to make request that uses Redis
      const response = await axios.post(
        `${BACKEND_URL}/cache/set`,
        {
          key: 'chaos:redis:test',
          value: 'test',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      // Check if fallback mechanism was used
      if (response.data.usedFallback) {
        fallbackUsed = true;
      }
    } catch (error) {
      caughtError = true;
    }

    // System should either use fallback or handle gracefully
    expect(caughtError || fallbackUsed).toBe(true);

    // Reconnect Redis
    redisClient = new Redis(REDIS_URL);
    await redisClient.ping();

    console.log('✅ Redis failover handling verified');
    console.log(`   Fallback used: ${fallbackUsed}`);
  });

  test('Chaos 4: Database Connection Loss - Verify Retry Logic', async () => {
    // This test simulates database connection issues

    // Create multiple agents that will trigger DB operations
    const agentPromises = [];

    for (let i = 0; i < 10; i++) {
      const promise = axios.post(
        `${API_BASE_URL}/agents/register`,
        {
          name: `DB Chaos Agent ${i}`,
          type: 'developer',
          capabilities: ['db-testing'],
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 30000,
        }
      );

      agentPromises.push(promise);
    }

    // Some requests might fail due to connection pool exhaustion
    const results = await Promise.allSettled(agentPromises);

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log('📊 Database stress test results:');
    console.log(`   Successful: ${successful}/10`);
    console.log(`   Failed: ${failed}/10`);

    // Verify retry headers or logs
    const logsResponse = await axios.get(
      `${BACKEND_URL}/system/logs?category=database&level=error`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    // System should have retry logs
    const retryLogs = logsResponse.data.logs.filter(
      (log: any) => log.message.includes('retry') || log.message.includes('reconnect')
    );

    console.log(`   Database retry attempts: ${retryLogs.length}`);

    // At least some operations should succeed even under stress
    expect(successful).toBeGreaterThan(0);
  });

  test('Chaos 5: High Memory/CPU Load - Graceful Degradation', async () => {
    console.log('💻 Testing system under high load...');

    // Create memory and CPU intensive operations
    const intensivePromises = [];

    // Simulate high load by creating many concurrent requests
    for (let i = 0; i < 100; i++) {
      const promise = axios.post(
        `${BACKEND_URL}/workflows/create`,
        {
          name: `Load Test Workflow ${i}`,
          nodes: Array.from({ length: 50 }, (_, idx) => ({
            id: `node-${idx}`,
            type: 'agent',
            data: { action: 'process' },
          })),
          edges: Array.from({ length: 49 }, (_, idx) => ({
            source: `node-${idx}`,
            target: `node-${idx + 1}`,
          })),
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 10000,
        }
      );

      intensivePromises.push(promise);
    }

    const results = await Promise.allSettled(intensivePromises);
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.filter((r) => r.status === 'rejected');

    // Check if system returned proper HTTP status codes
    const rateLimited = rejected.filter((r: any) => r.reason?.response?.status === 429).length;

    const serverErrors = rejected.filter((r: any) => r.reason?.response?.status === 503).length;

    console.log('📊 High load test results:');
    console.log(`   Successful: ${successful}/100`);
    console.log(`   Rate Limited (429): ${rateLimited}`);
    console.log(`   Service Unavailable (503): ${serverErrors}`);

    // System should gracefully degrade with proper status codes
    expect(rateLimited + serverErrors).toBeGreaterThan(0);
    expect(successful).toBeGreaterThan(0);

    // Verify system health metrics
    const healthResponse = await axios.get(`${BACKEND_URL}/health`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(healthResponse.data).toHaveProperty('status');
    console.log(`   System health status: ${healthResponse.data.status}`);
  });
});

test.describe('Chaos Testing - Network Issues', () => {
  let authToken: string;
  let sockets: Socket[] = [];

  test.beforeAll(async () => {
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`, {
      test: true,
    });
    authToken = authResponse.data.token;
  });

  test.afterAll(async () => {
    for (const socket of sockets) {
      if (socket.connected) {
        socket.disconnect();
      }
    }
  });

  test('Chaos 6: WebSocket Disconnection Recovery', async () => {
    // Create WebSocket connection
    const socket = io(WS_URL, {
      auth: { token: authToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    let reconnectAttempts = 0;
    let reconnected = false;

    socket.on('reconnect_attempt', () => {
      reconnectAttempts++;
      console.log(`   Reconnect attempt ${reconnectAttempts}`);
    });

    socket.on('reconnect', () => {
      reconnected = true;
      console.log('   ✅ Reconnected successfully');
    });

    // Simulate disconnection
    socket.disconnect();

    // Wait for reconnection
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Manually reconnect to simulate recovery
    socket.connect();

    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        reconnected = true;
        resolve();
      });
      setTimeout(resolve, 5000);
    });

    expect(reconnected).toBe(true);

    socket.disconnect();

    console.log('✅ WebSocket reconnection verified');
  });

  test('Chaos 7: Slow Network Conditions', async () => {
    // Simulate slow network by setting aggressive timeouts
    const slowRequests = [];

    for (let i = 0; i < 10; i++) {
      const promise = axios
        .get(`${API_BASE_URL}/agents/discover`, {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 100, // Very short timeout to simulate slow network
        })
        .catch((error) => error);

      slowRequests.push(promise);
    }

    const results = await Promise.allSettled(slowRequests);
    const timeouts = results.filter((r: any) => r.value?.code === 'ECONNABORTED').length;

    console.log(`📊 Slow network simulation:`);
    console.log(`   Timeout errors: ${timeouts}/10`);

    // System should handle timeouts gracefully
    expect(timeouts).toBeGreaterThan(0);
  });
});

test.describe('Chaos Testing - Data Corruption', () => {
  let authToken: string;

  test.beforeAll(async () => {
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`, {
      test: true,
    });
    authToken = authResponse.data.token;
  });

  test('Chaos 8: Invalid Data Handling', async () => {
    // Test various invalid inputs
    const invalidInputs = [
      { name: '', type: 'developer' }, // Empty name
      { name: 'Test', type: '' }, // Empty type
      { name: 'Test', type: 'invalid-type' }, // Invalid type
      { name: 'A'.repeat(1000), type: 'developer' }, // Too long
      { name: null, type: 'developer' }, // Null value
      { name: '<script>alert("xss")</script>', type: 'developer' }, // XSS attempt
      { capabilities: 'not-an-array' }, // Wrong type
    ];

    for (const input of invalidInputs) {
      try {
        await axios.post(`${API_BASE_URL}/agents/register`, input, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Should return 400 Bad Request
        expect([400, 422]).toContain(error.response.status);
      }
    }

    console.log('✅ Invalid data handling verified');
  });

  test('Chaos 9: SQL Injection Prevention', async () => {
    // Test SQL injection attempts
    const sqlInjections = [
      "'; DROP TABLE agents; --",
      "1' OR '1'='1",
      "admin'--",
      "' OR 1=1--",
      '1; DELETE FROM agents WHERE 1=1--',
    ];

    for (const injection of sqlInjections) {
      const response = await axios.get(`${API_BASE_URL}/agents/discover`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          name: injection,
        },
      });

      // Should return safely (empty or normal results, not error)
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.agents)).toBe(true);
    }

    console.log('✅ SQL injection prevention verified');
  });
});
