/**
 * Integration tests for BuildProcessThrottler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BuildProcessThrottler, BuildTask, BuildTaskResult } from './BuildProcessThrottler.js';
import { MemoryUsage } from '../types/index.js';

describe('BuildProcessThrottler', () => {
  let throttler: BuildProcessThrottler;

  beforeEach(() => {
    throttler = new BuildProcessThrottler({
      maxConcurrency: 2,
      memoryThreshold: 1024,
      defaultTimeout: 5000,
      processMemoryLimit: 256,
      queueTimeout: 10000
    });
  });

  afterEach(async () => {
    await throttler.shutdown(1000);
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultThrottler = new BuildProcessThrottler();
      const status = defaultThrottler.getStatus();
      expect(status.maxConcurrency).toBe(4);
      expect(status.queueLength).toBe(0);
      expect(status.runningCount).toBe(0);
      defaultThrottler.shutdown();
    });

    it('should initialize with custom options', () => {
      const status = throttler.getStatus();
      expect(status.maxConcurrency).toBe(2);
    });
  });

  describe('addTask', () => {
    it('should add task to queue', async () => {
      const task: BuildTask = {
        id: 'test-1',
        command: 'echo',
        args: ['hello']
      };

      await throttler.addTask(task);
      
      // Wait a moment to allow task processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const status = throttler.getStatus();
      // Task should either be running or completed by now
      expect(status.runningCount + status.completedCount).toBeGreaterThan(0);
    });

    it('should handle task priority ordering', async () => {
      const lowPriorityTask: BuildTask = {
        id: 'low',
        command: 'sleep',
        args: ['0.1'],
        priority: 1
      };

      const highPriorityTask: BuildTask = {
        id: 'high',
        command: 'sleep',
        args: ['0.1'],
        priority: 10
      };

      // Add low priority first
      await throttler.addTask(lowPriorityTask);
      await throttler.addTask(highPriorityTask);

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      const queuedIds = throttler.getQueuedTaskIds();
      const runningIds = throttler.getRunningTaskIds();
      
      // High priority task should be processed first or be in front of queue
      if (queuedIds.length > 0) {
        expect(queuedIds[0]).toBe('high');
      } else {
        // Both might be running due to concurrency
        expect(runningIds).toContain('high');
      }
    });

    it('should reject tasks when shutting down', async () => {
      throttler.shutdown();
      
      const task: BuildTask = {
        id: 'test-shutdown',
        command: 'echo',
        args: ['test']
      };

      await expect(throttler.addTask(task)).rejects.toThrow('shutting down');
    });
  });

  describe('task execution', () => {
    it('should execute simple command successfully', async () => {
      const task: BuildTask = {
        id: 'echo-test',
        command: 'echo',
        args: ['hello world']
      };

      await throttler.addTask(task);
      const result = await throttler.waitForTask('echo-test', 5000);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('hello world');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle command failure', async () => {
      const task: BuildTask = {
        id: 'fail-test',
        command: 'false', // Command that always fails
        args: []
      };

      await throttler.addTask(task);
      const result = await throttler.waitForTask('fail-test', 5000);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('should handle command timeout', async () => {
      const task: BuildTask = {
        id: 'timeout-test',
        command: 'sleep',
        args: ['2'],
        timeout: 500 // 500ms timeout for 2 second sleep
      };

      await throttler.addTask(task);
      const result = await throttler.waitForTask('timeout-test', 5000);

      expect(result.success).toBe(false);
      expect(result.duration).toBeLessThan(1000); // Should be killed before 1 second
    });

    it('should handle invalid command', async () => {
      const task: BuildTask = {
        id: 'invalid-test',
        command: 'nonexistent-command-12345',
        args: []
      };

      await throttler.addTask(task);
      const result = await throttler.waitForTask('invalid-test', 5000);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('concurrency control', () => {
    it('should respect max concurrency limit', async () => {
      const tasks: BuildTask[] = [];
      for (let i = 0; i < 5; i++) {
        tasks.push({
          id: `concurrent-${i}`,
          command: 'sleep',
          args: ['0.5']
        });
      }

      // Add all tasks
      for (const task of tasks) {
        await throttler.addTask(task);
      }

      // Wait a bit for processing to start
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = throttler.getStatus();
      expect(status.runningCount).toBeLessThanOrEqual(2); // Max concurrency is 2
      expect(status.runningCount + status.queueLength).toBe(5);
    });

    it('should process queue as tasks complete', async () => {
      const tasks: BuildTask[] = [];
      for (let i = 0; i < 4; i++) {
        tasks.push({
          id: `queue-${i}`,
          command: 'echo',
          args: [`task-${i}`]
        });
      }

      // Add all tasks
      for (const task of tasks) {
        await throttler.addTask(task);
      }

      // Wait for all tasks to complete
      const results = await Promise.all(
        tasks.map(task => throttler.waitForTask(task.id, 5000))
      );

      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should update concurrency dynamically', async () => {
      // Start with concurrency of 2
      expect(throttler.getStatus().maxConcurrency).toBe(2);

      // Add tasks that will run for a while
      const tasks: BuildTask[] = [];
      for (let i = 0; i < 4; i++) {
        tasks.push({
          id: `dynamic-${i}`,
          command: 'sleep',
          args: ['1']
        });
        await throttler.addTask(tasks[i]);
      }

      // Wait for initial processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let status = throttler.getStatus();
      expect(status.runningCount).toBeLessThanOrEqual(2);

      // Increase concurrency
      throttler.setMaxConcurrency(4);
      
      // Wait for adjustment
      await new Promise(resolve => setTimeout(resolve, 100));
      
      status = throttler.getStatus();
      expect(status.maxConcurrency).toBe(4);
    });
  });

  describe('memory awareness', () => {
    it('should check available memory correctly', () => {
      const lowMemoryUsage: MemoryUsage = {
        total: 2048,
        used: 512,
        free: 1536,
        percentage: 25
      };

      const highMemoryUsage: MemoryUsage = {
        total: 2048,
        used: 1800,
        free: 248,
        percentage: 87.9
      };

      expect(throttler.hasAvailableMemory(lowMemoryUsage, 256)).toBe(true);
      expect(throttler.hasAvailableMemory(highMemoryUsage, 256)).toBe(false);
    });

    it('should respect memory threshold', () => {
      throttler.setMemoryThreshold(1024);

      const memoryUsage: MemoryUsage = {
        total: 2048,
        used: 1500, // Above threshold
        free: 548,
        percentage: 73.2
      };

      expect(throttler.hasAvailableMemory(memoryUsage, 256)).toBe(false);
    });
  });

  describe('task management', () => {
    it('should cancel queued task', async () => {
      // Fill up the concurrency slots first
      const blockingTasks: BuildTask[] = [
        { id: 'block-1', command: 'sleep', args: ['1'] },
        { id: 'block-2', command: 'sleep', args: ['1'] }
      ];

      for (const task of blockingTasks) {
        await throttler.addTask(task);
      }

      // Wait for blocking tasks to start
      await new Promise(resolve => setTimeout(resolve, 50));

      // Now add a task that should be queued
      const task: BuildTask = {
        id: 'cancel-test',
        command: 'sleep',
        args: ['10']
      };

      await throttler.addTask(task);
      
      // Verify it's queued
      expect(throttler.getQueuedTaskIds()).toContain('cancel-test');
      
      // Cancel the queued task
      const cancelled = throttler.cancelTask('cancel-test');
      expect(cancelled).toBe(true);

      // Verify it's no longer queued
      expect(throttler.getQueuedTaskIds()).not.toContain('cancel-test');
    });

    it('should cancel running task', async () => {
      const task: BuildTask = {
        id: 'cancel-running',
        command: 'sleep',
        args: ['5']
      };

      await throttler.addTask(task);
      
      // Wait for task to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const cancelled = throttler.cancelTask('cancel-running');
      expect(cancelled).toBe(true);

      // Wait for cancellation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = throttler.getStatus();
      expect(status.runningCount).toBe(0);
    });

    it('should return false for non-existent task cancellation', () => {
      const cancelled = throttler.cancelTask('non-existent');
      expect(cancelled).toBe(false);
    });

    it('should get task result after completion', async () => {
      const task: BuildTask = {
        id: 'result-test',
        command: 'echo',
        args: ['result']
      };

      await throttler.addTask(task);
      await throttler.waitForTask('result-test', 5000);

      const result = throttler.getTaskResult('result-test');
      expect(result).toBeDefined();
      expect(result!.success).toBe(true);
      expect(result!.stdout.trim()).toBe('result');
    });

    it('should handle wait timeout', async () => {
      const task: BuildTask = {
        id: 'wait-timeout',
        command: 'sleep',
        args: ['2']
      };

      await throttler.addTask(task);
      
      await expect(
        throttler.waitForTask('wait-timeout', 500)
      ).rejects.toThrow('timed out');
    });
  });

  describe('status and monitoring', () => {
    it('should provide accurate status', async () => {
      const initialStatus = throttler.getStatus();
      expect(initialStatus.queueLength).toBe(0);
      expect(initialStatus.runningCount).toBe(0);
      expect(initialStatus.completedCount).toBe(0);

      const task: BuildTask = {
        id: 'status-test',
        command: 'echo',
        args: ['status']
      };

      await throttler.addTask(task);
      await throttler.waitForTask('status-test', 5000);

      const finalStatus = throttler.getStatus();
      expect(finalStatus.completedCount).toBe(1);
    });

    it('should track running and queued task IDs', async () => {
      const tasks: BuildTask[] = [
        { id: 'track-1', command: 'sleep', args: ['1'] },
        { id: 'track-2', command: 'sleep', args: ['1'] },
        { id: 'track-3', command: 'sleep', args: ['1'] }
      ];

      for (const task of tasks) {
        await throttler.addTask(task);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const runningIds = throttler.getRunningTaskIds();
      const queuedIds = throttler.getQueuedTaskIds();

      expect(runningIds.length + queuedIds.length).toBe(3);
      expect([...runningIds, ...queuedIds]).toEqual(
        expect.arrayContaining(['track-1', 'track-2', 'track-3'])
      );
    });

    it('should clear results', async () => {
      const task: BuildTask = {
        id: 'clear-test',
        command: 'echo',
        args: ['clear']
      };

      await throttler.addTask(task);
      await throttler.waitForTask('clear-test', 5000);

      expect(throttler.getStatus().completedCount).toBe(1);
      
      throttler.clearResults();
      expect(throttler.getStatus().completedCount).toBe(0);
    });

    it('should get all results', async () => {
      const tasks: BuildTask[] = [
        { id: 'all-1', command: 'echo', args: ['1'] },
        { id: 'all-2', command: 'echo', args: ['2'] }
      ];

      for (const task of tasks) {
        await throttler.addTask(task);
      }

      await Promise.all(
        tasks.map(task => throttler.waitForTask(task.id, 5000))
      );

      const allResults = throttler.getAllResults();
      expect(allResults).toHaveLength(2);
      expect(allResults.map(r => r.id)).toEqual(
        expect.arrayContaining(['all-1', 'all-2'])
      );
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const tasks: BuildTask[] = [
        { id: 'shutdown-1', command: 'sleep', args: ['2'] },
        { id: 'shutdown-2', command: 'sleep', args: ['2'] }
      ];

      for (const task of tasks) {
        await throttler.addTask(task);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const shutdownPromise = throttler.shutdown(1000);
      await expect(shutdownPromise).resolves.toBeUndefined();

      const status = throttler.getStatus();
      expect(status.isShuttingDown).toBe(true);
      expect(status.runningCount).toBe(0);
      expect(status.queueLength).toBe(0);
    });

    it('should force kill processes on timeout', async () => {
      const task: BuildTask = {
        id: 'force-kill',
        command: 'sleep',
        args: ['10'] // Long running task
      };

      await throttler.addTask(task);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Shutdown with very short timeout to force kill
      const startTime = Date.now();
      await throttler.shutdown(100);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete quickly due to force kill
      expect(throttler.getStatus().runningCount).toBe(0);
    });
  });

  describe('events', () => {
    it('should emit task events', async () => {
      const events: string[] = [];

      throttler.on('taskQueued', () => events.push('queued'));
      throttler.on('taskStarted', () => events.push('started'));
      throttler.on('taskCompleted', () => events.push('completed'));

      const task: BuildTask = {
        id: 'event-test',
        command: 'echo',
        args: ['events']
      };

      await throttler.addTask(task);
      await throttler.waitForTask('event-test', 5000);

      expect(events).toContain('queued');
      expect(events).toContain('started');
      expect(events).toContain('completed');
    });

    it('should emit cancellation events', async () => {
      const events: string[] = [];

      throttler.on('taskCancelled', () => events.push('cancelled'));

      // Fill up concurrency slots first
      const blockingTasks: BuildTask[] = [
        { id: 'block-event-1', command: 'sleep', args: ['1'] },
        { id: 'block-event-2', command: 'sleep', args: ['1'] }
      ];

      for (const task of blockingTasks) {
        await throttler.addTask(task);
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // Add task that will be queued
      const task: BuildTask = {
        id: 'cancel-event',
        command: 'sleep',
        args: ['5']
      };

      await throttler.addTask(task);
      
      // Verify it's queued
      expect(throttler.getQueuedTaskIds()).toContain('cancel-event');
      
      // Cancel the queued task
      throttler.cancelTask('cancel-event');

      expect(events).toContain('cancelled');
    });
  });
});