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
var _a;
import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { AgentCatalogService } from '@the-new-fuse/core';
let AgentCatalogController = class AgentCatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    /**
     * Search for agents using semantic search
     * POST /api/agents/search
     */
    async searchAgents(body) {
        try {
            const results = await this.catalogService.searchAgents({
                query: body.query,
                limit: body.limit || 10,
                threshold: body.threshold || 0.6,
                category: body.category,
                domain: body.domain
            });
            return {
                success: true,
                results,
                count: results.length
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Search failed',
                results: []
            };
        }
    }
    /**
     * Get agent recommendations for a task
     * POST /api/agents/recommend
     */
    async recommendAgents(body) {
        try {
            const recommendations = await this.catalogService.recommendAgents({
                taskDescription: body.taskDescription,
                limit: body.limit || 5,
                includeCollaborators: body.includeCollaborators || false
            });
            return {
                success: true,
                recommendations,
                count: recommendations.length
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Recommendation failed',
                recommendations: []
            };
        }
    }
    /**
     * Build an agent team for a complex task
     * POST /api/agents/build-team
     */
    async buildTeam(body) {
        try {
            const team = await this.catalogService.buildTeam({
                taskDescription: body.taskDescription,
                requiredSkills: body.requiredSkills || [],
                maxTeamSize: body.maxTeamSize || 5
            });
            return {
                success: true,
                ...team
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Team building failed',
                team: [],
                skillCoverage: {},
                recommendations: []
            };
        }
    }
    /**
     * Find agents by skill
     * GET /api/agents/by-skill/:skill
     */
    async findBySkill(skill, limit) {
        try {
            const agents = await this.catalogService.findBySkill(skill, limit ? parseInt(limit.toString()) : 10);
            return {
                success: true,
                agents,
                count: agents.length
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Search failed',
                agents: []
            };
        }
    }
    /**
     * Find agents by domain
     * GET /api/agents/by-domain/:domain
     */
    async findByDomain(domain, limit) {
        try {
            const agents = await this.catalogService.findByDomain(domain, limit ? parseInt(limit.toString()) : 10);
            return {
                success: true,
                agents,
                count: agents.length
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Search failed',
                agents: []
            };
        }
    }
    /**
     * Find agents by category
     * GET /api/agents/by-category/:category
     */
    async findByCategory(category, limit) {
        try {
            const agents = await this.catalogService.findByCategory(category, limit ? parseInt(limit.toString()) : 50);
            return {
                success: true,
                agents,
                count: agents.length
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Search failed',
                agents: []
            };
        }
    }
    /**
     * Get agent by ID
     * GET /api/agents/:id
     */
    async getAgent(id) {
        try {
            const agent = this.catalogService.getAgentById(id);
            if (!agent) {
                return {
                    success: false,
                    error: 'Agent not found'
                };
            }
            // Get relationships and collaborators
            const relationships = this.catalogService.getAgentRelationships(id);
            const collaborators = this.catalogService.findCollaborators(id);
            return {
                success: true,
                agent,
                relationships,
                collaborators
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get agent'
            };
        }
    }
    /**
     * Get catalog statistics
     * GET /api/agents/stats
     */
    async getStats() {
        try {
            const stats = this.catalogService.getStats();
            return {
                success: true,
                ...stats
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get stats'
            };
        }
    }
    /**
     * Get all categories
     * GET /api/agents/categories
     */
    async getCategories() {
        try {
            const stats = this.catalogService.getStats();
            return {
                success: true,
                categories: Object.entries(stats.categoryCounts).map(([name, count]) => ({
                    name,
                    count
                }))
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get categories',
                categories: []
            };
        }
    }
    /**
     * Ingest agent catalog (admin endpoint)
     * POST /api/agents/catalog/ingest
     */
    async ingestCatalog(catalog) {
        try {
            await this.catalogService.ingestCatalog(catalog);
            const stats = this.catalogService.getStats();
            return {
                success: true,
                message: 'Catalog ingested successfully',
                stats
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Ingestion failed'
            };
        }
    }
};
__decorate([
    Post('search'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentCatalogController.prototype, "searchAgents", null);
__decorate([
    Post('recommend'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentCatalogController.prototype, "recommendAgents", null);
__decorate([
    Post('build-team'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentCatalogController.prototype, "buildTeam", null);
__decorate([
    Get('by-skill/:skill'),
    __param(0, Param('skill')),
    __param(1, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AgentCatalogController.prototype, "findBySkill", null);
__decorate([
    Get('by-domain/:domain'),
    __param(0, Param('domain')),
    __param(1, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AgentCatalogController.prototype, "findByDomain", null);
__decorate([
    Get('by-category/:category'),
    __param(0, Param('category')),
    __param(1, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AgentCatalogController.prototype, "findByCategory", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentCatalogController.prototype, "getAgent", null);
__decorate([
    Get('catalog/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentCatalogController.prototype, "getStats", null);
__decorate([
    Get('catalog/categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentCatalogController.prototype, "getCategories", null);
__decorate([
    Post('catalog/ingest'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentCatalogController.prototype, "ingestCatalog", null);
AgentCatalogController = __decorate([
    Controller('agents'),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentCatalogService !== "undefined" && AgentCatalogService) === "function" ? _a : Object])
], AgentCatalogController);
export { AgentCatalogController };
//# sourceMappingURL=agent-catalog.controller.js.map