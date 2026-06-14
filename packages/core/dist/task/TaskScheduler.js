var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskScheduler_1;
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskService } from './TaskService.js';
let TaskScheduler = TaskScheduler_1 = class TaskScheduler {
    constructor(taskService) {
        this.taskService = taskService;
        this.logger = new Logger(TaskScheduler_1.name);
    }
    async handleCron() {
        this.logger.debug('Called when the current second is 1');
    }
};
__decorate([
    Cron(CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaskScheduler.prototype, "handleCron", null);
TaskScheduler = TaskScheduler_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [TaskService])
], TaskScheduler);
export { TaskScheduler };
//# sourceMappingURL=TaskScheduler.js.map