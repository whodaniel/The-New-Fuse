export class ProgressTracker extends EventEmitter {
    constructor() {
        super();
        this.tasks = new Map();
    }
    static getInstance() {
        if (!ProgressTracker.instance) {
            ProgressTracker.instance = new ProgressTracker();
        }
        return ProgressTracker.instance;
    }
    startTask(type, metadata) {
        const id = crypto.randomUUID();
        const task = {
            id,
            type,
            status: 'pending',
            progress: 0,
            metadata
        };
        this.tasks.set(id, task);
        this.emit('taskStarted', task);
        return id;
    }
    updateProgress(id, progress, message) {
        const task = this.tasks.get(id);
        if (task) {
            task.status = 'in_progress';
            task.progress = Math.min(Math.max(progress, 0), 100);
            task.message = message;
            this.emit('taskProgress', task);
        }
    }
    completeTask(id, message) {
        const task = this.tasks.get(id);
        if (task) {
            task.status = 'completed';
            task.progress = 100;
            task.message = message;
            this.emit('taskCompleted', task);
        }
    }
    failTask(id, error) {
        const task = this.tasks.get(id);
        if (task) {
            task.status = 'failed';
            task.error = error;
            this.emit('taskFailed', task);
        }
    }
    getTask(id) {
        return this.tasks.get(id);
    }
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    removeTask(id) {
        if (this.tasks.has(id)) {
            const task = this.tasks.get(id);
            this.tasks.delete(id);
            this.emit('taskRemoved', task);
        }
    }
    clearCompletedTasks() {
        const completedTasks = [];
        this.tasks.forEach((task, id) => {
            if (task.status === 'completed') {
                completedTasks.push(task);
                this.tasks.delete(id);
            }
        });
        if (completedTasks.length > 0) {
            this.emit('tasksCleared', completedTasks);
        }
    }
}
//# sourceMappingURL=progress_tracker.js.map