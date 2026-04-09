import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Stress Test Configuration
 * This test gradually increases load beyond normal capacity
 * to find the breaking point of the system
 */
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Below normal load
    { duration: '5m', target: 200 },   // Normal load
    { duration: '2m', target: 300 },   // Around the breaking point
    { duration: '5m', target: 400 },   // Beyond the breaking point
    { duration: '5m', target: 500 },   // Well beyond capacity
    { duration: '10m', target: 0 },    // Scale down (recovery)
  ],
  thresholds: {
    http_req_duration: ['p(99)<3000'], // 99% of requests should be below 3s (stressed)
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

  // Heavy database query
  const res1 = http.get(`${BASE_URL}/agents?page=1&limit=100`, { headers });
  check(res1, { 'agents loaded': (r) => r.status === 200 });

  // Multiple concurrent requests
  const responses = http.batch([
    ['GET', `${BASE_URL}/users?page=1&limit=50`, null, { headers }],
    ['GET', `${BASE_URL}/chat/history?page=1`, null, { headers }],
    ['GET', `${BASE_URL}/agents?page=1&limit=50`, null, { headers }],
  ]);

  responses.forEach((res) => {
    check(res, { 'batch request success': (r) => r.status === 200 });
  });

  sleep(0.5);
}
