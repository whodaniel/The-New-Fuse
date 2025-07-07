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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_ts_1 = require("@core/redis/redis.service.ts");
const queue_service_1 = require("@core/redis/queue.service");
const pubsub_service_1 = require("@core/redis/pubsub.service");
const redis_config_1 = require("@core/config/redis.config");
let TaskService = class TaskService {
    redis;
    queue;
    pubsub;
    constructor(redis, queue, pubsub) {
        this.redis = redis;
        this.queue = queue;
        this.pubsub = pubsub;
    }
    async createTask(data) {
        const taskId = `task:${Date.now()}`;
        // Store task data
        await this.redis.set(taskId, JSON.stringify(data));
        // Add to processing queue
        await this.queue.enqueue(redis_config_1.REDIS_QUEUES.TASK_QUEUE, {
            id: taskId,
            data,
            timestamp: new Date().toISOString(),
        });
        // Notify subscribers
        await this.pubsub.publish(redis_config_1.REDIS_CHANNELS.TASK_UPDATES, {
            type: 'TASK_CREATED',
            taskId,
            data,
        });
        return taskId;
    }
    async processTaskQueue() {
        await this.queue.process(redis_config_1.REDIS_QUEUES.TASK_QUEUE, async (job) => {
            const { id, data } = job;
            // Process the task
            await this.processTask(id, data);
            // Update task status
            await this.pubsub.publish(redis_config_1.REDIS_CHANNELS.TASK_UPDATES, {
                type: 'TASK_COMPLETED',
                taskId: id,
                result: 'success',
            });
        });
    }
    async subscribeToTaskUpdates(callback) {
        await this.pubsub.subscribe(redis_config_1.REDIS_CHANNELS.TASK_UPDATES, callback);
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_service_ts_1.RedisService !== "undefined" && redis_service_ts_1.RedisService) === "function" ? _a : Object, typeof (_b = typeof queue_service_1.QueueService !== "undefined" && queue_service_1.QueueService) === "function" ? _b : Object, typeof (_c = typeof pubsub_service_1.PubSubService !== "undefined" && pubsub_service_1.PubSubService) === "function" ? _c : Object])
], TaskService);
