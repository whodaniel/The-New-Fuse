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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowStep = void 0;
const typeorm_1 = require("typeorm");
let WorkflowStep = class WorkflowStep {
    id;
    name;
    type;
    config;
    workflow;
    agent;
    nextSteps;
    conditions;
    transformations;
    metadata;
    isActive;
    createdAt;
    updatedAt;
    lastExecutedAt;
    statistics;
};
exports.WorkflowStep = WorkflowStep;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkflowStep.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowStep.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowStep.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], WorkflowStep.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => 'Workflow', (workflow) => workflow.steps),
    __metadata("design:type", Function)
], WorkflowStep.prototype, "workflow", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => 'Agent', (agent) => agent.workflowSteps, { nullable: true }),
    __metadata("design:type", Function)
], WorkflowStep.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array'),
    __metadata("design:type", Array)
], WorkflowStep.prototype, "nextSteps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkflowStep.prototype, "conditions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkflowStep.prototype, "transformations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkflowStep.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], WorkflowStep.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowStep.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowStep.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], WorkflowStep.prototype, "lastExecutedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkflowStep.prototype, "statistics", void 0);
exports.WorkflowStep = WorkflowStep = __decorate([
    (0, typeorm_1.Entity)('workflow_steps')
], WorkflowStep);
