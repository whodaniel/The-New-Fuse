"use strict";
// @ts-nocheck
/**
 * N8N Workflows Controller
 * REST API endpoints for n8n workflow management
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nWorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const n8n_workflows_1 = require("@the-new-fuse/n8n-workflows");
let N8nWorkflowsController = class N8nWorkflowsController {
    constructor() {
        this.workflowService = new n8n_workflows_1.WorkflowService({
            enablePersistence: true,
        });
    }
    /**
     * GET /api/workflows/n8n - List all workflows
     */
    async listWorkflows(query, category, source, tags, complexity, limit, offset) {
        try {
            const searchQuery = {
                query,
                category,
                source,
                tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
                complexity,
                limit: limit ? parseInt(limit, 10) : 50,
                offset: offset ? parseInt(offset, 10) : 0,
            };
            const result = await this.workflowService.search(searchQuery);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve workflows',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * GET /api/workflows/n8n/categories - List categories
     */
    async listCategories() {
        try {
            const result = await this.workflowService.getCategories();
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve categories',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * GET /api/workflows/n8n/stats - Get workflow statistics
     */
    async getStats() {
        try {
            const stats = await this.workflowService.getStats();
            return {
                success: true,
                data: stats,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve statistics',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * GET /api/workflows/n8n/tags - Get all tags
     */
    async getTags() {
        try {
            const tags = await this.workflowService.getAllTags();
            return {
                success: true,
                data: { tags },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve tags',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * GET /api/workflows/n8n/:id - Get workflow by ID
     */
    async getWorkflow(id) {
        try {
            const workflow = await this.workflowService.getWorkflow(id);
            if (!workflow) {
                throw new common_1.HttpException({
                    success: false,
                    error: 'Workflow not found',
                }, common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                data: workflow,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve workflow',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * GET /api/workflows/n8n/:id/similar - Get similar workflows
     */
    async getSimilarWorkflows(id, limit) {
        try {
            const similarWorkflows = await this.workflowService.getSimilarWorkflows(id, limit ? parseInt(limit, 10) : 5);
            return {
                success: true,
                data: { workflows: similarWorkflows },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve similar workflows',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * GET /api/workflows/n8n/category/:category - Get workflows by category
     */
    async getByCategory(category) {
        try {
            const workflows = await this.workflowService.getByCategory(category);
            return {
                success: true,
                data: { workflows },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve workflows',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * GET /api/workflows/n8n/tag/:tag - Get workflows by tag
     */
    async getByTag(tag) {
        try {
            const workflows = await this.workflowService.getByTag(tag);
            return {
                success: true,
                data: { workflows },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve workflows',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * POST /api/workflows/n8n/sync - Sync workflows from repositories
     */
    async syncWorkflows() {
        try {
            const result = await this.workflowService.syncWorkflows();
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sync workflows',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * POST /api/workflows/n8n/import - Import workflow to n8n instance
     */
    async importWorkflow(request) {
        try {
            const n8nInstanceUrl = request.n8nInstanceUrl?.trim() ||
                process.env.N8N_TEMPLATE_HOST_URL ||
                'http://n8n-template-host:5678';
            if (!request.workflowId || !n8nInstanceUrl) {
                throw new common_1.HttpException({
                    success: false,
                    error: 'Missing required field: workflowId',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const result = await this.workflowService.importToN8n({ ...request, n8nInstanceUrl });
            if (!result.success) {
                throw new common_1.HttpException({
                    success: false,
                    error: result.error || 'Failed to import workflow',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to import workflow',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * GET /api/workflows/n8n/search - Search workflows
     */
    async searchWorkflows(q, limit, offset) {
        try {
            if (!q || q.trim() === '') {
                throw new common_1.HttpException({
                    success: false,
                    error: 'Search query is required',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const searchQuery = {
                query: q,
                limit: limit ? parseInt(limit, 10) : 50,
                offset: offset ? parseInt(offset, 10) : 0,
            };
            const result = await this.workflowService.search(searchQuery);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search workflows',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.N8nWorkflowsController = N8nWorkflowsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all n8n workflows' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: false, description: 'Search query' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, description: 'Filter by category' }),
    (0, swagger_1.ApiQuery)({ name: 'source', required: false, description: 'Filter by source' }),
    (0, swagger_1.ApiQuery)({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' }),
    (0, swagger_1.ApiQuery)({ name: 'complexity', required: false, description: 'Filter by complexity' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of results to return' }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, description: 'Number of results to skip' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflows retrieved successfully' }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('source')),
    __param(3, (0, common_1.Query)('tags')),
    __param(4, (0, common_1.Query)('complexity')),
    __param(5, (0, common_1.Query)('limit')),
    __param(6, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "listWorkflows", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'List all workflow categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Categories retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflow statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('tags'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all workflow tags' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tags retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "getTags", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflow by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workflow ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "getWorkflow", null);
__decorate([
    (0, common_1.Get)(':id/similar'),
    (0, swagger_1.ApiOperation)({ summary: 'Get similar workflows' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workflow ID' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: 'Number of similar workflows to return',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Similar workflows retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "getSimilarWorkflows", null);
__decorate([
    (0, common_1.Get)('category/:category'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflows by category' }),
    (0, swagger_1.ApiParam)({ name: 'category', description: 'Workflow category' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflows retrieved successfully' }),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "getByCategory", null);
__decorate([
    (0, common_1.Get)('tag/:tag'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflows by tag' }),
    (0, swagger_1.ApiParam)({ name: 'tag', description: 'Workflow tag' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflows retrieved successfully' }),
    __param(0, (0, common_1.Param)('tag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "getByTag", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync workflows from GitHub repositories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflows synced successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "syncWorkflows", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, swagger_1.ApiOperation)({ summary: 'Import workflow to n8n instance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow imported successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "importWorkflow", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search workflows' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search query' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of results to return' }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, description: 'Number of results to skip' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results retrieved successfully' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], N8nWorkflowsController.prototype, "searchWorkflows", null);
exports.N8nWorkflowsController = N8nWorkflowsController = __decorate([
    (0, swagger_1.ApiTags)('n8n-workflows'),
    (0, common_1.Controller)('workflows/n8n'),
    __metadata("design:paramtypes", [])
], N8nWorkflowsController);
//# sourceMappingURL=n8n-workflows.controller.js.map