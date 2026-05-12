/**
 * BuildProcessThrottler - Manages build process queue with memory-aware scheduling
 */

import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';
import { SystemResourceDetector } from '../system/SystemResourceDetector.js';
import { MemoryUsage } from '../types/index.js';

export interface BuildTask {
  id: string;
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  memoryLimit?: number; // MB
  priority?: number; // Higher number = higher priority
  timeout?: number; // milliseconds
}

export interface BuildTaskResult {
  id: string;
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  duration: number;
  memoryUsed?: number;
  error?: Error;
}

export interface ThrottlerOptions {
  maxConcurrency: number;
  memoryThreshold: number; // MB
  defaultTimeout: number; // milliseconds
  processMemoryLimit: number; // MB per process
  queueTimeout: number; // milliseconds to wait in queue
}

export class BuildProcessThrottler extends EventEmitter {
  private queue: BuildTask[] = [];
  private running: Map<string, ChildProcess> = new Map();
  private results: Map<string, BuildTaskResult> = new Map();
  private options: ThrottlerOptions;
  private isShuttingDown: boolean = false;

  constructor(options: Partial<ThrottlerOptions> = {}) {
    super();
    this.options = {
      maxConcurrency: 4,
      memoryThreshold: 2048, // 2GB
      defaultTimeout: 300000, // 5 minutes
      processMemoryLimit: 512, // 512MB per process
      queueTimeout: 600000, // 10 minutes
      ...options,
    };
  }

  /**
   * Add a build task to the queue
   */
  async addTask(task: BuildTask): Promise<string> {
    if (this.isShuttingDown) {
      throw new Error('Throttler is shutting down, cannot add new tasks');
    }

    // Set default values
    const fullTask: BuildTask = {
      priority: 0,
      timeout: this.options.defaultTimeout,
      memoryLimit: this.options.processMemoryLimit,
      ...task,
    };

    // Insert task in priority order (higher priority first)
    const insertIndex = this.queue.findIndex((t) => (t.priority || 0) < (fullTask.priority || 0));
    if (insertIndex === -1) {
      this.queue.push(fullTask);
    } else {
      this.queue.splice(insertIndex, 0, fullTask);
    }

    this.emit('taskQueued', { taskId: task.id, queueLength: this.queue.length });

    // Try to process the queue
    this.processQueue();

    return task.id;
  }

  /**
   * Get the result of a completed task
   */
  getTaskResult(taskId: string): BuildTaskResult | undefined {
    return this.results.get(taskId);
  }

  /**
   * Wait for a task to complete and return its result
   */
  async waitForTask(taskId: string, timeout?: number): Promise<BuildTaskResult> {
    const existingResult = this.results.get(taskId);
    if (existingResult) {
      return existingResult;
    }

    return new Promise((resolve, reject) => {
      const timeoutMs = timeout || this.options.queueTimeout;
      const timeoutId = setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const onTaskComplete = (result: BuildTaskResult) => {
        if (result.id === taskId) {
          clearTimeout(timeoutId);
          this.removeListener('taskCompleted', onTaskComplete);
          resolve(result);
        }
      };

      this.on('taskCompleted', onTaskComplete);
    });
  }

  /**
   * Cancel a queued task
   */
  cancelTask(taskId: string): boolean {
    // Remove from queue if not started
    const queueIndex = this.queue.findIndex((t) => t.id === taskId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      this.emit('taskCancelled', { taskId, reason: 'cancelled_from_queue' });
      return true;
    }

    // Kill running process if started
    const runningProcess = this.running.get(taskId);
    if (runningProcess) {
      this.killProcess(taskId, 'SIGTERM');
      this.emit('taskCancelled', { taskId, reason: 'cancelled_running_process' });
      return true;
    }

    return false;
  }

  /**
   * Update concurrency limit
   */
  setMaxConcurrency(maxConcurrency: number): void {
    this.options.maxConcurrency = Math.max(1, maxConcurrency);
    this.processQueue();
  }

  /**
   * Update memory threshold
   */
  setMemoryThreshold(memoryThreshold: number): void {
    this.options.memoryThreshold = Math.max(256, memoryThreshold);
  }

  /**
   * Check if system has enough memory to start new processes
   */
  async hasAvailableMemory(
    currentMemoryUsage: MemoryUsage,
    requiredMemory?: number
  ): Promise<boolean> {
    const required = requiredMemory || this.options.processMemoryLimit;
    const detector = SystemResourceDetector.getInstance();
    const resources = await detector.getSystemResources();
    const totalMemory = resources.totalMemory;
    const availableMemory = totalMemory - currentMemoryUsage.current;
    return availableMemory >= required && currentMemoryUsage.current < this.options.memoryThreshold;
  }

