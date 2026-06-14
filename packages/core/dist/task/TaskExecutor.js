var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskExecutor_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'events';
let TaskExecutor = TaskExecutor_1 = class TaskExecutor extends EventEmitter {
    constructor(configService, redisService) {
        super();
        this.configService = configService;
        this.redisService = redisService;
        this.logger = new Logger(TaskExecutor_1.name);
    }
    async executeTask(task) {
        this.logger.log(`Executing task ${task.id}`);
    }
};
TaskExecutor = TaskExecutor_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService,
        UnifiedRedisService])
], TaskExecutor);
export { TaskExecutor };
//# sourceMappingURL=TaskExecutor.js.map