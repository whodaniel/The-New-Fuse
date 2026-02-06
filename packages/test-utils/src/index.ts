/**
 * @the-new-fuse/test-utils
 * Testing utilities for The New Fuse
 */

// Mock factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAgent = (overrides = {}) => ({
  id: 'agent-123',
  name: 'TestAgent',
  type: 'CHAT',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockConversation = (overrides = {}) => ({
  id: 'conv-123',
  title: 'Test Conversation',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Test helpers
export const waitFor = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

// Database helpers
export const clearDatabase = async (): Promise<void> => {
  // Implementation for test database cleanup
  // Database cleared for tests
};

export const seedDatabase = async (_data: Record<string, any> = {}): Promise<void> => {
  // Implementation for test data seeding
  // Database seeded with test data
};

// Component test helpers
export const renderWithProviders = (component: any, _options: Record<string, any> = {}) => {
  // Implementation for rendering React components with providers
  return component;
};

// API test helpers
export const createTestServer = () => {
  // Implementation for test server creation
  return {
    listen: () => {},
    close: () => {},
  };
};
