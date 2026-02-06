// Use Jest for testing in NestJS projects
// These globals are automatically available when using Jest

// Global test setup for API package
beforeAll(async () => {
  // Setup test database, mock services, etc.
});

afterAll(async () => {
  // Cleanup after tests
});

// Export test utilities for use in other test files
export const testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
  }),

  createMockAgent: () => ({
    id: 'test-agent-id',
    name: 'Test Agent',
    type: 'test',
    provider: 'test-provider',
    status: 'active',
  }),
};

// Example test
describe('API Package', () => {
  it('should load successfully', () => {
    expect(true).toBe(true);
  });
});
