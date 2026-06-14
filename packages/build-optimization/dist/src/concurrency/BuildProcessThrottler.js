/**
 * BuildProcessThrottler - Manages build process queue with memory-aware scheduling
 */
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { SystemResourceDetector } from '../system/SystemResourceDetector.js';
export class BuildProcessThrottler extends EventEmitter {
    queue = [];
    running = new Map();
    results = new Map();
    options;
    isShuttingDown = false;
    constructor(options = {}) {
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
    async addTask(task) {
        if (this.isShuttingDown) {
            throw new Error('Throttler is shutting down, cannot add new tasks');
        }
        // Set default values
        const fullTask = {
            priority: 0,
            timeout: this.options.defaultTimeout,
            memoryLimit: this.options.processMemoryLimit,
            ...task,
        };
        // Insert task in priority order (higher priority first)
        const insertIndex = this.queue.findIndex((t) => (t.priority || 0) < (fullTask.priority || 0));
        if (insertIndex === -1) {
            this.queue.push(fullTask);
        }
        else {
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
    getTaskResult(taskId) {
        return this.results.get(taskId);
    }
    /**
     * Wait for a task to complete and return its result
     */
    async waitForTask(taskId, timeout) {
        const existingResult = this.results.get(taskId);
        if (existingResult) {
            return existingResult;
        }
        return new Promise((resolve, reject) => {
            const timeoutMs = timeout || this.options.queueTimeout;
            const timeoutId = setTimeout(() => {
                reject(new Error(`Task ${taskId} timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            const onTaskComplete = (result) => {
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
    cancelTask(taskId) {
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
    setMaxConcurrency(maxConcurrency) {
        this.options.maxConcurrency = Math.max(1, maxConcurrency);
        this.processQueue();
    }
    /**
     * Update memory threshold
     */
    setMemoryThreshold(memoryThreshold) {
        this.options.memoryThreshold = Math.max(256, memoryThreshold);
    }
    /**
     * Check if system has enough memory to start new processes
     */
    async hasAvailableMemory(currentMemoryUsage, requiredMemory) {
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
    getStatus() {
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
    async shutdown(timeout = 30000) {
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
        }
        catch (error) {
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
    processQueue() {
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
    startTask(task) {
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
                const result = {
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
                const result = {
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
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const result = {
                id: task.id,
                success: false,
                exitCode: null,
                stdout: '',
                stderr: '',
                duration,
                error: error,
            };
            this.results.set(task.id, result);
            this.emit('taskCompleted', result);
        }
    }
    /**
     * Kill a running process
     */
    killProcess(taskId, signal = 'SIGTERM') {
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
            }
            catch (error) {
                // Process might already be dead
                onExit();
            }
        });
    }
    /**
     * Clear completed task results to free memory
     */
    clearResults() {
        this.results.clear();
    }
    /**
     * Get all task results
     */
    getAllResults() {
        return Array.from(this.results.values());
    }
    /**
     * Get running task IDs
     */
    getRunningTaskIds() {
        return Array.from(this.running.keys());
    }
    /**
     * Get queued task IDs
     */
    getQueuedTaskIds() {
        return this.queue.map((task) => task.id);
    }
}
//# sourceMappingURL=BuildProcessThrottler.js.map