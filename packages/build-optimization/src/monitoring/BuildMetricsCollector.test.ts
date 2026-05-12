/**
 * Tests for BuildMetricsCollector
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BuildEventData, MemoryUsage } from '../types/index.js';
import { BuildMetricsCollector } from './BuildMetricsCollector.js';

describe('BuildMetricsCollector', () => {
  let collector: BuildMetricsCollector;

  beforeEach(() => {
    collector = new BuildMetricsCollector(100); // Fast interval for testing
  });

  afterEach(() => {
    if (collector) {
      collector.stopCollection();
    }
  });

  describe('Collection Lifecycle', () => {
    it('should start and stop collection properly', async () => {
      expect(collector.getMetrics().startTime).toBe(0);

      collector.startCollection();
      expect(collector.getMetrics().startTime).toBeGreaterThan(0);

      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay

      collector.stopCollection();
      expect(collector.getMetrics().endTime).toBeGreaterThan(0);
      expect(collector.getMetrics().totalBuildTime).toBeGreaterThan(0);
    });

    it('should not start collection twice', () => {
      const startTime1 = collector.getMetrics().startTime;
      collector.startCollection();
      const startTime2 = collector.getMetrics().startTime;
      collector.startCollection(); // Second call should be ignored
      const startTime3 = collector.getMetrics().startTime;

      expect(startTime1).toBe(0);
      expect(startTime2).toBeGreaterThan(0);
      expect(startTime3).toBe(startTime2); // Should not change
    });

    it('should handle stop without start gracefully', () => {
      expect(() => collector.stopCollection()).not.toThrow();
    });

    it('should reset metrics on start', () => {
      // Add some data
      collector.startCollection();
      collector.recordSuccessfulBuild('test-package', 1000);
      collector.stopCollection();

      expect(collector.getMetrics().successfulBuilds).toBe(1);

      // Start again should reset
      collector.startCollection();
      expect(collector.getMetrics().successfulBuilds).toBe(0);
    });
  });

  describe('Event Recording', () => {
    beforeEach(() => {
      collector.startCollection();
    });

    it('should record build events', () => {
      const event: BuildEventData = {
        type: 'build-started',
        timestamp: Date.now(),
        payload: { test: 'data' },
      };

      collector.recordEvent(event);

      const metrics = collector.getMetrics();
      expect(metrics.events).toHaveLength(2); // build-started from startCollection + our event
      expect(metrics.events[1]).toEqual(event);
    });

    it('should handle stage events', async () => {
      collector.recordEvent({
        type: 'stage-started',
        timestamp: Date.now(),
        payload: { stageId: 'test-stage' },
      });

      // Wait a bit to simulate stage duration
      await new Promise((resolve) => setTimeout(resolve, 10));

      collector.recordEvent({
        type: 'stage-completed',
        timestamp: Date.now(),
        payload: {},
      });

      const metrics = collector.getMetrics();
      expect(metrics.stagesExecuted).toBe(1);
      expect(metrics.stageMetrics).toHaveLength(1);
      expect(metrics.stageMetrics[0].stageId).toBe('test-stage');
      expect(metrics.stageMetrics[0].success).toBe(true);
    });

    it('should track memory threshold violations', () => {
      collector.recordEvent({
        type: 'memory-threshold-exceeded',
        timestamp: Date.now(),
        payload: { threshold: 80 },
      });

      collector.recordEvent({
        type: 'memory-threshold-exceeded',
        timestamp: Date.now(),
        payload: { threshold: 90 },
      });

      const metrics = collector.getMetrics();
      expect(metrics.performanceStats.memoryViolations).toBe(2);
    });

    it('should not record events when not collecting', () => {
      // Create a fresh collector for this test
      const freshCollector = new BuildMetricsCollector(100);

      // Don't start collection, just try to record an event
      freshCollector.recordEvent({
        type: 'build-started',
        timestamp: Date.now(),
        payload: {},
      });

      const metrics = freshCollector.getMetrics();
      // Should have no events since collection never started
      expect(metrics.events.length).toBe(0);
    });
  });

  describe('Memory Tracking', () => {
    beforeEach(() => {
      collector.startCollection();
    });

    it('should record memory snapshots', () => {
      const usage: MemoryUsage = {
        current: 100,
        peak: 120,
        percentage: 50,
        timestamp: Date.now(),
      };

      collector.recordMemorySnapshot(usage);

      const metrics = collector.getMetrics();
      expect(metrics.memorySnapshots).toEqual([usage]);
      expect(metrics.memoryHistory).toEqual([usage]);
      expect(metrics.peakMemoryUsage).toBe(100);
    });

    it('should update peak memory usage', () => {
      collector.recordMemorySnapshot({
        current: 100,
        peak: 100,
        percentage: 50,
        timestamp: Date.now(),
      });

      collector.recordMemorySnapshot({
        current: 150,
        peak: 150,
        percentage: 75,
        timestamp: Date.now(),
      });

      collector.recordMemorySnapshot({
        current: 80,
        peak: 150,
        percentage: 40,
        timestamp: Date.now(),
      });

      const metrics = collector.getMetrics();
      expect(metrics.peakMemoryUsage).toBe(150);
    });

    it('should track memory in current stage', () => {
      collector.recordEvent({
        type: 'stage-started',
        timestamp: Date.now(),
        payload: { stageId: 'memory-test-stage' },
      });

      collector.recordMemorySnapshot({
        current: 200,
        peak: 200,
        percentage: 80,
        timestamp: Date.now(),
      });

      collector.recordEvent({
        type: 'stage-completed',
        timestamp: Date.now(),
        payload: {},
      });

      const metrics = collector.getMetrics();
      expect(metrics.stageMetrics[0].peakMemoryUsage).toBe(200);
    });

    it('should start memory monitoring automatically', async () => {
      // Memory monitoring should start automatically with collection
      await new Promise((resolve) => setTimeout(resolve, 150)); // Wait for monitoring interval

      const metrics = collector.getMetrics();
      expect(metrics.memorySnapshots.length).toBeGreaterThan(0);
    });
  });

  describe('Build Tracking', () => {
    beforeEach(() => {
      collector.startCollection();
    });

    it('should record successful builds', () => {
      collector.recordSuccessfulBuild('package-a', 1000);
      collector.recordSuccessfulBuild('package-b', 2000);

      const metrics = collector.getMetrics();
      expect(metrics.successfulBuilds).toBe(2);
      expect(metrics.failedBuilds).toBe(0);
    });

    it('should record failed builds', () => {
      // Create a fresh collector for this test
      const freshCollector = new BuildMetricsCollector(100);
      freshCollector.startCollection();

      freshCollector.recordFailedBuild('package-c', 'Compilation error');
      freshCollector.recordFailedBuild('package-d', 'Memory exhausted');

      const metrics = freshCollector.getMetrics();
      expect(metrics.successfulBuilds).toBe(0);
      expect(metrics.failedBuilds).toBe(2);

      freshCollector.stopCollection();
    });

    it('should track packages in current stage', () => {
      collector.recordEvent({
        type: 'stage-started',
        timestamp: Date.now(),
        payload: { stageId: 'package-stage' },
      });

      collector.recordSuccessfulBuild('package-1', 1000);
      collector.recordSuccessfulBuild('package-2', 1500);

      collector.recordEvent({
        type: 'stage-completed',
        timestamp: Date.now(),
        payload: {},
      });

      const metrics = collector.getMetrics();
      expect(metrics.stageMetrics[0].packages).toEqual(['package-1', 'package-2']);
    });
  });

  describe('Performance Statistics', () => {
    beforeEach(() => {
      collector.startCollection();
    });

    it('should calculate average build time per package', async () => {
      collector.recordSuccessfulBuild('pkg-1', 1000);
      collector.recordSuccessfulBuild('pkg-2', 2000);
      collector.recordFailedBuild('pkg-3', 'Error');

      await new Promise((resolve) => setTimeout(resolve, 50));
      collector.stopCollection();

      const metrics = collector.getMetrics();
      expect(metrics.performanceStats.avgBuildTimePerPackage).toBeGreaterThan(0);
    });

    it('should calculate memory efficiency score', () => {
      collector.recordMemorySnapshot({
        current: 500,
        peak: 500,
        percentage: 50,
        timestamp: Date.now(),
      });

      collector.stopCollection();

      const metrics = collector.getMetrics();
      expect(metrics.performanceStats.memoryEfficiencyScore).toBeGreaterThan(0);
      expect(metrics.performanceStats.memoryEfficiencyScore).toBeLessThanOrEqual(100);
    });

    it('should calculate average memory usage', () => {
      collector.recordMemorySnapshot({
        current: 100,
        peak: 100,
        percentage: 25,
        timestamp: Date.now(),
      });

      collector.recordMemorySnapshot({
        current: 200,
        peak: 200,
        percentage: 50,
        timestamp: Date.now(),
      });

      collector.stopCollection();

      const metrics = collector.getMetrics();
      expect(metrics.averageMemoryUsage).toBe(150);
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      collector.startCollection();
    });

    it('should generate comprehensive build report', async () => {
      // Simulate a build process
      collector.recordEvent({
        type: 'stage-started',
        timestamp: Date.now(),
        payload: { stageId: 'frontend-stage' },
      });

      collector.recordSuccessfulBuild('frontend-app', 2000);
      collector.recordMemorySnapshot({
        current: 150,
        peak: 150,
        percentage: 60,
        timestamp: Date.now(),
      });

      collector.recordEvent({
        type: 'stage-completed',
        timestamp: Date.now(),
        payload: {},
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      collector.stopCollection();

      const report = collector.generateReport();

      expect(report).toContain('Build Metrics Report');
      expect(report).toContain('Duration:');
      expect(report).toContain('Peak Memory Usage:');
      expect(report).toContain('Successful Builds: 1');
      expect(report).toContain('Failed Builds: 0');
      expect(report).toContain('Success Rate: 100.0%');
      expect(report).toContain('Stage Breakdown:');
      expect(report).toContain('frontend-stage ✓');
      expect(report).toContain('frontend-app');
    });

    it('should handle empty metrics in report', () => {
      collector.stopCollection();

      const report = collector.generateReport();
      expect(report).toContain('Successful Builds: 0');
      expect(report).toContain('Failed Builds: 0');
      expect(report).toContain('Success Rate: 0%');
    });

    it('should show failed stages in report', () => {
      collector.recordEvent({
        type: 'stage-started',
        timestamp: Date.now(),
        payload: { stageId: 'failed-stage' },
      });

      collector.recordFailedBuild('broken-package', 'Syntax error');

      collector.recordEvent({
        type: 'build-failed',
        timestamp: Date.now(),
        payload: { error: 'Stage failed due to compilation errors' },
      });

      collector.stopCollection();

      const report = collector.generateReport();
      expect(report).toContain('failed-stage ✗');
      expect(report).toContain('Error: Syntax error'); // The error from recordFailedBuild
    });
  });

  describe('Event Emission', () => {
    it('should emit collection events', () => {
      const startSpy = vi.fn();
      const stopSpy = vi.fn();
      const eventSpy = vi.fn();

      collector.on('collection-started', startSpy);
      collector.on('collection-stopped', stopSpy);
      collector.on('event-recorded', eventSpy);

      collector.startCollection();
      expect(startSpy).toHaveBeenCalled();

      collector.recordEvent({
        type: 'build-started',
        timestamp: Date.now(),
        payload: {},
      });
      expect(eventSpy).toHaveBeenCalled();

      collector.stopCollection();
      expect(stopSpy).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Metrics Immutability', () => {
    it('should return deep copy of metrics', () => {
      collector.startCollection();
      collector.recordSuccessfulBuild('test-pkg', 1000);

      const metrics1 = collector.getMetrics();
      const metrics2 = collector.getMetrics();

      // Should be equal but not the same object
      expect(metrics1).toEqual(metrics2);
      expect(metrics1).not.toBe(metrics2);

      // Modifying returned metrics should not affect internal state
      metrics1.successfulBuilds = 999;
      expect(collector.getMetrics().successfulBuilds).toBe(1);
    });
  });
});
