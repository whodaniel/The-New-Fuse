/**
 * E2E Test Data
 *
 * Fixtures and test data for E2E tests
 */

export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!@#',
    name: 'Test Admin',
  },
  user: {
    email: 'user@test.com',
    password: 'User123!@#',
    name: 'Test User',
  },
  guest: {
    email: 'guest@test.com',
    password: 'Guest123!@#',
    name: 'Test Guest',
  },
};

export const TEST_WORKFLOWS = {
  simple: {
    name: 'Simple Workflow',
    description: 'A simple test workflow',
    nodes: [
      {
        id: 'node-1',
        type: 'start',
        data: { label: 'Start' },
      },
      {
        id: 'node-2',
        type: 'end',
        data: { label: 'End' },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      },
    ],
  },
};

export const TEST_AGENTS = {
  simple: {
    name: 'Test Agent',
    type: 'simple',
    capabilities: ['test'],
  },
};

export const API_ENDPOINTS = {
 health: '/api/health',
 login: '/api/v1/auth/login',
 logout: '/api/v1/auth/logout',
 workflows: '/api/v1/workflows',
 agents: '/api/v1/agents',
};
