// Test setup file
import { Container } from 'inversify';
import 'reflect-metadata';

// Create test container
export const container = new Container();

// Add basic setup before tests
beforeAll(() => {
  // Setup code that runs before all tests
});

afterAll(() => {
  // Cleanup code that runs after all tests
});

// Simple mock factory
export function createMock<T>(overrides?: Partial<T>): T {
  return { ...overrides } as T;
};

// Reset mocks between tests
beforeEach(() => {
  jest.resetAllMocks();
});
