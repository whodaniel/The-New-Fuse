/**
 * API Gateway Test Setup
 *
 * Setup file for API Gateway tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Extend timeout for integration tests
jest.setTimeout(10000);
