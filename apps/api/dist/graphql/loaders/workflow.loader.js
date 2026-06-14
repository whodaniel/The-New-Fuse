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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowLoader = void 0;
/**
 * Workflow DataLoader - Migrated to Drizzle ORM
 * Provides efficient batched loading of workflows for GraphQL resolvers
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const dataloader_1 = __importDefault(require("dataloader"));
let WorkflowLoader = class WorkflowLoader {
    constructor(db) {
        this.db = db;
        this.batchWorkflows = new dataloader_1.default(async (workflowIds) => {
            // Load each workflow individually since there's no batch method
            const results = await Promise.all(workflowIds.map((id) => this.db.workflows.findWorkflowById(id)));
            return results;
        });
        this.batchWorkflowsByUser = new dataloader_1.default(async (userIds) => {
            const workflowsByUser = new Map();
            for (const userId of userIds) {
                const workflows = await this.db.workflows.findWorkflowsByCreatorId(userId);
                workflowsByUser.set(userId, workflows);
            }
            return userIds.map((userId) => workflowsByUser.get(userId) || []);
        });
        this.batchStepsByWorkflow = new dataloader_1.default(async (workflowIds) => {
            const stepsByWorkflow = new Map();
            for (const workflowId of workflowIds) {
                const steps = await this.db.workflows.findStepsByWorkflowId(workflowId);
                stepsByWorkflow.set(workflowId, steps);
            }
            return workflowIds.map((workflowId) => stepsByWorkflow.get(workflowId) || []);
        });
    }
    async load(workflowId) {
        return this.batchWorkflows.load(workflowId);
    }
    async loadMany(workflowIds) {
        return this.batchWorkflows.loadMany(workflowIds);
    }
    async loadByUserId(userId) {
        return this.batchWorkflowsByUser.load(userId);
    }
    async loadStepsByWorkflowId(workflowId) {
        return this.batchStepsByWorkflow.load(workflowId);
    }
};
exports.WorkflowLoader = WorkflowLoader;
exports.WorkflowLoader = WorkflowLoader = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], WorkflowLoader);
//# sourceMappingURL=workflow.loader.js.map