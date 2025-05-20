export {}
exports.ProgressTracker = void 0;
import logging_config_1 from './logging_config.js';
class ProgressTracker {
    constructor() {
        this.tasks = {};
        this.metrics = {};
        this.logger = (0, logging_config_1.getLogger)('progress_tracker');
    }
    async monitorTask(taskId) {
        this.logger.info(`Starting to monitor task: ${taskId}`);
        while (taskId in this.tasks) {
            try {
                const status = await this.getTaskStatus(taskId);
                this.updateMetrics(taskId, status);
                if (this.shouldAdjustStrategy(taskId)) {
                    await this.optimizeExecution(taskId);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                this.logger.error(`Error monitoring task ${taskId}: ${error instanceof Error ? error.message : String(error)}`);
                break;
            }
        }
        this.logger.info(`Stopped monitoring task: ${taskId}`);
    }
    updateMetrics(taskId, status) {
        if (!(taskId in this.metrics)) {
            this.metrics[taskId] = {
                progress: [],
                timestamps: [],
                performance_metrics: {
                    cpu_usage: [],
                    memory_usage: [],
                    response_time: []
                }
            };
        }
        const currentMetrics = this.metrics[taskId];
        currentMetrics.progress.push(status.progress);
        currentMetrics.timestamps.push(Date.now());
        if (status.metrics && currentMetrics.performance_metrics) {
            if (status.metrics.cpu_usage !== undefined) {
                currentMetrics.performance_metrics.cpu_usage.push(status.metrics.cpu_usage);
            }
            if (status.metrics.memory_usage !== undefined) {
                currentMetrics.performance_metrics.memory_usage.push(status.metrics.memory_usage);
            }
            if (status.metrics.response_time !== undefined) {
                currentMetrics.performance_metrics.response_time.push(status.metrics.response_time);
            }
        }
        this.logger.debug(`Updated metrics for task ${taskId}`, {
            progress: status.progress,
            metrics: status.metrics
        });
    }
    async optimizeExecution(taskId) {
        const task = this.tasks[taskId];
        if (!task) {
            this.logger.warn(`Cannot optimize execution: Task ${taskId} not found`);
            return;
        }
        if (task.performance_below_threshold()) {
            this.logger.info(`Performance below threshold for task ${taskId}, rebalancing resources`);
            await this.rebalanceResources(task);
        }
    }
    async getTaskStatus(taskId) {
        const task = this.tasks[taskId];
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }
        try {
            return {
                progress: task.progress,
                performance_below_threshold: task.performance_below_threshold,
                metrics: {
                    cpu_usage: Math.random() * 100,
                    memory_usage: Math.random() * 100,
                    response_time: Math.random() * 1000
                }
            };
        }
        catch (error) {
            this.logger.error(`Error getting status for task ${taskId}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    shouldAdjustStrategy(taskId) {
        const metrics = this.metrics[taskId];
        if (!metrics || metrics.progress.length < 2) {
            return false;
        }
        const recentProgress = metrics.progress.slice(-5);
        const progressRate = (recentProgress[recentProgress.length - 1] - recentProgress[0]) /
            (metrics.timestamps[metrics.timestamps.length - 1] - metrics.timestamps[metrics.timestamps.length - 5]);
        const MIN_PROGRESS_RATE = 0.01;
        return progressRate < MIN_PROGRESS_RATE;
    }
    async rebalanceResources(task) {
        try {
            this.logger.info('Rebalancing resources for task', {
                current_metrics: task.metrics
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            this.logger.info('Resources rebalanced successfully');
        }
        catch (error) {
            this.logger.error(`Error rebalancing resources: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    addTask(taskId, initialProgress = 0) {
        this.tasks[taskId] = {
            progress: initialProgress,
            performance_below_threshold: () => this.shouldAdjustStrategy(taskId)
        };
        this.logger.info(`Added new task: ${taskId}`);
    }
    removeTask(taskId) {
        delete this.tasks[taskId];
        this.logger.info(`Removed task: ${taskId}`);
    }
    getProgress(taskId) {
        const task = this.tasks[taskId];
        return task ? task.progress : null;
    }
    getTaskMetrics(taskId) {
        return this.metrics[taskId] || null;
    }
}
exports.ProgressTracker = ProgressTracker;
export {};
//# sourceMappingURL=progress_tracker.js.map