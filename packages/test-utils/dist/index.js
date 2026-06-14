"use strict";
/**
 * @the-new-fuse/test-utils
 * Testing utilities for The New Fuse
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestServer = exports.renderWithProviders = exports.seedDatabase = exports.clearDatabase = exports.mockApiResponse = exports.waitFor = exports.createMockConversation = exports.createMockAgent = exports.createMockUser = void 0;
// Mock factories
const createMockUser = (overrides = {}) => ({
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
exports.createMockUser = createMockUser;
const createMockAgent = (overrides = {}) => ({
    id: "agent-123",
    name: "TestAgent",
    type: "CHAT",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
exports.createMockAgent = createMockAgent;
const createMockConversation = (overrides = {}) => ({
    id: "conv-123",
    title: "Test Conversation",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
exports.createMockConversation = createMockConversation;
// Test helpers
const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.waitFor = waitFor;
const mockApiResponse = (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
});
exports.mockApiResponse = mockApiResponse;
// Database helpers
const clearDatabase = async () => {
    // Implementation for test database cleanup
    // Database cleared for tests
};
exports.clearDatabase = clearDatabase;
const seedDatabase = async (_data = {}) => {
    // Implementation for test data seeding
    // Database seeded with test data
};
exports.seedDatabase = seedDatabase;
// Component test helpers
const renderWithProviders = (component, _options = {}) => {
    // Implementation for rendering React components with providers
    return component;
};
exports.renderWithProviders = renderWithProviders;
// API test helpers
const createTestServer = () => {
    // Implementation for test server creation
    return {
        listen: () => { },
        close: () => { },
    };
};
exports.createTestServer = createTestServer;
//# sourceMappingURL=index.js.map