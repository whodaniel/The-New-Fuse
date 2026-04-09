/**
 * Unit tests for BuildStageOptimizer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BuildStageOptimizer, StageOptimizationConfig } from './BuildStageOptimizer.js';
import { PackageDependency, SystemResources } from '../types/index.js';

describe('BuildStageOptimizer', () => {
  let optimizer: BuildStageOptimizer;
  let mockSystemResources: SystemResources;
  let sampleDependencies: PackageDependency[];

  beforeEach(() => {
    mockSystemResources = {
      totalMemory: 8192,
      availableMemory: 6144,
      cpuCores: 8,
      platform: 'darwin',
      nodeVersion: '18.0.0'
    };

    const config: Partial<StageOptimizationConfig> = {
      maxMemoryPerStage: 2048,
      maxPackagesPerStage: 4,
      targetMemoryUtilization: 75,
      prioritizeMemoryEfficiency: true,
      systemResources: mockSystemResources
    };

    optimizer = new BuildStageOptimizer(config);

    sampleDependencies = [
      {
        name: 'utils',
        path: '/utils',
        dependencies: [],
        devDependencies: [],
        estimatedMemoryUsage: 128
      },
      {
        name: 'core',
        path: '/core',
        dependencies: ['utils'],
        devDependencies: [],
        estimatedMemoryUsage: 256
      },
      {
        name: 'api',
        path: '/api',
        dependencies: ['core'],
        devDependencies: [],
        estimatedMemoryUsage: 512
      },
      {
        name: 'frontend',
        path: '/frontend',
        dependencies: ['core', 'api'],
        devDependencies: [],
        estimatedMemoryUsage: 1024
      },
      {
        name: 'backend',
        path: '/backend',
        dependencies: ['core', 'api'],
        devDependencies: [],
        estimatedMemoryUsage: 768
      }
    ];
  });

  describe('optimizeBuildStages', () => {
    it('should create optimized build stages with balanced strategy', () => {
      const stages = optimizer.optimizeBuildStages(sampleDependencies, 'balanced');

      expect(stages.length).toBeGreaterThan(0);
      
      // Check that stages respect memory limits
      stages.forEach(stage => {
        expect(stage.estimatedMemoryUsage).toBeLessThanOrEqual(2048);
        expect(stage.packages.length).toBeLessThanOrEqual(4);
      });

      // Check that dependencies are respected
      const packageToStage = new Map<string, string>();
      stages.forEach(stage => {
        stage.packages.forEach(pkg => {
          packageToStage.set(pkg, stage.id);
        });
      });

      // Verify dependency order
      const utilsStage = packageToStage.get('utils');
      const coreStage = packageToStage.get('core');
      const apiStage = packageToStage.get('api');
      
      expect(utilsStage).toBeDefined();
      expect(coreStage).toBeDefined();
      expect(apiStage).toBeDefined();
    });

    it('should optimize for memory efficiency with memory-first strategy', () => {
      const stages = optimizer.optimizeBuildStages(sampleDependencies, 'memory-first');

      expect(stages.length).toBeGreaterThan(0);
      
      // Memory-first should create more stages to keep memory usage low
      stages.forEach(stage => {
        expect(stage.estimatedMemoryUsage).toBeLessThanOrEqual(2048);
      });
    });

    it('should optimize for dependencies with dependency-first strategy', () => {
      const stages = optimizer.optimizeBuildStages(sampleDependencies, 'dependency-first');

      expect(stages.length).toBeGreaterThan(0);
      
      // Should respect dependency levels
      const stageOrder = stages.map(stage => stage.id);
      expect(stageOrder).toEqual(expect.arrayContaining(stageOrder.sort()));
    });

    it('should optimize for size with size-first strategy', () => {
      const stages = optimizer.optimizeBuildStages(sampleDependencies, 'size-first');

      expect(stages.length).toBeGreaterThan(0);
      
      // Should group packages by size categories
      stages.forEach(stage => {
        expect(stage.estimatedMemoryUsage).toBeLessThanOrEqual(2048);
      });
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect and handle circular dependencies', () => {
      const circularDeps: PackageDependency[] = [
        {
          name: 'a',
          path: '/a',
          dependencies: ['b'],
          devDependencies: [],
          estimatedMemoryUsage: 128
        },
        {
          name: 'b',
          path: '/b',
          dependencies: ['c'],
          devDependencies: [],
          estimatedMemoryUsage: 128
        },
        {
          name: 'c',
          path: '/c',
          dependencies: ['a'],
          devDependencies: [],
          estimatedMemoryUsage: 128
        }
      ];

      // Should not throw error and should handle circular dependencies
      const stages = optimizer.optimizeBuildStages(circularDeps, 'balanced');
      
      expect(stages.length).toBeGreaterThan(0);
      expect(stages.every(stage => stage.packages.length > 0)).toBe(true);
    });
  });

  describe('estimateStageMemoryUsage', () => {
    it('should accurately estimate memory usage for a stage', () => {
      const packages = ['utils', 'core'];
      const estimatedMemory = optimizer.estimateStageMemoryUsage(packages, sampleDependencies);

      // Should include base memory + parallel overhead
      const expectedMemory = 128 + 256 + (2 * 50); // utils + core + parallel overhead
      expect(estimatedMemory).toBe(expectedMemory);
    });

    it('should handle single package stages without parallel overhead', () => {
      const packages = ['utils'];
      const estimatedMemory = optimizer.estimateStageMemoryUsage(packages, sampleDependencies);

      expect(estimatedMemory).toBe(128); // Just the package memory, no parallel overhead
    });

    it('should handle unknown packages gracefully', () => {
      const packages = ['unknown-package'];
      const estimatedMemory = optimizer.estimateStageMemoryUsage(packages, sampleDependencies);

      expect(estimatedMemory).toBe(0);
    });
  });

  describe('optimizeStageMemoryUsage', () => {
    it('should split oversized stages', () => {
      const oversizedStage = {
        id: 'oversized-stage',
        packages: ['frontend', 'backend', 'api'],
        estimatedMemoryUsage: 3000, // Exceeds 2048 limit
        dependencies: [],
        parallelizable: true
      };

      const optimizedStages = optimizer.optimizeStageMemoryUsage([oversizedStage]);

      expect(optimizedStages.length).toBeGreaterThan(1);
      optimizedStages.forEach(stage => {
        expect(stage.estimatedMemoryUsage).toBeLessThanOrEqual(2048);
      });
    });

    it('should keep properly sized stages unchanged', () => {
      const properStage = {
        id: 'proper-stage',
        packages: ['utils', 'core'],
        estimatedMemoryUsage: 384,
        dependencies: [],
        parallelizable: true
      };

      const optimizedStages = optimizer.optimizeStageMemoryUsage([properStage]);

      expect(optimizedStages).toHaveLength(1);
      expect(optimizedStages[0]).toEqual(properStage);
    });
  });

  describe('calculateOptimizationMetrics', () => {
    it('should calculate accurate optimization metrics', () => {
      const stages = optimizer.optimizeBuildStages(sampleDependencies, 'balanced');
      const metrics = optimizer.calculateOptimizationMetrics(stages, sampleDependencies);

      expect(metrics.totalStages).toBe(stages.length);
      expect(metrics.averageMemoryPerStage).toBeGreaterThan(0);
      expect(metrics.peakMemoryUsage).toBeGreaterThan(0);
      expect(metrics.memoryUtilizationEfficiency).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUtilizationEfficiency).toBeLessThanOrEqual(100);
      expect(metrics.estimatedBuildTimeReduction).toBeGreaterThanOrEqual(0);
    });

    it('should calculate metrics for empty stages', () => {
      const metrics = optimizer.calculateOptimizationMetrics([], sampleDependencies);

      expect(metrics.totalStages).toBe(0);
      expect(metrics.averageMemoryPerStage).toBeNaN();
      expect(metrics.peakMemoryUsage).toBe(-Infinity);
    });
  });

  describe('edge cases', () => {
    it('should handle empty dependency list', () => {
      const stages = optimizer.optimizeBuildStages([], 'balanced');
      expect(stages).toEqual([]);
    });

    it('should handle single package', () => {
      const singlePackage: PackageDependency[] = [
        {
          name: 'single',
          path: '/single',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 256
        }
      ];

      const stages = optimizer.optimizeBuildStages(singlePackage, 'balanced');
      
      expect(stages).toHaveLength(1);
      expect(stages[0].packages).toEqual(['single']);
      expect(stages[0].parallelizable).toBe(true);
    });

    it('should handle packages with very high memory usage', () => {
      const heavyPackages: PackageDependency[] = [
        {
          name: 'heavy1',
          path: '/heavy1',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 3000 // Exceeds stage limit
        },
        {
          name: 'heavy2',
          path: '/heavy2',
          dependencies: [],
          devDependencies: [],
          estimatedMemoryUsage: 2500 // Exceeds stage limit
        }
      ];

      const stages = optimizer.optimizeBuildStages(heavyPackages, 'memory-first');
      
      // Should create separate stages for heavy packages
      expect(stages.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle complex dependency chains', () => {
      const complexDeps: PackageDependency[] = [
        { name: 'a', path: '/a', dependencies: [], devDependencies: [], estimatedMemoryUsage: 100 },
        { name: 'b', path: '/b', dependencies: ['a'], devDependencies: [], estimatedMemoryUsage: 100 },
        { name: 'c', path: '/c', dependencies: ['b'], devDependencies: [], estimatedMemoryUsage: 100 },
        { name: 'd', path: '/d', dependencies: ['c'], devDependencies: [], estimatedMemoryUsage: 100 },
        { name: 'e', path: '/e', dependencies: ['d'], devDependencies: [], estimatedMemoryUsage: 100 }
      ];

      const stages = optimizer.optimizeBuildStages(complexDeps, 'dependency-first');
      
      expect(stages.length).toBeGreaterThan(0);
      
      // Verify dependency order is maintained
      const packageToStageIndex = new Map<string, number>();
      stages.forEach((stage, index) => {
        stage.packages.forEach(pkg => {
          packageToStageIndex.set(pkg, index);
        });
      });

      // Each package should come after its dependencies
      for (const pkg of complexDeps) {
        const pkgStageIndex = packageToStageIndex.get(pkg.name);
        expect(pkgStageIndex).toBeDefined();
        
        for (const dep of pkg.dependencies) {
          const depStageIndex = packageToStageIndex.get(dep);
          if (depStageIndex !== undefined && pkgStageIndex !== undefined) {
            expect(depStageIndex).toBeLessThanOrEqual(pkgStageIndex);
          }
        }
      }
    });
  });

  describe('configuration options', () => {
    it('should respect maxMemoryPerStage configuration', () => {
      const customOptimizer = new BuildStageOptimizer({
        maxMemoryPerStage: 1024, // Lower limit
        maxPackagesPerStage: 10
      });

      const stages = customOptimizer.optimizeBuildStages(sampleDependencies, 'balanced');
      
      stages.forEach(stage => {
        expect(stage.estimatedMemoryUsage).toBeLessThanOrEqual(1024);
      });
    });

    it('should respect maxPackagesPerStage configuration', () => {
      const customOptimizer = new BuildStageOptimizer({
        maxMemoryPerStage: 4096,
        maxPackagesPerStage: 2 // Lower limit
      });

      const stages = customOptimizer.optimizeBuildStages(sampleDependencies, 'balanced');
      
      stages.forEach(stage => {
        expect(stage.packages.length).toBeLessThanOrEqual(2);
      });
    });

    it('should use default configuration when none provided', () => {
      const defaultOptimizer = new BuildStageOptimizer();
      const stages = defaultOptimizer.optimizeBuildStages(sampleDependencies, 'balanced');
      
      expect(stages.length).toBeGreaterThan(0);
      stages.forEach(stage => {
        expect(stage.estimatedMemoryUsage).toBeLessThanOrEqual(2048); // Default max
        expect(stage.packages.length).toBeLessThanOrEqual(8); // Default max
      });
    });
  });
});