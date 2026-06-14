"use strict";
/**
 * Test Fixtures
 *
 * Common test data and fixtures for use across the monorepo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginationFixture = exports.createErrorFixture = exports.createApiResponseFixture = exports.createMessageFixture = exports.createWorkflowFixture = exports.createAgentFixture = exports.createUserFixture = void 0;
exports.createFixtureArray = createFixtureArray;
const test_helpers_js_1 = require("../utils/test-helpers.js");
/**
 * User fixtures
 */
const createUserFixture = (overrides = {}) => ({
    id: (0, test_helpers_js_1.randomUUID)(),
    email: (0, test_helpers_js_1.randomEmail)(),
    name: `Test User ${(0, test_helpers_js_1.randomString)(5)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
exports.createUserFixture = createUserFixture;
/**
 * Agent fixtures
 */
const createAgentFixture = (overrides = {}) => ({
    id: (0, test_helpers_js_1.randomUUID)(),
    name: `Test Agent ${(0, test_helpers_js_1.randomString)(5)}`,
    type: 'test',
    status: 'active',
    capabilities: ['test-capability'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
exports.createAgentFixture = createAgentFixture;
/**
 * Workflow fixtures
 */
const createWorkflowFixture = (overrides = {}) => ({
    id: (0, test_helpers_js_1.randomUUID)(),
    name: `Test Workflow ${(0, test_helpers_js_1.randomString)(5)}`,
    description: 'Test workflow description',
    nodes: [],
    edges: [],
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
exports.createWorkflowFixture = createWorkflowFixture;
/**
 * Message fixtures
 */
const createMessageFixture = (overrides = {}) => ({
    id: (0, test_helpers_js_1.randomUUID)(),
    content: `Test message ${(0, test_helpers_js_1.randomString)(10)}`,
    role: 'user',
    timestamp: new Date(),
    ...overrides,
});
exports.createMessageFixture = createMessageFixture;
/**
 * API Response fixtures
 */
const createApiResponseFixture = (data, overrides = {}) => ({
    success: true,
    data,
    message: 'Success',
    timestamp: new Date().toISOString(),
    ...overrides,
});
exports.createApiResponseFixture = createApiResponseFixture;
/**
 * Error fixtures
 */
const createErrorFixture = (overrides = {}) => ({
    success: false,
    error: {
        code: 'TEST_ERROR',
        message: 'Test error message',
        details: {},
    },
    timestamp: new Date().toISOString(),
    ...overrides,
});
exports.createErrorFixture = createErrorFixture;
/**
 * Pagination fixtures
 */
const createPaginationFixture = (overrides = {}) => ({
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
    hasNext: true,
    hasPrev: false,
    ...overrides,
});
exports.createPaginationFixture = createPaginationFixture;
/**
 * Create array of fixtures
 */
function createFixtureArray(fixtureFactory, count, overrides) {
    return Array.from({ length: count }, (_, index) => fixtureFactory({ ...overrides, index }));
}
//# sourceMappingURL=index.js.map