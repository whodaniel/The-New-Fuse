import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCounter = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],                  // Error rate should be less than 1%
    errors: ['rate<0.1'],                            // Custom error rate
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
let authToken = '';

// Setup function - runs once before the test
export function setup() {
  // Login to get auth token
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'test@example.com',
    password: __ENV.TEST_PASSWORD || 'testpassword',
  });

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    const token = loginRes.json('token') || loginRes.json('access_token');
    return { authToken: token };
  }

  console.error('Setup failed: Could not authenticate');
  return { authToken: null };
}

// Main test function
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': data.authToken ? `Bearer ${data.authToken}` : '',
  };

  // Test scenarios with weighted distribution
  const scenarios = [
    { weight: 40, fn: testGetUsers },
    { weight: 30, fn: testGetAgents },
    { weight: 15, fn: testGetChatHistory },
    { weight: 10, fn: testCreateAgent },
    { weight: 5, fn: testUpdateAgent },
  ];

  // Select random scenario based on weights
  const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (const scenario of scenarios) {
    random -= scenario.weight;
    if (random <= 0) {
      scenario.fn(headers);
      break;
    }
  }

  sleep(1); // Think time between requests
}

// Test: Get Users List
function testGetUsers(headers) {
  const page = Math.floor(Math.random() * 5) + 1;
  const res = http.get(`${BASE_URL}/users?page=${page}&limit=50`, { headers });

  requestCounter.add(1);
  responseTime.add(res.timings.duration);

  check(res, {
    'Get users status is 200': (r) => r.status === 200,
    'Get users has pagination': (r) => r.json('pagination') !== undefined,
    'Response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
}

// Test: Get Agents List
function testGetAgents(headers) {
  const page = Math.floor(Math.random() * 3) + 1;
  const res = http.get(`${BASE_URL}/agents?page=${page}&limit=50`, { headers });

  requestCounter.add(1);
  responseTime.add(res.timings.duration);

  check(res, {
    'Get agents status is 200': (r) => r.status === 200,
    'Get agents returns array': (r) => Array.isArray(r.json('data')),
    'Response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
}

// Test: Get Chat History
function testGetChatHistory(headers) {
  const page = Math.floor(Math.random() * 10) + 1;
  const res = http.get(`${BASE_URL}/chat/history?page=${page}`, { headers });

  requestCounter.add(1);
  responseTime.add(res.timings.duration);

  check(res, {
    'Get chat history status is 200': (r) => r.status === 200,
    'Response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
}

// Test: Create Agent
function testCreateAgent(headers) {
  const payload = JSON.stringify({
    name: `Test Agent ${Date.now()}`,
    type: 'ASSISTANT',
    description: 'Load test agent',
    capabilities: ['CHAT'],
  });

  const res = http.post(`${BASE_URL}/agents`, payload, { headers });

  requestCounter.add(1);
  responseTime.add(res.timings.duration);

  check(res, {
    'Create agent status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'Response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
}

// Test: Update Agent
function testUpdateAgent(headers) {
  // First, get an agent ID
  const getRes = http.get(`${BASE_URL}/agents?page=1&limit=1`, { headers });

  if (getRes.status === 200 && getRes.json('data.0.id')) {
    const agentId = getRes.json('data.0.id');
    const payload = JSON.stringify({
      description: `Updated at ${Date.now()}`,
    });

    const res = http.put(`${BASE_URL}/agents/${agentId}`, payload, { headers });

    requestCounter.add(1);
    responseTime.add(res.timings.duration);

    check(res, {
      'Update agent status is 200': (r) => r.status === 200,
      'Response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);
  }
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('Load test completed');
}
