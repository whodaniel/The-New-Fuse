/**
 * Example Core Package Test
 *
 * This demonstrates how to write unit tests for the core package.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Core Package Example Tests', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should pass a simple test', () => {
      expect(true).toBe(true);
    });

    it('should handle async operations', async () => {
      const result = await Promise.resolve(42);
      expect(result).toBe(42);
    });
  });

  describe('Mocking', () => {
    it('should mock a function', () => {
      const mockFn = vi.fn();
      mockFn('test');

      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should mock a module', () => {
      const mockModule = {
        fetchData: vi.fn().mockResolvedValue({ data: 'test' }),
      };

      expect(mockModule.fetchData()).resolves.toEqual({ data: 'test' });
    });
  });

  describe('Error handling', () => {
    it('should throw an error', () => {
      const throwError = () => {
        throw new Error('Test error');
      };

      expect(throwError).toThrow('Test error');
    });

    it('should handle async errors', async () => {
      const asyncThrow = async () => {
        throw new Error('Async error');
      };

      await expect(asyncThrow()).rejects.toThrow('Async error');
    });
  });
});
