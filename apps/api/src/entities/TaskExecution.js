var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Task } from './Task';
let TaskExecution = class TaskExecution {
    id;
    status;
    output;
    error;
    task;
    taskId;
    startTime;
    endTime;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], TaskExecution.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], TaskExecution.prototype, "status", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TaskExecution.prototype, "output", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], TaskExecution.prototype, "error", void 0);
__decorate([
    ManyToOne(() => Task, task => task.taskExecutions),
    __metadata("design:type", typeof (_a = typeof Task !== "undefined" && Task) === "function" ? _a : Object)
], TaskExecution.prototype, "task", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], TaskExecution.prototype, "taskId", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], TaskExecution.prototype, "startTime", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], TaskExecution.prototype, "endTime", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], TaskExecution.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], TaskExecution.prototype, "updatedAt", void 0);
TaskExecution = __decorate([
    Entity()
], TaskExecution);
export { TaskExecution };
//# sourceMappingURL=TaskExecution.js.map