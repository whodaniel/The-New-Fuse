"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@the-new-fuse/core");
// Note: QueueService and PubSubService may need to be implemented or imported differently
let TaskService = TaskService_1 = class TaskService {
    redis;
    logger = new common_1.Logger(TaskService_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async createTask(data) {
        const taskId = `task:${Date.now()}`;
        // Store task data
        await this.redis.set(taskId, JSON.stringify(data));
        // Add to processing queue
        // await this.queue.enqueue(REDIS_QUEUES.TASK_QUEUE, {
        //   id: taskId,
        //   data,
        //   timestamp: new Date().toISOString(),
        // });
        // Notify subscribers
        // await this.pubsub.publish(REDIS_CHANNELS.TASK_UPDATES, {
        //   type: 'TASK_CREATED',
        //   taskId,
        //   data,
        // });
        return taskId;
    }
    async processTaskQueue() {
        await this.queue.process(core_1.REDIS_QUEUES.TASK_QUEUE, async (job) => {
            const { id, data } = job;
            // Process the task
            await this.processTask(id, data);
            // Update task status
            await this.pubsub.publish(core_1.REDIS_CHANNELS.TASK_UPDATES, {
                type: 'TASK_COMPLETED',
                taskId: id,
                result: 'success',
            });
        });
    }
    async processTask(id, data) {
        this.logger.log(`Processing task ${id} with data: ${JSON.stringify(data)}`);
        // Add your task processing logic here
        // For example, you might call other services, perform computations, etc.
    }
    async subscribeToTaskUpdates(callback) {
        await this.pubsub.subscribe(core_1.REDIS_CHANNELS.TASK_UPDATES, callback);
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = TaskService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.RedisService !== "undefined" && core_1.RedisService) === "function" ? _a : Object])
], TaskService);
//# sourceMappingURL=task.service.js.map