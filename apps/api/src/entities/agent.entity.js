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
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, } from 'typeorm';
import { AgentType } from '../dtos/agent.dto';
import { User } from './user.entity';
import { Message } from './message.entity';
import { WorkflowStep } from './workflow-step.entity';
let Agent = class Agent {
    id;
    name;
    type;
    config;
    description;
    instanceId;
    isActive;
    owner;
    messages;
    workflowSteps;
    capabilities;
    metadata;
    createdAt;
    updatedAt;
    lastActiveAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Agent.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Agent.prototype, "name", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: AgentType,
    }),
    __metadata("design:type", typeof (_a = typeof AgentType !== "undefined" && AgentType) === "function" ? _a : Object)
], Agent.prototype, "type", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Agent.prototype, "config", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Agent.prototype, "description", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Agent.prototype, "instanceId", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Agent.prototype, "isActive", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.agents),
    __metadata("design:type", typeof (_b = typeof User !== "undefined" && User) === "function" ? _b : Object)
], Agent.prototype, "owner", void 0);
__decorate([
    OneToMany(() => Message, (message) => message.agent),
    __metadata("design:type", Array)
], Agent.prototype, "messages", void 0);
__decorate([
    OneToMany(() => WorkflowStep, (step) => step.agent),
    __metadata("design:type", Array)
], Agent.prototype, "workflowSteps", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Agent.prototype, "capabilities", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Agent.prototype, "metadata", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Agent.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Agent.prototype, "updatedAt", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], Agent.prototype, "lastActiveAt", void 0);
Agent = __decorate([
    Entity('agents')
], Agent);
export { Agent };
//# sourceMappingURL=agent.entity.js.map