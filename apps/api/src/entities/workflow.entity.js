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
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, } from 'typeorm';
import { User } from './user.entity';
import { WorkflowStep } from './workflow-step.entity';
let Workflow = class Workflow {
    id;
    name;
    description;
    creator;
    steps;
    metadata;
    isActive;
    variables;
    triggers;
    createdAt;
    updatedAt;
    lastExecutedAt;
    executionCount;
    statistics;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Workflow.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Workflow.prototype, "name", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Workflow.prototype, "description", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.workflows),
    __metadata("design:type", typeof (_a = typeof User !== "undefined" && User) === "function" ? _a : Object)
], Workflow.prototype, "creator", void 0);
__decorate([
    OneToMany(() => WorkflowStep, (step) => step.workflow, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Workflow.prototype, "steps", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Workflow.prototype, "metadata", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Workflow.prototype, "isActive", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Workflow.prototype, "variables", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Workflow.prototype, "triggers", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Workflow.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Workflow.prototype, "updatedAt", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], Workflow.prototype, "lastExecutedAt", void 0);
__decorate([
    Column({ default: 0 }),
    __metadata("design:type", Number)
], Workflow.prototype, "executionCount", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Workflow.prototype, "statistics", void 0);
Workflow = __decorate([
    Entity('workflows')
], Workflow);
export { Workflow };
//# sourceMappingURL=workflow.entity.js.map