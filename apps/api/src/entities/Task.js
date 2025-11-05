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
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Pipeline } from './Pipeline';
import { TaskExecution } from './TaskExecution';
let Task = class Task {
    id;
    type;
    status;
    priority;
    data;
    result;
    error;
    startTime;
    endTime;
    pipeline;
    pipelineId;
    taskExecutions;
    createdAt;
    updatedAt;
    deletedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Task.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Task.prototype, "type", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Task.prototype, "status", void 0);
__decorate([
    Column({ default: 0 }),
    __metadata("design:type", Number)
], Task.prototype, "priority", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "data", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "result", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Task.prototype, "error", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], Task.prototype, "startTime", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], Task.prototype, "endTime", void 0);
__decorate([
    ManyToOne(() => Pipeline, pipeline => pipeline.tasks),
    __metadata("design:type", typeof (_a = typeof Pipeline !== "undefined" && Pipeline) === "function" ? _a : Object)
], Task.prototype, "pipeline", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Task.prototype, "pipelineId", void 0);
__decorate([
    OneToMany(() => TaskExecution, execution => execution.task),
    __metadata("design:type", Array)
], Task.prototype, "taskExecutions", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Task.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Task.prototype, "updatedAt", void 0);
__decorate([
    DeleteDateColumn(),
    __metadata("design:type", Date)
], Task.prototype, "deletedAt", void 0);
Task = __decorate([
    Entity()
], Task);
export { Task };
//# sourceMappingURL=Task.js.map