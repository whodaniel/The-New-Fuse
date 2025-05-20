import { EventBus } from '../eventBus.js';
import { StateManager } from '../stateManager.js';
import { LoggingService } from '../../../services/logging.js';
export class TaskBridge {
    constructor() {
        this.communicationManager = CommunicationManager.getInstance();
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
        this.setupEventListeners();
    }
    static getInstance() {
        if (!TaskBridge.instance) {
            TaskBridge.instance = new TaskBridge();
        }
        return TaskBridge.instance;
    }
    setupEventListeners() {
        this.eventBus.on('task_update', (event) => {
            this.handleTaskUpdate(event.payload);
        });
        this.eventBus.on('task_status_change', (event) => {
            this.handleStatusChange(event.payload);
        });
    }
    handleTaskUpdate(event) {
        const { taskId, changes } = event;
        const currentTask = this.stateManager.getState(['tasks', taskId]);
        if (currentTask) {
            this.stateManager.setState(['tasks', taskId], Object.assign(Object.assign({}, currentTask), changes));
        }
    }
    handleStatusChange(event) {
        const { taskId, status } = event;
        this.stateManager.setState(['tasks', taskId, 'status'], status);
    }
    async createTask(task) {
        try {
            const response = await this.communicationManager.send({
                type: 'create_task',
                payload: task
            });
            return { success: true, data: response };
        }
        catch (error) {
            this.logger.error('Failed to create task', error);
            return {
                success: false,
                error: {
                    code: 'TASK_CREATION_FAILED',
                    message: 'Failed to create task',
                    details: error
                }
            };
        }
    }
    async getTask(taskId) {
        try {
            const task = this.stateManager.getState(['tasks', taskId]);
            if (!task) {
                const response = await this.communicationManager.send({
                    type: 'get_task',
                    payload: { taskId }
                });
                this.stateManager.setState(['tasks', taskId], response);
                return { success: true, data: response };
            }
            return { success: true, data: task };
        }
        catch (error) {
            this.logger.error('Failed to get task', error);
            return {
                success: false,
                error: {
                    code: 'TASK_NOT_FOUND',
                    message: 'Failed to get task',
                    details: error
                }
            };
        }
    }
    async updateTask(taskId, changes) {
        try {
            await this.communicationManager.send({
                type: 'update_task',
                payload: { taskId, changes }
            });
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to update task', error);
            return {
                success: false,
                error: {
                    code: 'TASK_UPDATE_FAILED',
                    message: 'Failed to update task',
                    details: error
                }
            };
        }
    }
    async updateStatus(taskId, status) {
        try {
            await this.communicationManager.send({
                type: 'update_task_status',
                payload: { taskId, status }
            });
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to update task status', error);
            return {
                success: false,
                error: {
                    code: 'STATUS_UPDATE_FAILED',
                    message: 'Failed to update task status',
                    details: error
                }
            };
        }
    }
    async assignTask(taskId, userId) {
        try {
            await this.communicationManager.send({
                type: 'assign_task',
                payload: { taskId, userId }
            });
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to assign task', error);
            return {
                success: false,
                error: {
                    code: 'TASK_ASSIGNMENT_FAILED',
                    message: 'Failed to assign task',
                    details: error
                }
            };
        }
    }
    async updatePriority(taskId, priority) {
        try {
            await this.communicationManager.send({
                type: 'update_task_priority',
                payload: { taskId, priority }
            });
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to update task priority', error);
            return {
                success: false,
                error: {
                    code: 'PRIORITY_UPDATE_FAILED',
                    message: 'Failed to update task priority',
                    details: error
                }
            };
        }
    }
    subscribeToTaskUpdates(taskId, callback) {
        return this.stateManager.subscribe(['tasks', taskId], callback);
    }
    subscribeToStatusUpdates(taskId, callback) {
        return this.stateManager.subscribe(['tasks', taskId, 'status'], callback);
    }
}
//# sourceMappingURL=TaskBridge.js.map