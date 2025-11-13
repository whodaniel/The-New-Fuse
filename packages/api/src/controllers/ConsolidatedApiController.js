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
import { Controller, Get, Post, Put, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard';
import { AgentService } from '../services/agent.service';
import { WorkflowService } from '../services/workflow.service';
// Assuming TaskService and UserService exist in ../services/
// import { TaskService } from '../services/task.service';
// import { UserService } from '../services/user.service';
import { CurrentUser } from '../modules/decorators/current-user.decorator';
let ConsolidatedApiController = class ConsolidatedApiController {
    agentService;
    workflowService;
    constructor(agentService, workflowService) {
        this.agentService = agentService;
        this.workflowService = workflowService;
    }
    // Batch Agent Operations
    async batchAgentOperations(request, user) {
        const startTime = Date.now();
        const results = [];
        for (const operation of request.operations) {
            try {
                let result;
                switch (operation.action) {
                    case 'create':
                        result = await this.agentService.createAgent({ ...operation.data, userId: user.id }, user.id);
                        break;
                    case 'update':
                        result = await this.agentService.updateAgent(operation.id, operation.data, user.id);
                        break;
                    case 'delete':
                        result = await this.agentService.deleteAgent(operation.id, user.id);
                        break;
                }
                results.push({
                    id: operation.id || result.id,
                    action: operation.action,
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                results.push({
                    id: operation.id || 'unknown',
                    action: operation.action,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        const duration = Date.now() - startTime;
        const successful = results.filter(r => r.success).length;
        return {
            results,
            summary: {
                total: request.operations.length,
                successful,
                failed: results.length - successful,
                duration,
            },
        };
    }
    // Multi-Resource Fetch (replaces multiple API calls)
    async multiFetch(request, user) {
        const startTime = Date.now();
        let totalQueries = 0;
        const response = { meta: { totalQueries: 0, duration: 0 } };
        // Fetch agents with specified relations
        if (request.agents?.length) {
            const agentPromises = request.agents.map(async (req) => {
                totalQueries++;
                // Assuming findOneWithRelations exists or can be implemented in AgentService
                return this.agentService.getAgentById(req.id, user.id);
            });
            response.agents = await Promise.all(agentPromises);
        }
        // Fetch workflows with specified relations
        if (request.workflows?.length) {
            const workflowPromises = request.workflows.map(async (req) => {
                totalQueries++;
                // Assuming findOneWithRelations exists or can be implemented in WorkflowService
                return this.workflowService.getWorkflowById(req.id, user.id);
            });
            response.workflows = await Promise.all(workflowPromises);
        }
        // Fetch tasks with specified relations
        if (request.tasks?.length) {
            const taskPromises = request.tasks.map(async (req) => {
                totalQueries++;
                // Assuming findOneWithRelations exists or can be implemented in TaskService
                // return this.taskService.findOneWithRelations(req.id, {
                //   include: req.include,
                //   select: req.fields,
                //   userId: user.id,
                // });
                return null; // Placeholder
            });
            response.tasks = await Promise.all(taskPromises);
        }
        response.meta = {
            totalQueries,
            duration: Date.now() - startTime,
        };
        return response;
    }
    // Dashboard Data Aggregation (replaces multiple dashboard API calls)
    async getDashboardData(user) {
        // Execute all queries in parallel for maximum efficiency
        const [agentCount, activeWorkflows, 
        // pendingTasks,
        recentActivity, recentAgents, workflows, 
        // urgentTasks,
        systemHealth,] = await Promise.all([
            this.agentService.getAgents(user.id).then(agents => agents.length), // Assuming countByUser is not directly available
            this.workflowService.getWorkflows(user.id).then(workflows => workflows.filter(w => w.status === 'active').length), // Assuming countActive is not directly available
            // this.taskService.countPending(user.id),
            this.getRecentActivityCount(user.id),
            this.agentService.getAgents(user.id).then(agents => agents.slice(0, 5)), // Assuming findRecent is not directly available
            this.workflowService.getWorkflows(user.id).then(workflows => workflows.filter(w => w.status === 'active').slice(0, 5)), // Assuming findActive is not directly available
            // this.taskService.findUrgent(user.id, 10),
            this.getSystemHealth(),
        ]);
        return {
            summary: {
                agentCount,
                activeWorkflows,
                pendingTasks: 0, // Placeholder
                recentActivity: recentActivity,
            },
            recentAgents,
            activeWorkflows: workflows,
            urgentTasks: [], // Placeholder
            systemHealth: {
                status: systemHealth.status,
                uptime: systemHealth.uptime,
                lastCheck: new Date(),
            },
            performance: {
                averageResponseTime: systemHealth.avgResponseTime,
                successRate: systemHealth.successRate,
                activeConnections: systemHealth.connections,
            },
        };
    }
    // Bulk Status Updates (common operation for workflows/tasks)
    async bulkStatusUpdate(request, user) {
        const results = {
            updated: { agents: 0, workflows: 0, tasks: 0 },
            errors: []
        };
        // Update agent statuses
        if (request.agents?.length) {
            for (const { id, status } of request.agents) {
                try {
                    await this.agentService.updateAgent(id, { status: status }, user.id); // Cast status to any for now
                    results.updated.agents++;
                }
                catch (error) {
                    results.errors.push({ type: 'agent', id, error: error instanceof Error ? error.message : String(error) });
                }
            }
        }
        // Update workflow statuses
        if (request.workflows?.length) {
            for (const { id, status } of request.workflows) {
                try {
                    await this.workflowService.updateWorkflow(id, { status: status }, user.id); // Cast status to any for now
                    results.updated.workflows++;
                }
                catch (error) {
                    results.errors.push({ type: 'workflow', id, error: error instanceof Error ? error.message : String(error) });
                }
            }
        }
        // Update task statuses
        if (request.tasks?.length) {
            for (const { id, status } of request.tasks) {
                try {
                    // await this.taskService.updateStatus(id, status, user.id);
                    // results.updated.tasks++;
                }
                catch (error) {
                    results.errors.push({ type: 'task', id, error: error instanceof Error ? error.message : String(error) });
                }
            }
        }
        return results;
    }
    // Search Across All Resources
    async globalSearch(query, types = 'agents,workflows,tasks', limit = 10, user) {
        const startTime = Date.now();
        const searchTypes = types.split(',');
        const results = { agents: [], workflows: [], tasks: [], total: 0 };
        const searchPromises = [];
        if (searchTypes.includes('agents')) {
            searchPromises.push(this.agentService.getAgents(user.id).then((r) => ({ type: 'agents', data: r.filter((agent) => agent.name.includes(query)).slice(0, limit) })) // Assuming search method is not directly available
            );
        }
        if (searchTypes.includes('workflows')) {
            searchPromises.push(this.workflowService.getWorkflows(user.id).then((r) => ({ type: 'workflows', data: r.filter((workflow) => workflow.name.includes(query)).slice(0, limit) })) // Assuming search method is not directly available
            );
        }
        if (searchTypes.includes('tasks')) {
            searchPromises.push(
            // this.taskService.search(query, user.id, limit).then((r: any) => ({ type: 'tasks', data: r }))
            Promise.resolve({ type: 'tasks', data: [] }) // Placeholder
            );
        }
        const searchResults = await Promise.all(searchPromises);
        searchResults.forEach(result => {
            results[result.type] = result.data;
            results.total += result.data.length;
        });
        return {
            ...results,
            searchTime: Date.now() - startTime,
        };
    }
    // Analytics Aggregation
    async getAnalyticsSummary(period = '7d', user) {
        const [agentMetrics, workflowMetrics, performanceMetrics] = await Promise.all([
            this.agentService.getAgents(user.id).then(agents => ({ count: agents.length, creationTrend: [] })), // Assuming getMetrics is not directly available
            this.workflowService.getWorkflows(user.id).then(workflows => ({ count: workflows.length, executionTrend: [] })), // Assuming getMetrics is not directly available
            // this.taskService.getMetrics(user.id, period),
            this.getPerformanceMetrics(period),
        ]);
        const taskMetrics = { count: 0, completionTrend: [] }; // Placeholder
        return {
            period,
            metrics: {
                agentMetrics,
                workflowMetrics,
                taskMetrics: { count: 0, completionTrend: [] }, // Placeholder
                performanceMetrics,
            },
            trends: {
                agentCreation: agentMetrics.creationTrend || [],
                workflowExecution: workflowMetrics.executionTrend || [],
                taskCompletion: taskMetrics.completionTrend || [],
            },
            topPerformers: {
                agents: [], // Placeholder - topPerformers not available in mock metrics
                workflows: [], // Placeholder - topPerformers not available in mock metrics
            },
        };
    }
    // Helper methods
    async getRecentActivityCount(userId) {
        // Implementation for recent activity count
        return 42; // Mock value
    }
    async getSystemHealth() {
        // Implementation for system health check
        return {
            status: 'healthy',
            uptime: 99.9,
            avgResponseTime: 150,
            successRate: 99.5,
            connections: 25,
        };
    }
    async getPerformanceMetrics(period) {
        // Implementation for performance metrics
        return {
            responseTime: 145,
            throughput: 1250,
            errorRate: 0.5,
            availability: 99.9,
        };
    }
};
__decorate([
    Post('agents/batch'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConsolidatedApiController.prototype, "batchAgentOperations", null);
__decorate([
    Post('resources/multi-fetch'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConsolidatedApiController.prototype, "multiFetch", null);
__decorate([
    Get('dashboard/aggregate'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConsolidatedApiController.prototype, "getDashboardData", null);
__decorate([
    Put('status/bulk-update'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConsolidatedApiController.prototype, "bulkStatusUpdate", null);
__decorate([
    Get('search/global'),
    __param(0, Query('q')),
    __param(1, Query('types')),
    __param(2, Query('limit')),
    __param(3, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], ConsolidatedApiController.prototype, "globalSearch", null);
__decorate([
    Get('analytics/summary'),
    __param(0, Query('period')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConsolidatedApiController.prototype, "getAnalyticsSummary", null);
ConsolidatedApiController = __decorate([
    Controller('api/v2'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentService !== "undefined" && AgentService) === "function" ? _a : Object, typeof (_b = typeof WorkflowService !== "undefined" && WorkflowService) === "function" ? _b : Object])
], ConsolidatedApiController);
export { ConsolidatedApiController };
//# sourceMappingURL=ConsolidatedApiController.js.map