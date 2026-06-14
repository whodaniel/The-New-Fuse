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
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'events';
let TaskQueue = TaskQueue_1 = class TaskQueue extends EventEmitter {
    constructor(redisService, options = {}) {
        super();
        this.options = options;
        this.logger = new Logger(TaskQueue_1.name);
        this.redisService = redisService;
        this.queueKey = 'task:queue';
        this.processingKey = 'task:processing';
        this.completedKey = 'task:completed';
        this.failedKey = 'task:failed';
    }
    async addTask(taskDetails) {
        const task = {
            id: uuid(),
            status: 'pending',
            createdAt: new Date(),
            ...taskDetails,
        };
        await this.redisService.lpush(this.queueKey, JSON.stringify(task));
        return task;
    }
};
TaskQueue = TaskQueue_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UnifiedRedisService, Object])
], TaskQueue);
export { TaskQueue };
//# sourceMappingURL=TaskQueue.js.map