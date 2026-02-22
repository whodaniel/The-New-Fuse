/**
 * Integration Testing Suite
 *
 * Testing full stack integration:
 * - Frontend → Backend → Database → Redis
 * - WebSocket connections (1000+ concurrent)
 * - GraphQL + REST APIs working together
 * - Authentication and authorization
 * - File uploads and downloads
 */

import { expect, test } from '@playwright/test';
import axios from 'axios';
import Redis from 'ioredis';
import { io, Socket } from 'socket.io-client';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3004';
const WS_URL = process.env.WS_URL || 'ws://localhost:3004';
const REDIS_URL =
  process.env.REDIS_URL ||
  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570';
const GRAPHQL_URL = process.env.GRAPHQL_URL || 'http://localhost:3001/graphql';

test.describe('Full Stack Integration Tests', () => {
  let authToken: string;
  let apiKey: string;
  let userId: string;
  let redisClient: Redis;

  test.beforeAll(async () => {
    // Setup Redis
    redisClient = new Redis(REDIS_URL);
    await redisClient.ping();

    console.log('✅ Integration test setup complete');
  });

  test.afterAll(async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  });

  test('Integration 1: Frontend → Backend → Database → Redis Flow', async ({ page }) => {
    // Step 1: Frontend - User Registration
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Navigate to signup
    await page.click('text=Sign Up');
    await page.fill('input[name="email"]', `integration-test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'IntegrationTest123!');
    await page.fill('input[name="firstName"]', 'Integration');
    await page.fill('input[name="lastName"]', 'Test');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');

    // Verify token in localStorage (Frontend)
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
    authToken = token!;

    // Step 2: Backend - Verify user in database
    const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(userResponse.status).toBe(200);
    expect(userResponse.data).toHaveProperty('id');
    expect(userResponse.data).toHaveProperty('email');
    userId = userResponse.data.id;

    // Step 3: Database - Verify user exists
    const dbCheckResponse = await axios.get(`${API_BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(dbCheckResponse.status).toBe(200);
    expect(dbCheckResponse.data.id).toBe(userId);

    // Step 4: Redis - Verify session cached
    const sessionKey = `session:${userId}`;
    const sessionData = await redisClient.get(sessionKey);

    expect(sessionData).toBeTruthy();
    const session = JSON.parse(sessionData!);
    expect(session).toHaveProperty('userId', userId);

    console.log('✅ Frontend → Backend → Database → Redis flow successful');
  });

  test('Integration 2: REST API + GraphQL Working Together', async () => {
    // Create user via REST
    const restResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `gql-rest-${Date.now()}@example.com`,
      password: 'GqlRest123!',
      firstName: 'GraphQL',
      lastName: 'REST',
    });

    authToken = restResponse.data.token;
    userId = restResponse.data.user.id;

    // Create agent via GraphQL
    const createAgentMutation = `
      mutation CreateAgent($input: CreateAgentInput!) {
        createAgent(input: $input) {
          id
          name
          type
          status
          capabilities
        }
      }
    `;

    const gqlResponse = await axios.post(
      GRAPHQL_URL,
      {
        query: createAgentMutation,
        variables: {
          input: {
            name: 'GraphQL Test Agent',
            type: 'developer',
            capabilities: ['graphql', 'rest', 'integration'],
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(gqlResponse.data.data.createAgent).toBeDefined();
    const agentId = gqlResponse.data.data.createAgent.id;

    // Retrieve agent via REST
    const restAgentResponse = await axios.get(`${API_BASE_URL}/agents/${agentId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(restAgentResponse.status).toBe(200);
    expect(restAgentResponse.data.id).toBe(agentId);
    expect(restAgentResponse.data.name).toBe('GraphQL Test Agent');

    // Query agents via GraphQL
    const getAgentsQuery = `
      query GetAgents {
        agents {
          id
          name
          type
          status
        }
      }
    `;

    const gqlQueryResponse = await axios.post(
      GRAPHQL_URL,
      {
        query: getAgentsQuery,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(gqlQueryResponse.data.data.agents).toBeDefined();
    expect(gqlQueryResponse.data.data.agents.length).toBeGreaterThan(0);
    const agentExists = gqlQueryResponse.data.data.agents.some((a: any) => a.id === agentId);
    expect(agentExists).toBe(true);

    console.log('✅ REST + GraphQL integration successful');
  });

  test('Integration 3: Authentication & Authorization Flow', async () => {
    // Test different auth levels
    const roles = ['user', 'admin', 'agent'];

    for (const role of roles) {
      // Create user with specific role
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `${role}-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: role.charAt(0).toUpperCase() + role.slice(1),
        lastName: 'User',
        role: role,
      });

      const token = registerResponse.data.token;

      // Test authorized endpoint
      const authorizedResponse = await axios.get(`${API_BASE_URL}/${role}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(authorizedResponse.status).toBe(200);

      // Test unauthorized endpoint (if not admin)
      if (role !== 'admin') {
        try {
          await axios.get(`${API_BASE_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
          expect(error.response.status).toBe(403); // Forbidden
        }
      }

      // Verify JWT expiration
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('userId');
    }

    console.log('✅ Authentication & Authorization flow successful');
  });

  test('Integration 4: File Upload and Download', async () => {
    // Create auth token
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`, {
      test: true,
    });
    authToken = authResponse.data.token;

    // Create a test file
    const fileContent = 'Integration test file content';
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'test-file.txt');
    formData.append('description', 'Integration test file');

    // Upload file
    const uploadResponse = await axios.post(`${BACKEND_URL}/files/upload`, formData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.data).toHaveProperty('fileId');
    expect(uploadResponse.data).toHaveProperty('url');

    const fileId = uploadResponse.data.fileId;

    // Verify file metadata in database
    const metadataResponse = await axios.get(`${BACKEND_URL}/files/${fileId}/metadata`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(metadataResponse.data.filename).toBe('test-file.txt');
    expect(metadataResponse.data.mimeType).toBe('text/plain');

    // Download file
    const downloadResponse = await axios.get(`${BACKEND_URL}/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'blob',
    });

    expect(downloadResponse.status).toBe(200);
    const downloadedContent = await downloadResponse.data.text();
    expect(downloadedContent).toBe(fileContent);

    console.log('✅ File upload/download integration successful');
  });
});

