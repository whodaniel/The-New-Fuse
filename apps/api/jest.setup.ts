import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Set up global Jest environment variables
global.jest = jest;
global.describe = jest.describe;
global.expect = jest.expect;
global.it = jest.it;
global.test = jest.test;
global.beforeAll = jest.beforeAll;
global.beforeEach = jest.beforeEach;
global.afterAll = jest.afterAll;

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/fuse_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};
