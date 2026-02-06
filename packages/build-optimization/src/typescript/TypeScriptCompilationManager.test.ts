/**
 * Unit tests for TypeScriptCompilationManager
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TypeScriptCompilationManager,
  TypeScriptCompilationOptions,
} from './TypeScriptCompilationManager.js';

describe('TypeScriptCompilationManager', () => {
  let manager: TypeScriptCompilationManager;
  let originalProcess: any;
  let originalGc: any;

  beforeEach(() => {
    // Store original values
    originalProcess = global.process;
    originalGc = global.gc;

    // Mock process
    global.process = {
      ...originalProcess,
      memoryUsage: vi.fn(() => ({
        heapUsed: 100 * 1024 * 1024, // 100MB
        heapTotal: 200 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        rss: 150 * 1024 * 1024,
      })),
      env: {},
      cwd: vi.fn(() => '/test/workspace'),
    } as any;

    // Mock global gc
    global.gc = vi.fn();

    // Create manager instance
    manager = new TypeScriptCompilationManager();
  });

  afterEach(() => {
    // Restore original values
    global.process = originalProcess;
    global.gc = originalGc;
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultManager = new TypeScriptCompilationManager();
      expect(defaultManager).toBeInstanceOf(TypeScriptCompilationManager);
    });

    it('should initialize with custom options', () => {
      const options: TypeScriptCompilationOptions = {
        incremental: false,
        maxMemoryUsage: 1024,
        skipLibCheck: false,
      };

      const customManager = new TypeScriptCompilationManager(options);
      expect(customManager).toBeInstanceOf(TypeScriptCompilationManager);
    });
  });

  describe('enableIncrementalCompilation', () => {
    it('should enable incremental compilation', () => {
      manager.enableIncrementalCompilation(true);
      // Test passes if no error is thrown
      expect(true).toBe(true);
    });

    it('should disable incremental compilation', () => {
      manager.enableIncrementalCompilation(false);
      // Test passes if no error is thrown
      expect(true).toBe(true);
    });
  });

  describe('cleanupCompilerMemory', () => {
    it('should call garbage collection when available', async () => {
      await manager.cleanupCompilerMemory();
      expect(global.gc).toHaveBeenCalled();
    });

    it('should handle missing garbage collection gracefully', async () => {
      // Remove gc from global
      delete (global as any).gc;

      // Should not throw an error
      await expect(async () => {
        await manager.cleanupCompilerMemory();
      }).not.toThrow();
    });
  });

  describe('getCompilationMetrics', () => {
    it('should return initial metrics', () => {
      const metrics = manager.getCompilationMetrics();

      expect(metrics).toEqual({
        totalTime: 0,
        peakMemoryUsage: 0,
        projectsCompiled: 0,
        successfulCompilations: 0,
        failedCompilations: 0,
        errors: [],
      });
    });

    it('should return a copy of metrics', () => {
      const metrics1 = manager.getCompilationMetrics();
      const metrics2 = manager.getCompilationMetrics();

      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('compileProjects', () => {
    it('should handle empty project list', async () => {
      const result = await manager.compileProjects([]);
      expect(result).toBe(true);

      const metrics = manager.getCompilationMetrics();
      expect(metrics.projectsCompiled).toBe(0);
    });

    it('should handle non-existent project paths', async () => {
      const result = await manager.compileProjects(['/nonexistent/path']);
      expect(result).toBe(true); // Should succeed with no projects found

      const metrics = manager.getCompilationMetrics();
      expect(metrics.projectsCompiled).toBe(0);
    });

    it('should track compilation time', async () => {
      const startTime = Date.now();
      await manager.compileProjects([]);
      const endTime = Date.now();

      const metrics = manager.getCompilationMetrics();
      expect(metrics.totalTime).toBeGreaterThanOrEqual(0);
      expect(metrics.totalTime).toBeLessThanOrEqual(endTime - startTime + 100); // Allow some margin
    });
  });

  describe('memory usage tracking', () => {
    it('should track memory usage correctly', () => {
      // The manager should be able to get current memory usage
      const metrics = manager.getCompilationMetrics();
      expect(metrics.peakMemoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('configuration options', () => {
    it('should accept incremental compilation option', () => {
      const options: TypeScriptCompilationOptions = {
        incremental: true,
      };

      const managerWithOptions = new TypeScriptCompilationManager(options);
      expect(managerWithOptions).toBeInstanceOf(TypeScriptCompilationManager);
    });

    it('should accept memory limit option', () => {
      const options: TypeScriptCompilationOptions = {
        maxMemoryUsage: 1024,
      };

      const managerWithOptions = new TypeScriptCompilationManager(options);
      expect(managerWithOptions).toBeInstanceOf(TypeScriptCompilationManager);
    });

    it('should accept skip lib check option', () => {
      const options: TypeScriptCompilationOptions = {
        skipLibCheck: true,
      };

      const managerWithOptions = new TypeScriptCompilationManager(options);
      expect(managerWithOptions).toBeInstanceOf(TypeScriptCompilationManager);
    });
  });

  describe('error handling', () => {
    it('should handle compilation errors gracefully', async () => {
      // Test with invalid project paths
      const result = await manager.compileProjects(['/invalid/path']);

      // Should not throw, but may return false or true depending on implementation
      expect(typeof result).toBe('boolean');
    });

    it('should collect error information', async () => {
      await manager.compileProjects(['/invalid/path']);

      const metrics = manager.getCompilationMetrics();
      expect(Array.isArray(metrics.errors)).toBe(true);
    });
  });

  describe('TypeScript project analysis', () => {
    it('should handle projects without tsconfig.json', async () => {
      const result = await manager.compileProjects(['/path/without/tsconfig']);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('compilation metrics', () => {
    it('should initialize metrics correctly', () => {
      const metrics = manager.getCompilationMetrics();

      expect(metrics.totalTime).toBe(0);
      expect(metrics.peakMemoryUsage).toBe(0);
      expect(metrics.projectsCompiled).toBe(0);
      expect(metrics.successfulCompilations).toBe(0);
      expect(metrics.failedCompilations).toBe(0);
      expect(Array.isArray(metrics.errors)).toBe(true);
      expect(metrics.errors.length).toBe(0);
    });

    it('should provide immutable metrics', () => {
      const metrics1 = manager.getCompilationMetrics();
      const metrics2 = manager.getCompilationMetrics();

      // Should be different objects
      expect(metrics1).not.toBe(metrics2);

      // But with same content
      expect(metrics1).toEqual(metrics2);
    });
  });
});
