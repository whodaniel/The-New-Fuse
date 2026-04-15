/**
 * BuildOrchestrator Integration Tests
 * 
 * Comprehensive tests for build orchestration including component integration,
 * memory monitoring, staged builds, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { BuildOrchestrator } from './BuildOrchestrator.js';
import {
  ISystemResourceDetector,
  IMemoryMonitor,
  IDependencyGraphAnalyzer,
  IConcurrencyController,
  ITypeScriptCompilationManager
} from '../interfaces/index.js';
import {
  SystemResources,
  MemoryUsage,
  BuildStrategy,
  BuildStage,
  PackageDependency,
  BuildEventData
} from '../types/index.js';

// Mock implementations
class MockSystemResourceDetector implements ISystemResourceDetector {
  async getSystemResources(): Promise<SystemResources> {
    return {
      totalMemory: 8192,
      availableMemory: 4096,
      cpuCores: 4,
      platform: 'darwin',
      nodeVersion: '18.0.0'
    };
  }

  getCurrentMemoryUsage(): MemoryUsage {
    return {
      current: 2048,
      peak: 2048,
      percentage: 50,
      timestamp: Date.now()
    };
  }

  hasSufficientResources(requiredMemory: number): boolean {
    return requiredMemory <= 4096;
  }
}

class MockMemoryMonitor implements IMemoryMonitor {
  private isMonitoring = false;
  private threshold = 80;
  private callbacks: Array<(usage: MemoryUsage) => void> = [];

  startMonitoring(interval?: number): void {
    this.isMonitoring = true;
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  getCurrentUsage(): MemoryUsage {
    return {
      current: 2048,
      peak: 2500,
      percentage: 50,
      timestamp: Date.now()
    };
  }

  setThreshold(percentage: number): void {
    this.threshold = percentage;
  }

  onThresholdExceeded(callback: (usage: MemoryUsage) => void): void {
    this.callbacks.push(callback);
  }

  cleanup(): void {
    this.callbacks = [];
  }

  // Test helper methods
  simulateThresholdExceeded(): void {
    const usage: MemoryUsage = {
      current: 3500,
      peak: 3500,
      percentage: 85,
      timestamp: Date.now()
    };
    this.callbacks.forEach(callback => callback(usage));
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}

class MockDependencyGraphAnalyzer implements IDependencyGraphAnalyzer {
  async analyzeDependencies(workspaceRoot: string): Promise<PackageDependency[]> {
    return [
      {
        name: '@test/package-a',
        path: '/test/package-a',
        dependencies: [],
        devDependencies: [],
        estimatedMemoryUsage: 512
      },
      {
        name: '@test/package-b',
        path: '/test/package-b',
        dependencies: ['@test/package-a'],
        devDependencies: [],
        estimatedMemoryUsage: 768
      },
      {
        name: '@test/package-c',
        path: '/test/package-c',
        dependencies: ['@test/package-a'],
        devDependencies: [],
        estimatedMemoryUsage: 1024
      }
    ];
  }

  createBuildStages(dependencies: PackageDependency[], stageSize: number): BuildStage[] {
    return [
      {
        id: 'stage-1',
        packages: ['@test/package-a'],
        estimatedMemoryUsage: 512,
        dependencies: [],
        parallelizable: true
      },
      {
        id: 'stage-2',
        packages: ['@test/package-b', '@test/package-c'],
        estimatedMemoryUsage: 1792,
        dependencies: ['stage-1'],
        parallelizable: true
      }
    ];
  }

  getOptimalBuildOrder(dependencies: PackageDependency[]): string[] {
    return ['@test/package-a', '@test/package-b', '@test/package-c'];
  }

  detectCircularDependencies(dependencies: PackageDependency[]): string[][] {
    return [];
  }
}

class MockConcurrencyController implements IConcurrencyController {
  private currentConcurrency = 2;
  private maxConcurrency = 4;

  getCurrentConcurrency(): number {
    return this.currentConcurrency;
  }

  setMaxConcurrency(max: number): void {
    this.maxConcurrency = max;
    this.currentConcurrency = Math.min(this.currentConcurrency, max);
  }

  adjustConcurrency(memoryUsage: MemoryUsage): void {
    if (memoryUsage.percentage > 80) {
      this.currentConcurrency = Math.max(1, Math.floor(this.currentConcurrency * 0.75));
    } else if (memoryUsage.percentage < 60) {
      this.currentConcurrency = Math.min(this.maxConcurrency, this.currentConcurrency + 1);
    }
  }

  calculateOptimalConcurrency(systemResources: SystemResources): number {
    return Math.min(systemResources.cpuCores, Math.floor(systemResources.availableMemory / 1024));
  }

  resetConcurrency(): void {
    this.currentConcurrency = 2;
  }
}

class MockTypeScriptCompilationManager implements ITypeScriptCompilationManager {
  private compiledProjects: string[] = [];

  async compileProjects(projects: string[], options?: any): Promise<boolean> {
    this.compiledProjects.push(...projects);
    return true;
  }

  enableIncrementalCompilation(enabled: boolean): void {
    // Mock implementation
  }

  cleanupCompilerMemory(): void {
    // Mock implementation
  }

  getCompilationMetrics(): any {
    return {
      compiledProjects: this.compiledProjects.length,
      totalTime: 1000
    };
  }

  getCompiledProjects(): string[] {
    return [...this.compiledProjects];
  }

  resetCompiledProjects(): void {
    this.compiledProjects = [];
  }
}

describe('BuildOrchestrator', () => {
  let orchestrator: BuildOrchestrator;
  let mockSystemResourceDetector: MockSystemResourceDetector;
  let mockMemoryMonitor: MockMemoryMonitor;
  let mockDependencyAnalyzer: MockDependencyGraphAnalyzer;
  let mockConcurrencyController: MockConcurrencyController;
  let mockTypeScriptManager: MockTypeScriptCompilationManager;

  beforeEach(() => {
    mockSystemResourceDetector = new MockSystemResourceDetector();
    mockMemoryMonitor = new MockMemoryMonitor();
    mockDependencyAnalyzer = new MockDependencyGraphAnalyzer();
    mockConcurrencyController = new MockConcurrencyController();
    mockTypeScriptManager = new MockTypeScriptCompilationManager();

    orchestrator = new BuildOrchestrator(
      '/test/workspace',
      mockSystemResourceDetector,
      mockMemoryMonitor,
      mockDependencyAnalyzer,
      mockConcurrencyController,
      mockTypeScriptManager
    );
  });

  afterEach(() => {
    orchestrator.stopBuild();
    mockMemoryMonitor.cleanup();
  });

  describe('Build Execution', () => {
    it('should execute build successfully with development strategy', async () => {
      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      const result = await orchestrator.executeBuild(strategy);

      expect(result.success).toBe(true);
      expect(result.packagesBuilt).toBe(3);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.metrics.stagesExecuted).toBe(2);
      expect(result.metrics.successfulBuilds).toBe(3);
      expect(result.metrics.failedBuilds).toBe(0);
    }, 10000); // Increase timeout

    it('should handle build failure gracefully', async () => {
      // Mock a failure in dependency analysis
      vi.spyOn(mockDependencyAnalyzer, 'analyzeDependencies').mockRejectedValue(
        new Error('Failed to analyze dependencies')
      );

      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      const result = await orchestrator.executeBuild(strategy);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to analyze dependencies');
      expect(result.packagesBuilt).toBe(0);
    });

    it('should prevent concurrent builds', async () => {
      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      // Start first build
      const buildPromise = orchestrator.executeBuild(strategy);

      // Try to start second build
      await expect(orchestrator.executeBuild(strategy)).rejects.toThrow('Build already in progress');

      // Wait for first build to complete
      await buildPromise;
    });

    it('should stop build when requested', async () => {
      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      // Start build and immediately stop it
      const buildPromise = orchestrator.executeBuild(strategy);
      
      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      orchestrator.stopBuild();
      const result = await buildPromise;

      expect(result.success).toBe(false);
    });
  });

  describe('Strategy Selection', () => {
    it('should select ultra-memory-optimized strategy for low memory systems', () => {
      const lowMemoryResources: SystemResources = {
        totalMemory: 4096,
        availableMemory: 2048, // 2GB available
        cpuCores: 2,
        platform: 'linux',
        nodeVersion: '18.0.0'
      };

      const strategy = orchestrator.determineOptimalStrategy(lowMemoryResources);

      expect(strategy.maxConcurrency).toBe(1);
      expect(strategy.memoryThreshold).toBe(55);
      expect(strategy.stageSize).toBe(4);
      expect(strategy.enableIncremental).toBe(true);
      expect(strategy.cleanupBetweenStages).toBe(true);
    });

    it('should select development strategy for medium memory systems', () => {
      const mediumMemoryResources: SystemResources = {
        totalMemory: 8192,
        availableMemory: 6144, // 6GB available
        cpuCores: 4,
        platform: 'darwin',
        nodeVersion: '18.0.0'
      };

      const strategy = orchestrator.determineOptimalStrategy(mediumMemoryResources);

      expect(strategy.maxConcurrency).toBe(2);
      expect(strategy.memoryThreshold).toBe(65);
      expect(strategy.stageSize).toBe(6);
      expect(strategy.enableIncremental).toBe(true);
      expect(strategy.cleanupBetweenStages).toBe(true);
    });

    it('should select production strategy for high memory systems', () => {
      const highMemoryResources: SystemResources = {
        totalMemory: 16384,
        availableMemory: 12288, // 12GB available
        cpuCores: 8,
        platform: 'linux',
        nodeVersion: '18.0.0'
      };

      const strategy = orchestrator.determineOptimalStrategy(highMemoryResources);

      expect(strategy.maxConcurrency).toBe(6); // min(8 cores, 12GB/2)
      expect(strategy.memoryThreshold).toBe(80);
      expect(strategy.stageSize).toBe(12);
      expect(strategy.enableIncremental).toBe(false);
      expect(strategy.cleanupBetweenStages).toBe(true);
    });
  });

  describe('Memory Monitoring and Adjustment', () => {
    it('should start and stop memory monitoring during build', async () => {
      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      expect(mockMemoryMonitor.isCurrentlyMonitoring()).toBe(false);

      const buildPromise = orchestrator.executeBuild(strategy);
      
      // Give it a moment to start monitoring
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockMemoryMonitor.isCurrentlyMonitoring()).toBe(true);

      await buildPromise;
      expect(mockMemoryMonitor.isCurrentlyMonitoring()).toBe(false);
    }, 10000);

    it('should adjust concurrency when memory threshold is exceeded', async () => {
      const strategy: BuildStrategy = {
        maxConcurrency: 4,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      const events: BuildEventData[] = [];
      orchestrator.onBuildEvent((event) => {
        events.push(event);
      });

      const buildPromise = orchestrator.executeBuild(strategy);
      
      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate memory threshold exceeded
      mockMemoryMonitor.simulateThresholdExceeded();
      
      await buildPromise;

      // Check that memory threshold exceeded event was emitted
      const memoryEvents = events.filter(e => e.type === 'memory-threshold-exceeded');
      expect(memoryEvents.length).toBeGreaterThan(0);

      // Check that concurrency was adjusted
      const concurrencyEvents = events.filter(e => e.type === 'concurrency-adjusted');
      expect(concurrencyEvents.length).toBeGreaterThan(0);
    });

    it('should monitor and adjust during build execution', () => {
      orchestrator.monitorAndAdjust();

      // Should not throw and should update internal metrics
      expect(() => orchestrator.monitorAndAdjust()).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    it('should emit build events during execution', async () => {
      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      const events: BuildEventData[] = [];
      orchestrator.onBuildEvent((event) => {
        events.push(event);
      });

      await orchestrator.executeBuild(strategy);

      // Check that key events were emitted
      const eventTypes = events.map(e => e.type);
      expect(eventTypes).toContain('build-started');
      expect(eventTypes).toContain('stage-started');
      expect(eventTypes).toContain('stage-completed');
      expect(eventTypes).toContain('build-completed');
    });

    it('should emit build-failed event on error', async () => {
      // Mock a failure
      vi.spyOn(mockDependencyAnalyzer, 'analyzeDependencies').mockRejectedValue(
        new Error('Test error')
      );

      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      const events: BuildEventData[] = [];
      orchestrator.onBuildEvent((event) => {
        events.push(event);
      });

      await orchestrator.executeBuild(strategy);

      const eventTypes = events.map(e => e.type);
      expect(eventTypes).toContain('build-failed');
    });
  });

  describe('TypeScript Integration', () => {
    it('should use TypeScript manager for incremental builds', async () => {
      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      mockTypeScriptManager.resetCompiledProjects();

      await orchestrator.executeBuild(strategy);

      // Should have compiled some projects (mocked to return true for 70% of packages)
      const compiledProjects = mockTypeScriptManager.getCompiledProjects();
      expect(compiledProjects.length).toBeGreaterThan(0);
    });

    it('should cleanup TypeScript memory between stages', async () => {
      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      const cleanupSpy = vi.spyOn(mockTypeScriptManager, 'cleanupCompilerMemory');

      await orchestrator.executeBuild(strategy);

      // Should have called cleanup at least once (between stages and at end)
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Component Integration', () => {
    it('should integrate all components correctly', async () => {
      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      // Spy on key methods to verify integration
      const analyzeDependenciesSpy = vi.spyOn(mockDependencyAnalyzer, 'analyzeDependencies');
      const createBuildStagesSpy = vi.spyOn(mockDependencyAnalyzer, 'createBuildStages');
      const setMaxConcurrencySpy = vi.spyOn(mockConcurrencyController, 'setMaxConcurrency');
      const startMonitoringSpy = vi.spyOn(mockMemoryMonitor, 'startMonitoring');
      const setThresholdSpy = vi.spyOn(mockMemoryMonitor, 'setThreshold');

      await orchestrator.executeBuild(strategy);

      // Verify all components were used
      expect(analyzeDependenciesSpy).toHaveBeenCalled();
      expect(createBuildStagesSpy).toHaveBeenCalled();
      expect(setMaxConcurrencySpy).toHaveBeenCalledWith(strategy.maxConcurrency);
      expect(startMonitoringSpy).toHaveBeenCalled();
      expect(setThresholdSpy).toHaveBeenCalledWith(strategy.memoryThreshold);
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle dependency analysis errors', async () => {
      vi.spyOn(mockDependencyAnalyzer, 'analyzeDependencies').mockRejectedValue(
        new Error('Dependency analysis failed')
      );

      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      const result = await orchestrator.executeBuild(strategy);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Dependency analysis failed');
    });

    it('should handle build stage creation errors', async () => {
      vi.spyOn(mockDependencyAnalyzer, 'createBuildStages').mockImplementation(() => {
        throw new Error('Stage creation failed');
      });

      const strategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      const result = await orchestrator.executeBuild(strategy);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Stage creation failed');
    });
  });
});