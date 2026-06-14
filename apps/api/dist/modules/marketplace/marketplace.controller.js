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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceController = void 0;
const common_1 = require("@nestjs/common");
const member_or_admin_guard_1 = require("../../guards/member-or-admin.guard");
const secure_auth_guard_1 = require("../../guards/secure-auth.guard");
const marketplace_service_1 = require("./marketplace.service");
let MarketplaceController = class MarketplaceController {
    constructor(marketplaceService) {
        this.marketplaceService = marketplaceService;
    }
    async getCatalog(query) {
        return await this.marketplaceService.getCatalog(query);
    }
    async getExperiences(query) {
        return await this.marketplaceService.getExperiences(query);
    }
    async getCatalogItem(id) {
        const item = await this.marketplaceService.getItemById(id);
        if (!item) {
            throw new common_1.NotFoundException(`Catalog item not found: ${id}`);
        }
        return item;
    }
    async getResearchCounts() {
        return await this.marketplaceService.getResearchCounts();
    }
    async searchResearchPrompts(q, limit, offset) {
        return await this.marketplaceService.searchResearchPrompts({
            q,
            limit: Number(limit),
            offset: Number(offset),
        });
    }
    async getResearchSources(limitPerCategory) {
        return await this.marketplaceService.getResearchSources({
            limitPerCategory: Number(limitPerCategory) || 8,
        });
    }
    async getResearchSkillCounts() {
        return await this.marketplaceService.getResearchSkillCounts();
    }
    async getResearchSkillSources(limitPerCategory) {
        return await this.marketplaceService.getResearchSkillSources({
            limitPerCategory: Number(limitPerCategory) || 8,
        });
    }
    async searchResearchSkillFiles(q, sourceId, limit, offset) {
        return await this.marketplaceService.searchResearchSkillFiles({
            q,
            sourceId: Number(sourceId),
            limit: Number(limit),
            offset: Number(offset),
        });
    }
    async getResearchSkillMarketplaceCounts() {
        return await this.marketplaceService.getResearchSkillMarketplaceCounts();
    }
    async listResearchSkillMarketplaceEntries(q, limit, offset) {
        return await this.marketplaceService.listResearchSkillMarketplaceEntries({
            q,
            limit: Number(limit),
            offset: Number(offset),
        });
    }
    async getResearchMcpCounts() {
        return await this.marketplaceService.getResearchMcpCounts();
    }
    async getResearchMcpSources(limitPerCategory) {
        return await this.marketplaceService.getResearchMcpSources({
            limitPerCategory: Number(limitPerCategory) || 8,
        });
    }
    async searchResearchMcpServers(q, limit, offset) {
        return await this.marketplaceService.searchResearchMcpServers({
            q,
            limit: Number(limit),
            offset: Number(offset),
        });
    }
    async triggerResearchCrawl(body) {
        return await this.marketplaceService.triggerResearchCrawl(body || {});
    }
    async listResearchCrawlRuns(limit) {
        return await this.marketplaceService.listResearchCrawlRuns(Number(limit) || 20);
    }
    async getResearchCrawlRun(id) {
        return await this.marketplaceService.getResearchCrawlRun(id);
    }
    submitExperience(body, req) {
        return this.submitForMemberOrAdmin(body, req, 'experience');
    }
    submitCatalogItem(body, req) {
        return this.submitForMemberOrAdmin(body, req, 'catalog');
    }
    async transitionPublicationStatus(id, body) {
        try {
            if (!body.toStatus) {
                throw new common_1.BadRequestException('toStatus is required');
            }
            const item = await this.marketplaceService.transitionPublicationStatus({
                id,
                toStatus: body.toStatus,
                moderatedBy: body.moderatedBy,
            });
            if (!item) {
                throw new common_1.NotFoundException(`Catalog item not found: ${id}`);
            }
            return item;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(error.message);
        }
    }
    async submitForMemberOrAdmin(body, req, kind) {
        const principal = req.user || {};
        const userId = principal.id;
        if (!userId) {
            throw new common_1.BadRequestException('Authenticated user is required');
        }
        const createdBy = principal.email || userId;
        if (kind === 'experience') {
            return this.marketplaceService.submitExperience({
                ...body,
                createdBy,
            });
        }
        return this.marketplaceService.submitCatalogItem({
            ...body,
            createdBy,
        });
    }
};
exports.MarketplaceController = MarketplaceController;
__decorate([
    (0, common_1.Get)('catalog'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getCatalog", null);
__decorate([
    (0, common_1.Get)('experiences'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getExperiences", null);
__decorate([
    (0, common_1.Get)('catalog/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getCatalogItem", null);
__decorate([
    (0, common_1.Get)('research/counts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getResearchCounts", null);
__decorate([
    (0, common_1.Get)('research/prompts'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "searchResearchPrompts", null);
__decorate([
    (0, common_1.Get)('research/sources'),
    __param(0, (0, common_1.Query)('limitPerCategory')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getResearchSources", null);
__decorate([
    (0, common_1.Get)('research/skills/counts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getResearchSkillCounts", null);
__decorate([
    (0, common_1.Get)('research/skills/sources'),
    __param(0, (0, common_1.Query)('limitPerCategory')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getResearchSkillSources", null);
__decorate([
    (0, common_1.Get)('research/skills/files'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('sourceId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "searchResearchSkillFiles", null);
__decorate([
    (0, common_1.Get)('research/skills/marketplace/counts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getResearchSkillMarketplaceCounts", null);
__decorate([
    (0, common_1.Get)('research/skills/marketplace/entries'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "listResearchSkillMarketplaceEntries", null);
__decorate([
    (0, common_1.Get)('research/mcp/counts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getResearchMcpCounts", null);
__decorate([
    (0, common_1.Get)('research/mcp/sources'),
    __param(0, (0, common_1.Query)('limitPerCategory')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getResearchMcpSources", null);
__decorate([
    (0, common_1.Get)('research/mcp/servers'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "searchResearchMcpServers", null);
__decorate([
    (0, common_1.Post)('research/crawl/run'),
    (0, secure_auth_guard_1.AdminOnly)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "triggerResearchCrawl", null);
__decorate([
    (0, common_1.Get)('research/crawl/runs'),
    (0, secure_auth_guard_1.AdminOnly)(),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "listResearchCrawlRuns", null);
__decorate([
    (0, common_1.Get)('research/crawl/runs/:id'),
    (0, secure_auth_guard_1.AdminOnly)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getResearchCrawlRun", null);
__decorate([
    (0, common_1.Post)('experiences/submit'),
    (0, member_or_admin_guard_1.MemberOrAdmin)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "submitExperience", null);
__decorate([
    (0, common_1.Post)('catalog/submit'),
    (0, member_or_admin_guard_1.MemberOrAdmin)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "submitCatalogItem", null);
__decorate([
    (0, common_1.Post)('catalog/:id/publication-status'),
    (0, secure_auth_guard_1.AdminOnly)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "transitionPublicationStatus", null);
exports.MarketplaceController = MarketplaceController = __decorate([
    (0, common_1.Controller)('marketplace'),
    __metadata("design:paramtypes", [marketplace_service_1.MarketplaceService])
], MarketplaceController);
//# sourceMappingURL=marketplace.controller.js.map