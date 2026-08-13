/**
 * Tests for BuildFailureAnalyzer
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BuildResult, MemoryUsage, SystemResources } from '../types/index.js';
import { BuildFailureAnalyzer, FailureType } from './BuildFailureAnalyzer.js';
import { DetailedBuildMetrics } from './BuildMetricsCollector.js';

describe('BuildFailureAnalyzer', () => {
  let analyzer: BuildFailureAnalyzer;
  let mockSystemResources: SystemResources;
  let mockBuildMetrics: DetailedBuildMetrics;

  beforeEach(() => {
    analyzer = new BuildFailureAnalyzer();

    mockSystemResources = {
      totalMemory: 8192,
      availableMemory: 4096,
      cpuCores: 4,
      platform: 'linux',
      nodeVersion: '18.0.0',
    };

    mockBuildMetrics = {
      totalBuildTime: 30000,
      peakMemoryUsage: 2048,
      averageMemoryUsage: 1024,
      stagesExecuted: 3,
      successfulBuilds: 5,
      failedBuilds: 2,
      memoryHistory: [],
      startTime: Date.now() - 30000,
      endTime: Date.now(),
      memorySnapshots: [],
      events: [],
      stageMetrics: [],
      performanceStats: {
        avgBuildTimePerPackage: 4285,
        memoryEfficiencyScore: 75,
        concurrencyUtilization: 80,
        cleanupTime: 500,
        memoryViolations: 0,
      },
    };
  });

  describe('Failure Analysis', () => {
    it('should detect memory exhaustion from error messages', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 30000,
        peakMemoryUsage: 7500,
        packagesBuilt: 5,
        error: 'JavaScript heap out of memory',
        metrics: mockBuildMetrics,
      };

      const errorLogs = [
        'FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory',
      ];

      const { analysis } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources,
        errorLogs
      );

      expect(analysis.type).toBe('memory-exhaustion');
      expect(analysis.confidence).toBeGreaterThan(90);
      expect(analysis.description).toContain('memory exhaustion');
    });

    it('should detect memory exhaustion from high memory usage', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 30000,
        peakMemoryUsage: 7500,
        packagesBuilt: 5,
        error: 'Build failed',
        metrics: mockBuildMetrics,
      };

      mockBuildMetrics.peakMemoryUsage = 7500; // > 90% of 8192 MB
      mockBuildMetrics.performanceStats.memoryViolations = 5;

      const { analysis } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources
      );

      expect(analysis.type).toBe('memory-exhaustion');
      expect(analysis.confidence).toBeGreaterThan(70);
    });

    it('should detect compilation errors', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 15000,
        peakMemoryUsage: 1024,
        packagesBuilt: 3,
        error: 'TypeScript error TS2304: Cannot find name',
        metrics: mockBuildMetrics,
      };

      const errorLogs = ["src/app.ts(10,5): error TS2304: Cannot find name 'unknownVariable'"];

      const { analysis } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources,
        errorLogs
      );

      expect(analysis.type).toBe('compilation-error');
      expect(analysis.confidence).toBeGreaterThan(80);
    });

    it('should detect dependency errors', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 5000,
        peakMemoryUsage: 512,
        packagesBuilt: 0,
        error: "Cannot resolve module 'missing-package'",
        metrics: mockBuildMetrics,
      };

      const { analysis } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources
      );

      expect(analysis.type).toBe('dependency-error');
      expect(analysis.confidence).toBeGreaterThan(80);
    });

    it('should detect timeout errors', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 300000, // 5 minutes
        peakMemoryUsage: 1024,
        packagesBuilt: 2,
        error: 'Build timed out after 300 seconds',
        metrics: mockBuildMetrics,
      };

      const { analysis } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources
      );

      expect(analysis.type).toBe('timeout');
      expect(analysis.confidence).toBeGreaterThan(70);
    });

    it('should handle unknown failure types', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 10000,
        peakMemoryUsage: 1024,
        packagesBuilt: 1,
        error: 'Unknown build error occurred',
        metrics: mockBuildMetrics,
      };

      const { analysis } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources
      );

      expect(analysis.type).toBe('unknown');
      expect(analysis.confidence).toBeLessThanOrEqual(60);
    });

    it('should include affected components in analysis', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 20000,
        peakMemoryUsage: 2048,
        packagesBuilt: 3,
        error: 'Build failed',
        metrics: mockBuildMetrics,
      };

      mockBuildMetrics.stageMetrics = [
        {
          stageId: 'stage-1',
          startTime: Date.now() - 20000,
          endTime: Date.now() - 15000,
          duration: 5000,
          packages: ['package-a', 'package-b'],
          peakMemoryUsage: 1024,
          success: true,
        },
        {
          stageId: 'stage-2',
          startTime: Date.now() - 15000,
          endTime: Date.now(),
          duration: 15000,
          packages: ['package-c', 'package-d'],
          peakMemoryUsage: 2048,
          success: false,
          error: 'Compilation failed',
        },
      ];

      const { analysis } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources
      );

      expect(analysis.affectedComponents).toEqual(['package-c', 'package-d']);
    });
  });

  describe('Memory Issue Analysis', () => {
    it('should recommend reducing concurrency for high memory usage', () => {
      const memoryHistory: MemoryUsage[] = [
        { current: 6500, peak: 6500, percentage: 80, timestamp: Date.now() - 10000 },
        { current: 7000, peak: 7000, percentage: 85, timestamp: Date.now() - 5000 },
        { current: 7500, peak: 7500, percentage: 92, timestamp: Date.now() },
      ];

      const recommendations = analyzer.analyzeMemoryIssues(memoryHistory, mockSystemResources);

      const criticalRec = recommendations.find((r) => r.priority === 'critical');
      expect(criticalRec).toBeDefined();
      expect(criticalRec?.title).toContain('Reduce Peak Memory Usage');
      expect(criticalRec?.configChanges?.maxConcurrency).toBeLessThanOrEqual(2);
    });

    it('should detect memory leaks from rapid growth', () => {
      const memoryHistory: MemoryUsage[] = [];
      const baseTime = Date.now() - 60000; // 1 minute ago

      // Simulate rapid memory growth (15 MB/min)
      for (let i = 0; i < 10; i++) {
        memoryHistory.push({
          current: 1000 + i * 150, // Growing by 150MB every 6 seconds
          peak: 1000 + i * 150,
          percentage: 50,
          timestamp: baseTime + i * 6000,
        });
      }

      const recommendations = analyzer.analyzeMemoryIssues(memoryHistory, mockSystemResources);

      const leakRec = recommendations.find((r) => r.title.includes('Memory Leak'));
      expect(leakRec).toBeDefined();
      expect(leakRec?.priority).toBe('high');
    });

    it('should recommend memory optimization for high average usage', () => {
      const memoryHistory: MemoryUsage[] = [
        { current: 5000, peak: 5000, percentage: 61, timestamp: Date.now() - 10000 },
        { current: 5200, peak: 5200, percentage: 63, timestamp: Date.now() - 5000 },
        { current: 5100, peak: 5200, percentage: 62, timestamp: Date.now() },
      ];

      const recommendations = analyzer.analyzeMemoryIssues(memoryHistory, mockSystemResources);

      const optimizeRec = recommendations.find((r) => r.title.includes('Memory Efficiency'));
      expect(optimizeRec).toBeDefined();
      expect(optimizeRec?.priority).toBe('medium');
    });

    it('should handle empty memory history gracefully', () => {
      const recommendations = analyzer.analyzeMemoryIssues([], mockSystemResources);
      expect(recommendations).toEqual([]);
    });
  });

  describe('System-Specific Recommendations', () => {
    it('should recommend low-memory optimizations for systems with < 4GB RAM', () => {
      const lowMemorySystem: SystemResources = {
        ...mockSystemResources,
        totalMemory: 2048,
        availableMemory: 1024,
      };

      const recommendations = analyzer.generateSystemRecommendations(
        lowMemorySystem,
        mockBuildMetrics
      );

      const lowMemRec = recommendations.find((r) => r.title.includes('Low Memory'));
      expect(lowMemRec).toBeDefined();
      expect(lowMemRec?.priority).toBe('high');
      expect(lowMemRec?.configChanges?.maxConcurrency).toBe(1);
    });

    it('should recommend high-performance optimizations for powerful systems', () => {
      const highPerfSystem: SystemResources = {
        ...mockSystemResources,
        totalMemory: 32768,
        availableMemory: 24576,
        cpuCores: 16,
      };

      const recommendations = analyzer.generateSystemRecommendations(
        highPerfSystem,
        mockBuildMetrics
      );

      const highPerfRec = recommendations.find((r) => r.title.includes('High-Performance'));
      expect(highPerfRec).toBeDefined();
      expect(highPerfRec?.priority).toBe('low');
      expect(highPerfRec?.configChanges?.maxConcurrency).toBeGreaterThan(4);
    });

    it('should provide macOS-specific recommendations', () => {
      const macSystem: SystemResources = {
        ...mockSystemResources,
        platform: 'darwin',
      };

      const recommendations = analyzer.generateSystemRecommendations(macSystem, mockBuildMetrics);

      const macRec = recommendations.find((r) => r.title.includes('macOS'));
      expect(macRec).toBeDefined();
      expect(macRec?.priority).toBe('medium');
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate appropriate recommendations for memory exhaustion', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 30000,
        peakMemoryUsage: 7500,
        packagesBuilt: 5,
        error: 'JavaScript heap out of memory',
        metrics: mockBuildMetrics,
      };

      mockBuildMetrics.peakMemoryUsage = 7500;

      const { recommendations } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources
      );

      expect(recommendations.length).toBeGreaterThan(0);

      const criticalRecs = recommendations.filter((r) => r.priority === 'critical');
      expect(criticalRecs.length).toBeGreaterThan(0);

      const memoryRec = recommendations.find((r) => r.category === 'memory');
      expect(memoryRec).toBeDefined();
    });

    it('should sort recommendations by priority', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 30000,
        peakMemoryUsage: 7500,
        packagesBuilt: 5,
        error: 'Multiple issues detected',
        metrics: mockBuildMetrics,
      };

      mockBuildMetrics.peakMemoryUsage = 7500;

      const { recommendations } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources
      );

      // Check that critical recommendations come first
      const priorities = recommendations.map((r) => r.priority);
      const criticalIndex = priorities.indexOf('critical');
      const lowIndex = priorities.indexOf('low');

      if (criticalIndex !== -1 && lowIndex !== -1) {
        expect(criticalIndex).toBeLessThan(lowIndex);
      }
    });

    it('should cache recommendations for similar failures', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 30000,
        peakMemoryUsage: 2048,
        packagesBuilt: 5,
        error: 'TypeScript error',
        metrics: mockBuildMetrics,
      };

      const { recommendations: recs1 } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources
      );

      const { recommendations: recs2 } = await analyzer.analyzeBuildFailure(
        buildResult,
        mockBuildMetrics,
        mockSystemResources
      );

      expect(recs1).toEqual(recs2);
    });
  });

  describe('Troubleshooting Log Generation', () => {
    it('should generate comprehensive troubleshooting log', () => {
      const analysis = {
        type: 'memory-exhaustion' as FailureType,
        confidence: 95,
        description: 'Build failed due to memory exhaustion',
        rootCause: 'System memory exhausted',
        affectedComponents: ['package-a', 'package-b'],
        memoryAtFailure: {
          current: 7500,
          peak: 7500,
          percentage: 92,
          timestamp: Date.now(),
        },
      };

      mockBuildMetrics.memorySnapshots = [
        { current: 1000, peak: 1000, percentage: 12, timestamp: Date.now() - 10000 },
        { current: 5000, peak: 5000, percentage: 61, timestamp: Date.now() - 5000 },
        { current: 7500, peak: 7500, percentage: 92, timestamp: Date.now() },
      ];

      mockBuildMetrics.events = [
        {
          type: 'build-started',
          timestamp: Date.now() - 30000,
          payload: { startTime: Date.now() - 30000 },
        },
        {
          type: 'memory-threshold-exceeded',
          timestamp: Date.now() - 5000,
          payload: { threshold: 80 },
        },
      ];

      const log = analyzer.generateTroubleshootingLog(
        analysis,
        mockBuildMetrics,
        mockSystemResources
      );

      expect(log).toContain('Build Failure Troubleshooting Log');
      expect(log).toContain('FAILURE ANALYSIS');
      expect(log).toContain('Type: memory-exhaustion');
      expect(log).toContain('Confidence: 95%');
      expect(log).toContain('SYSTEM INFORMATION');
      expect(log).toContain('Platform: linux');
      expect(log).toContain('BUILD METRICS');
      expect(log).toContain('MEMORY USAGE TIMELINE');
      expect(log).toContain('RECENT EVENTS');
      expect(log).toContain('MEMORY AT FAILURE');
    });
  });

  describe('Analysis History', () => {
    it('should track analysis history', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 30000,
        peakMemoryUsage: 2048,
        packagesBuilt: 5,
        error: 'Build failed',
        metrics: mockBuildMetrics,
      };

      expect(analyzer.getAnalysisHistory()).toHaveLength(0);

      await analyzer.analyzeBuildFailure(buildResult, mockBuildMetrics, mockSystemResources);

      expect(analyzer.getAnalysisHistory()).toHaveLength(1);

      await analyzer.analyzeBuildFailure(buildResult, mockBuildMetrics, mockSystemResources);

      expect(analyzer.getAnalysisHistory()).toHaveLength(2);
    });

    it('should clear analysis history', async () => {
      const buildResult: BuildResult = {
        success: false,
        duration: 30000,
        peakMemoryUsage: 2048,
        packagesBuilt: 5,
        error: 'Build failed',
        metrics: mockBuildMetrics,
      };

      await analyzer.analyzeBuildFailure(buildResult, mockBuildMetrics, mockSystemResources);

      expect(analyzer.getAnalysisHistory()).toHaveLength(1);

      analyzer.clearHistory();

      expect(analyzer.getAnalysisHistory()).toHaveLength(0);
    });
  });

  describe('Event Emission', () => {
    it('should emit analysis complete event', async () => {
      const eventSpy = vi.fn();
      analyzer.on('analysis-complete', eventSpy);

      const buildResult: BuildResult = {
        success: false,
        duration: 30000,
        peakMemoryUsage: 2048,
        packagesBuilt: 5,
        error: 'Build failed',
        metrics: mockBuildMetrics,
      };

      await analyzer.analyzeBuildFailure(buildResult, mockBuildMetrics, mockSystemResources);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          analysis: expect.any(Object),
          recommendations: expect.any(Array),
        })
      );
    });
  });
});