  /**
   * Get current throttler status
   */
  getStatus(): {
    queueLength: number;
    runningCount: number;
    completedCount: number;
    maxConcurrency: number;
    isShuttingDown: boolean;
  } {
    return {
      queueLength: this.queue.length,
      runningCount: this.running.size,
      completedCount: this.results.size,
      maxConcurrency: this.options.maxConcurrency,
      isShuttingDown: this.isShuttingDown,
    };
  }

  /**
   * Gracefully shutdown all processes
   */
  async shutdown(timeout: number = 30000): Promise<void> {
    this.isShuttingDown = true;

    // Clear the queue
    const queuedTasks = this.queue.splice(0);
    queuedTasks.forEach((task) => {
      this.emit('taskCancelled', { taskId: task.id, reason: 'shutdown' });
    });

    // Kill all running processes
    const runningTaskIds = Array.from(this.running.keys());
    const shutdownPromises = runningTaskIds.map((taskId) => this.killProcess(taskId, 'SIGTERM'));

    // Wait for processes to terminate or force kill after timeout
    const shutdownTimeout = setTimeout(() => {
      runningTaskIds.forEach((taskId) => {
        this.killProcess(taskId, 'SIGKILL');
      });
    }, timeout);

    try {
      await Promise.all(shutdownPromises);
      clearTimeout(shutdownTimeout);
    } catch (error) {
      // Force kill any remaining processes
      runningTaskIds.forEach((taskId) => {
        this.killProcess(taskId, 'SIGKILL');
      });
      throw error;
    }
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    if (this.isShuttingDown || this.queue.length === 0) {
      return;
    }

    // Check if we can start more processes
    const availableSlots = this.options.maxConcurrency - this.running.size;
    if (availableSlots <= 0) {
      return;
    }

    // Start as many tasks as we have slots for
    const tasksToStart = this.queue.splice(0, availableSlots);
    tasksToStart.forEach((task) => this.startTask(task));
  }

  /**
   * Start a build task
   */
  private startTask(task: BuildTask): void {
    const startTime = Date.now();

    try {
      const childProcess = spawn(task.command, task.args, {
        cwd: task.cwd || process.cwd(),
        env: { ...process.env, ...task.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.running.set(task.id, childProcess);

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.killProcess(task.id, 'SIGTERM');
      }, task.timeout || this.options.defaultTimeout);

      childProcess.on('exit', (code, signal) => {
        clearTimeout(timeoutId);
        this.running.delete(task.id);

        const duration = Date.now() - startTime;
        const result: BuildTaskResult = {
          id: task.id,
          success: code === 0,
          exitCode: code,
          stdout,
          stderr,
          duration,
        };

        this.results.set(task.id, result);
        this.emit('taskCompleted', result);

        // Process next tasks in queue
        this.processQueue();
      });

      childProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        this.running.delete(task.id);

        const duration = Date.now() - startTime;
        const result: BuildTaskResult = {
          id: task.id,
          success: false,
          exitCode: null,
          stdout,
          stderr,
          duration,
          error,
        };

        this.results.set(task.id, result);
        this.emit('taskCompleted', result);

        // Process next tasks in queue
        this.processQueue();
      });

      this.emit('taskStarted', { taskId: task.id, pid: childProcess.pid });
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: BuildTaskResult = {
        id: task.id,
        success: false,
        exitCode: null,
        stdout: '',
        stderr: '',
        duration,
        error: error as Error,
      };

      this.results.set(task.id, result);
      this.emit('taskCompleted', result);
    }
  }

  /**
   * Kill a running process
   */
  private killProcess(taskId: string, signal: NodeJS.Signals = 'SIGTERM'): Promise<void> {
    return new Promise((resolve) => {
      const process = this.running.get(taskId);
      if (!process) {
        resolve();
        return;
      }

      const onExit = () => {
        this.running.delete(taskId);
        resolve();
      };

      process.once('exit', onExit);

      try {
        process.kill(signal);

        // If SIGTERM doesn't work within 5 seconds, use SIGKILL
        if (signal === 'SIGTERM') {
          setTimeout(() => {
            if (this.running.has(taskId)) {
              process.kill('SIGKILL');
            }
          }, 5000);
        }
      } catch (error) {
        // Process might already be dead
        onExit();
      }
    });
  }

  /**
   * Clear completed task results to free memory
   */
  clearResults(): void {
    this.results.clear();
  }

  /**
   * Get all task results
   */
  getAllResults(): BuildTaskResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get running task IDs
   */
  getRunningTaskIds(): string[] {
    return Array.from(this.running.keys());
  }

  /**
   * Get queued task IDs
   */
  getQueuedTaskIds(): string[] {
    return this.queue.map((task) => task.id);
  }
}
