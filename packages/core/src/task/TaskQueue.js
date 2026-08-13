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
var TaskQueue_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueue = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const events_1 = require("events");
let TaskQueue = TaskQueue_1 = class TaskQueue extends events_1.EventEmitter {
    constructor(redisService, options = {}) {
        super();
        this.options = options;
        this.logger = new common_1.Logger(TaskQueue_1.name);
        this.redisService = redisService;
        this.queueKey = 'task:queue';
        this.processingKey = 'task:processing';
        this.completedKey = 'task:completed';
        this.failedKey = 'task:failed';
    }
    async addTask(taskDetails) {
        const task = {
            id: (0, uuid_1.v4)(),
            status: 'pending',
            createdAt: new Date(),
            ...taskDetails,
        };
        await this.redisService.lpush(this.queueKey, JSON.stringify(task));
        return task;
    }
};
exports.TaskQueue = TaskQueue;
exports.TaskQueue = TaskQueue = TaskQueue_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [infrastructure_1.UnifiedRedisService, Object])
], TaskQueue);
//# sourceMappingURL=TaskQueue.js.map