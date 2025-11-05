var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Agent } from './Agent';
import { Task } from './Task';
import { User } from './User';
let Pipeline = class Pipeline {
    id;
    name;
    description;
    configuration;
    user;
    userId;
    agent;
    agentId;
    tasks;
    createdAt;
    updatedAt;
    deletedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Pipeline.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Pipeline.prototype, "name", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Pipeline.prototype, "description", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Pipeline.prototype, "configuration", void 0);
__decorate([
    ManyToOne(() => User, user => user.pipelines),
    __metadata("design:type", typeof (_a = typeof User !== "undefined" && User) === "function" ? _a : Object)
], Pipeline.prototype, "user", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Pipeline.prototype, "userId", void 0);
__decorate([
    ManyToOne(() => Agent, agent => agent.pipelines),
    __metadata("design:type", typeof (_b = typeof Agent !== "undefined" && Agent) === "function" ? _b : Object)
], Pipeline.prototype, "agent", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Pipeline.prototype, "agentId", void 0);
__decorate([
    OneToMany(() => Task, task => task.pipeline),
    __metadata("design:type", Array)
], Pipeline.prototype, "tasks", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Pipeline.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Pipeline.prototype, "updatedAt", void 0);
__decorate([
    DeleteDateColumn(),
    __metadata("design:type", Date)
], Pipeline.prototype, "deletedAt", void 0);
Pipeline = __decorate([
    Entity()
], Pipeline);
export { Pipeline };
//# sourceMappingURL=Pipeline.js.map