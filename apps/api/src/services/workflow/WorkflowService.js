var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let WorkflowService = class WorkflowService {
    workflows = new Map();
    async createWorkflow(data, userId) {
        const workflow = {
            id: `workflow-${Date.now()}`,
            name: data.name || 'Untitled Workflow',
            description: data.description,
            status: 'draft',
            steps: data.steps || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            userId
        };
        this.workflows.set(workflow.id, workflow);
        return workflow;
    }
    async getWorkflow(id) {
        return this.workflows.get(id) || null;
    }
    async getUserWorkflows(userId) {
        return Array.from(this.workflows.values())
            .filter(workflow => workflow.userId === userId);
    }
    async updateWorkflow(id, data) {
        const workflow = this.workflows.get(id);
        if (!workflow) {
            return null;
        }
        const updatedWorkflow = {
            ...workflow,
            ...data,
            updatedAt: new Date()
        };
        this.workflows.set(id, updatedWorkflow);
        return updatedWorkflow;
    }
    async deleteWorkflow(id) {
        return this.workflows.delete(id);
    }
    async executeWorkflow(id) {
        const workflow = this.workflows.get(id);
        if (!workflow) {
            throw new Error('Workflow not found');
        }
        workflow.status = 'running';
        workflow.updatedAt = new Date();
        try {
            // Mock execution - in real implementation, this would execute steps
            await new Promise(resolve => setTimeout(resolve, 1000));
            workflow.status = 'completed';
        }
        catch (error) {
            workflow.status = 'error';
            throw error;
        }
        finally {
            workflow.updatedAt = new Date();
        }
    }
    async pauseWorkflow(id) {
        const workflow = this.workflows.get(id);
        if (!workflow) {
            throw new Error('Workflow not found');
        }
        workflow.status = 'paused';
        workflow.updatedAt = new Date();
    }
    async resumeWorkflow(id) {
        const workflow = this.workflows.get(id);
        if (!workflow) {
            throw new Error('Workflow not found');
        }
        if (workflow.status === 'paused') {
            workflow.status = 'running';
            workflow.updatedAt = new Date();
        }
    }
};
WorkflowService = __decorate([
    Injectable()
], WorkflowService);
export { WorkflowService };
//# sourceMappingURL=WorkflowService.js.map