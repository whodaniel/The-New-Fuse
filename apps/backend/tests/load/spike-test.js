import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Spike Test Configuration
 * This test simulates sudden traffic spikes
 * to test system recovery and auto-scaling
 */
export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Normal load
    { duration: '30s', target: 1000 }, // Sudden spike
    { duration: '3m', target: 1000 },  // Stay at spike
    { duration: '30s', target: 50 },   // Return to normal
    { duration: '2m', target: 50 },    // Recovery period
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Allow higher latency during spike
    http_req_failed: ['rate<0.05'],    // Allow 5% error rate during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export function setup() {
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'test@example.com',
    password: __ENV.TEST_PASSWORD || 'testpassword',
  });

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  return { authToken: loginRes.json('token') || loginRes.json('access_token') };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
  };

  // Mix of different endpoints
  const endpoint = [
    `${BASE_URL}/users?page=1&limit=50`,
    `${BASE_URL}/agents?page=1&limit=50`,
    `${BASE_URL}/chat/history?page=1`,
  ][Math.floor(Math.random() * 3)];

  const res = http.get(endpoint, { headers });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 5000,
  });

  sleep(Math.random() * 2); // Random think time
}