test.describe('WebSocket Integration - High Concurrency', () => {
  const NUM_CONNECTIONS = 1000;
  let sockets: Socket[] = [];
  let authToken: string;

  test.setTimeout(180000); // 3 minutes

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

  test('WebSocket 1: Establish 1000+ Concurrent Connections', async () => {
    console.log(`🔌 Establishing ${NUM_CONNECTIONS} WebSocket connections...`);

    const connectionPromises = [];
    let connected = 0;
    let failed = 0;

    for (let i = 0; i < NUM_CONNECTIONS; i++) {
      const promise = new Promise<Socket | null>((resolve) => {
        const socket = io(WS_URL, {
          auth: {
            token: authToken,
            clientId: `ws-test-${i}`,
          },
          reconnection: false,
        });

        const timeout = setTimeout(() => {
          socket.disconnect();
          failed++;
          resolve(null);
        }, 10000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          connected++;
          resolve(socket);
        });

        socket.on('connect_error', () => {
          clearTimeout(timeout);
          failed++;
          resolve(null);
        });
      });

      connectionPromises.push(promise);

      // Batch connections to avoid overwhelming the server
      if (i % 100 === 99) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const results = await Promise.all(connectionPromises);
    sockets = results.filter((s): s is Socket => s !== null);

    console.log(`✅ Connected: ${connected}/${NUM_CONNECTIONS}`);
    console.log(`❌ Failed: ${failed}/${NUM_CONNECTIONS}`);
    console.log(`📊 Success Rate: ${((connected / NUM_CONNECTIONS) * 100).toFixed(2)}%`);

    expect(connected).toBeGreaterThan(NUM_CONNECTIONS * 0.95); // 95% success rate
  });

  test('WebSocket 2: Broadcast Message to All Connections', async () => {
    const testMessage = 'Broadcast test message';
    let receivedCount = 0;

    // Setup listeners
    const receivePromises = sockets.map((socket) => {
      return new Promise<void>((resolve) => {
        socket.once('broadcast', (data) => {
          expect(data.message).toBe(testMessage);
          receivedCount++;
          resolve();
        });

        setTimeout(resolve, 5000); // Timeout
      });
    });

    // Broadcast message
    await axios.post(
      `${BACKEND_URL}/websocket/broadcast`,
      {
        event: 'broadcast',
        data: { message: testMessage },
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    await Promise.all(receivePromises);

    console.log(`📡 Broadcast received by ${receivedCount}/${sockets.length} connections`);

    expect(receivedCount).toBeGreaterThan(sockets.length * 0.95); // 95% delivery
  });

  test('WebSocket 3: Room-based Communication', async () => {
    const roomName = 'ws-test-room';

    // Create room
    await axios.post(
      `${BACKEND_URL}/chat/rooms`,
      {
        name: roomName,
        type: 'test-room',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    // Join half of the connections to the room
    const roomSockets = sockets.slice(0, Math.floor(sockets.length / 2));

    for (const socket of roomSockets) {
      socket.emit('room:join', { roomName });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Send room message
    let receivedCount = 0;
    const receivePromises = roomSockets.map((socket) => {
      return new Promise<void>((resolve) => {
        socket.once('room:message', (data) => {
          receivedCount++;
          resolve();
        });
        setTimeout(resolve, 5000);
      });
    });

    roomSockets[0].emit('room:send', {
      roomName,
      message: 'Room message test',
    });

    await Promise.all(receivePromises);

    console.log(`📨 Room message received by ${receivedCount}/${roomSockets.length} members`);

    expect(receivedCount).toBeGreaterThan(roomSockets.length * 0.9);
  });
});

test.describe('Database Integration - Complex Queries', () => {
  let authToken: string;

  test.beforeAll(async () => {
    const authResponse = await axios.post(`${API_BASE_URL}/auth/test-token`, {
      test: true,
    });
    authToken = authResponse.data.token;
  });

  test('Database 1: Complex Joins and Relationships', async () => {
    // Create related data
    const userData = {
      email: `db-test-${Date.now()}@example.com`,
      password: 'DbTest123!',
      firstName: 'Database',
      lastName: 'Test',
    };

    const userResponse = await axios.post(`${API_BASE_URL}/auth/register`, userData);

    const userId = userResponse.data.user.id;
    const userToken = userResponse.data.token;

    // Create agents for user
    const agentIds = [];
    for (let i = 0; i < 5; i++) {
      const agentResponse = await axios.post(
        `${API_BASE_URL}/agents/register`,
        {
          name: `DB Test Agent ${i}`,
          type: 'developer',
          capabilities: ['testing'],
        },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      agentIds.push(agentResponse.data.id);
    }

    // Create workflows with agents
    for (const agentId of agentIds) {
      await axios.post(
        `${BACKEND_URL}/workflows/create`,
        {
          name: `Workflow for ${agentId}`,
          nodes: [
            { id: 'start', type: 'start' },
            {
              id: 'agent',
              type: 'agent',
              data: { agentId },
            },
            { id: 'end', type: 'end' },
          ],
          edges: [
            { source: 'start', target: 'agent' },
            { source: 'agent', target: 'end' },
          ],
        },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
    }

    // Query with complex joins
    const complexQuery = await axios.get(`${API_BASE_URL}/users/${userId}/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` },
      params: {
        include: 'agents,workflows,metrics',
      },
    });

    expect(complexQuery.data).toHaveProperty('user');
    expect(complexQuery.data).toHaveProperty('agents');
    expect(complexQuery.data).toHaveProperty('workflows');
    expect(complexQuery.data.agents.length).toBe(5);

    console.log('✅ Complex database queries successful');
  });

  test('Database 2: Transaction Handling', async () => {
    // Test atomic operations
    const transactionData = {
      operations: [
        {
          type: 'create',
          entity: 'agent',
          data: { name: 'Transaction Agent 1', type: 'developer' },
        },
        {
          type: 'create',
          entity: 'agent',
          data: { name: 'Transaction Agent 2', type: 'tester' },
        },
        {
          type: 'create',
          entity: 'workflow',
          data: { name: 'Transaction Workflow' },
        },
      ],
    };

    const transactionResponse = await axios.post(
      `${API_BASE_URL}/transactions/execute`,
      transactionData,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(transactionResponse.status).toBe(200);
    expect(transactionResponse.data.results.length).toBe(3);

    console.log('✅ Database transactions successful');
  });
});
