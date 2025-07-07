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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workflow_entity_1 = require("../entities/workflow.entity");
const core_1 = require("@the-new-fuse/core");
let WorkflowService = class WorkflowService {
    workflowRepository;
    workflowEngine;
    workflowExecutor;
    constructor(workflowRepository, workflowEngine, workflowExecutor) {
        this.workflowRepository = workflowRepository;
        this.workflowEngine = workflowEngine;
        this.workflowExecutor = workflowExecutor;
    }
    async createWorkflow(data) {
        const workflow = this.workflowRepository.create(data);
        return this.workflowRepository.save(workflow);
    }
    async getWorkflow(id) {
        return this.workflowRepository.findOne({ where: { id } });
    }
    async getWorkflows() {
        return this.workflowRepository.find();
    }
    async executeWorkflow(workflowId, input) {
        const workflow = await this.getWorkflow(workflowId);
        if (!workflow) {
            throw new Error('Workflow not found');
        }
        const executionId = await this.workflowEngine.startExecution(workflow, input);
        return executionId;
    }
    async getExecutionStatus(executionId) {
        return this.workflowExecutor.getExecutionStatus(executionId);
    }
    async updateWorkflow(id, data) {
        await this.workflowRepository.update(id, data);
        return this.getWorkflow(id);
    }
    async deleteWorkflow(id) {
        await this.workflowRepository.delete(id);
    }
    handleWorkflowResult(_result) {
        // ...existing code...
    }
};
exports.WorkflowService = WorkflowService;
exports.WorkflowService = WorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workflow_entity_1.Workflow)),
    __metadata("design:paramtypes", [typeorm_2.Repository, typeof (_a = typeof core_1.WorkflowEngine !== "undefined" && core_1.WorkflowEngine) === "function" ? _a : Object, typeof (_b = typeof core_1.WorkflowExecutor !== "undefined" && core_1.WorkflowExecutor) === "function" ? _b : Object])
], WorkflowService);
