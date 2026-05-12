/**
 * Unit tests for DependencyGraphAnalyzer
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { PackageDependency } from '../types/index.js';
import { DependencyGraphAnalyzer } from './DependencyGraphAnalyzer.js';

describe('DependencyGraphAnalyzer', () => {
  let analyzer: DependencyGraphAnalyzer;

  beforeEach(() => {
    analyzer = new DependencyGraphAnalyzer('/test/workspace');
  });

  describe('getOptimalBuildOrder', () => {
    it('should return packages in dependency order', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'app',
          path: '/app',
          dependencies: ['core', 'utils'],
          devDependencies: [],
          estimatedMemoryUsage: 256,
        },
        {
          name: 'core',
          path: '/core',
          dependencies: ['utils'],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
        {
          name: 'utils',
          path: '/utils',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 64,
        },
      ];

      const buildOrder = analyzer.getOptimalBuildOrder(dependencies);

      expect(buildOrder).toEqual(['utils', 'core', 'app']);
    });

    it('should handle packages with no dependencies', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'standalone1',
          path: '/standalone1',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
        {
          name: 'standalone2',
          path: '/standalone2',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
      ];

      const buildOrder = analyzer.getOptimalBuildOrder(dependencies);

      expect(buildOrder).toHaveLength(2);
      expect(buildOrder).toContain('standalone1');
      expect(buildOrder).toContain('standalone2');
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect simple circular dependencies', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'a',
          path: '/a',
          dependencies: ['b'],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
        {
          name: 'b',
          path: '/b',
          dependencies: ['a'],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
      ];

      const cycles = analyzer.detectCircularDependencies(dependencies);

      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toContain('a');
      expect(cycles[0]).toContain('b');
    });

    it('should detect complex circular dependencies', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'a',
          path: '/a',
          dependencies: ['b'],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
        {
          name: 'b',
          path: '/b',
          dependencies: ['c'],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
        {
          name: 'c',
          path: '/c',
          dependencies: ['a'],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
      ];

      const cycles = analyzer.detectCircularDependencies(dependencies);

      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toContain('a');
      expect(cycles[0]).toContain('b');
      expect(cycles[0]).toContain('c');
    });

    it('should return empty array when no circular dependencies exist', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'a',
          path: '/a',
          dependencies: ['b'],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
        {
          name: 'b',
          path: '/b',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
      ];

      const cycles = analyzer.detectCircularDependencies(dependencies);

      expect(cycles).toHaveLength(0);
    });
  });

  describe('createBuildStages', () => {
    it('should group packages into stages based on dependencies', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'utils',
          path: '/utils',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
        {
          name: 'core',
          path: '/core',
          dependencies: ['utils'],
          devDependencies: [],
          estimatedMemoryUsage: 256,
        },
        {
          name: 'app1',
          path: '/app1',
          dependencies: ['core'],
          devDependencies: [],
          estimatedMemoryUsage: 512,
        },
        {
          name: 'app2',
          path: '/app2',
          dependencies: ['core'],
          devDependencies: [],
          estimatedMemoryUsage: 512,
        },
      ];

      const stages = analyzer.createBuildStages(dependencies, 2);

      expect(stages).toHaveLength(3);

      // First stage should contain utils
      expect(stages[0].packages).toContain('utils');

      // Second stage should contain core
      expect(stages[1].packages).toContain('core');

      // Third stage should contain apps
      expect(stages[2].packages).toContain('app1');
      expect(stages[2].packages).toContain('app2');
    });

    it('should respect memory limits when creating stages', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'heavy1',
          path: '/heavy1',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 1500, // 1.5GB
        },
        {
          name: 'heavy2',
          path: '/heavy2',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 1500, // 1.5GB
        },
        {
          name: 'light',
          path: '/light',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 100,
        },
      ];

      const stages = analyzer.createBuildStages(dependencies, 10); // Large stage size

      // Should create separate stages due to memory limits
      expect(stages.length).toBeGreaterThan(1);

      // Each stage should not exceed 2GB
      stages.forEach((stage) => {
        expect(stage.estimatedMemoryUsage).toBeLessThanOrEqual(2048);
      });
    });

    it('should mark stages as parallelizable when appropriate', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'independent1',
          path: '/independent1',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
        {
          name: 'independent2',
          path: '/independent2',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
      ];

      const stages = analyzer.createBuildStages(dependencies, 5);

      expect(stages).toHaveLength(1);
      expect(stages[0].parallelizable).toBe(true);
    });

    it('should mark stages as non-parallelizable when packages depend on each other', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'a',
          path: '/a',
          dependencies: ['b'],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
        {
          name: 'b',
          path: '/b',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
      ];

      const stages = analyzer.createBuildStages(dependencies, 5);

      // Should create separate stages due to dependency
      expect(stages.length).toBeGreaterThan(1);
    });

    it('should create stage dependencies correctly', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'base',
          path: '/base',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
        {
          name: 'derived',
          path: '/derived',
          dependencies: ['base'],
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
      ];

      const stages = analyzer.createBuildStages(dependencies, 1);

      expect(stages).toHaveLength(2);
      expect(stages[0].dependencies).toEqual([]);
      expect(stages[1].dependencies).toEqual(['stage-1']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty dependency list', () => {
      const dependencies: PackageDependency[] = [];

      const buildOrder = analyzer.getOptimalBuildOrder(dependencies);
      const stages = analyzer.createBuildStages(dependencies);
      const cycles = analyzer.detectCircularDependencies(dependencies);

      expect(buildOrder).toEqual([]);
      expect(stages).toEqual([]);
      expect(cycles).toEqual([]);
    });

    it('should handle packages with external dependencies only', () => {
      const dependencies: PackageDependency[] = [
        {
          name: 'external-only',
          path: '/external-only',
          dependencies: ['lodash', 'react'], // External dependencies
          devDependencies: [],
          estimatedMemoryUsage: 128,
        },
      ];

      const buildOrder = analyzer.getOptimalBuildOrder(dependencies);
      const stages = analyzer.createBuildStages(dependencies);

      expect(buildOrder).toEqual(['external-only']);
      expect(stages).toHaveLength(1);
      expect(stages[0].packages).toEqual(['external-only']);
    });
  });
});
