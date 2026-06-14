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
exports.ResourcesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const secure_auth_guard_1 = require("../../guards/secure-auth.guard");
const marketplace_service_1 = require("../marketplace/marketplace.service");
const personal_skill_dto_1 = require("./dto/personal-skill.dto");
const resource_search_protocol_dto_1 = require("./dto/resource-search-protocol.dto");
const resource_search_dto_1 = require("./dto/resource-search.dto");
const personal_skills_service_1 = require("./personal-skills.service");
const resource_interaction_service_1 = require("./resource-interaction.service");
const resource_registry_api_key_guard_1 = require("./resource-registry-api-key.guard");
const resource_search_policy_service_1 = require("./resource-search-policy.service");
const resource_search_protocol_service_1 = require("./resource-search-protocol.service");
let ResourcesController = class ResourcesController {
    constructor(marketplaceService, resourceSearchPolicyService, resourceSearchProtocolService, resourceInteractionService, personalSkillsService) {
        this.marketplaceService = marketplaceService;
        this.resourceSearchPolicyService = resourceSearchPolicyService;
        this.resourceSearchProtocolService = resourceSearchProtocolService;
        this.resourceInteractionService = resourceInteractionService;
        this.personalSkillsService = personalSkillsService;
    }
    resolveUserId(req, fallbackUserId) {
        const requestUserId = typeof req.user?.id === 'string'
            ? req.user?.id
            : '';
        const userId = requestUserId || String(fallbackUserId || '').trim();
        if (!userId) {
            throw new common_1.BadRequestException('Authenticated user id is required');
        }
        return userId;
    }
    mapCategory(category) {
        const value = String(category || '').toLowerCase();
        if (['development', 'developer-tools', 'code'].includes(value))
            return 'development';
        if (['productivity', 'ops'].includes(value))
            return 'productivity';
        if (['communication', 'social', 'chat'].includes(value))
            return 'communication';
        if (['data', 'analytics'].includes(value))
            return 'data';
        if (['automation', 'workflow'].includes(value))
            return 'automation';
        if (['ai', 'model'].includes(value))
            return 'ai';
        return 'other';
    }
    toBaseResource(item, type) {
        const reviews = Math.max(0, Math.floor(item.totalRuns * 0.02));
        return {
            id: item.id,
            name: item.name,
            description: item.description,
            type,
            category: this.mapCategory(item.category),
            tags: item.tags || [],
            author: item.createdBy || 'marketplace',
            version: '1.0.0',
            downloads: item.totalRuns || 0,
            rating: item.rating || 0,
            reviews,
            featured: item.rating >= 4.7 && item.publicationStatus === 'published',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
            icon: item.avatarUrl,
            previewImage: item.avatarUrl,
        };
    }
    toSkill(item) {
        const skillType = item.kind === 'prompt'
            ? 'prompt'
            : item.kind === 'mcp_server' || item.kind === 'model'
                ? 'integration'
                : 'mcp-tool';
        return {
            ...this.toBaseResource(item, 'skill'),
            type: 'skill',
            skillType,
            capabilities: item.capabilities || [],
            modelCompatibility: ['gpt-4.1', 'o3', 'claude-3.7'],
            examples: [
                {
                    title: `Use ${item.name}`,
                    description: 'Run this resource from the marketplace surface.',
                    input: `activate ${item.slug}`,
                    output: 'resource activated',
                },
            ],
            documentation: item.launchUrl || `/api/marketplace/catalog/${item.id}`,
            sourceUrl: item.launchUrl,
            installCommand: `tnf marketplace install ${item.slug}`,
        };
    }
    toWorkflow(item) {
        const capabilityCount = item.capabilities?.length || 0;
        const complexity = capabilityCount >= 6 ? 'complex' : capabilityCount >= 3 ? 'medium' : 'simple';
        return {
            ...this.toBaseResource(item, 'workflow'),
            type: 'workflow',
            nodes: Math.max(3, capabilityCount * 2 || 3),
            triggers: item.tags?.length ? item.tags.slice(0, 3) : ['manual'],
            actions: item.capabilities?.length ? item.capabilities.slice(0, 5) : ['run'],
            integrations: item.tags?.filter((tag) => ['mcp', 'slack', 'github', 'notion'].includes(tag)) || [],
            complexity,
            workflowData: { marketplaceId: item.id, slug: item.slug },
            importUrl: item.launchUrl || `/api/marketplace/catalog/${item.id}`,
        };
    }
    toTemplate(item) {
        const tagSet = new Set((item.tags || []).map((tag) => tag.toLowerCase()));
        const templateType = tagSet.has('analysis')
            ? 'analysis'
            : tagSet.has('automation')
                ? 'automation'
                : tagSet.has('task')
                    ? 'task'
                    : 'chat';
        return {
            ...this.toBaseResource(item, 'template'),
            type: 'template',
            templateType,
            model: 'gpt-4.1',
            systemPrompt: `You are ${item.name}. ${item.description}`,
            capabilities: item.capabilities || [],
            configuration: {
                marketplaceId: item.id,
                slug: item.slug,
            },
            requiredSkills: item.tags?.slice(0, 3) || [],
            optionalSkills: item.tags?.slice(3, 6) || [],
        };
    }
    async getPublishedCatalog() {
        const { items } = await this.marketplaceService.getCatalog({ status: 'published' });
        return items;
    }
    normalizeText(value) {
        return String(value || '')
            .trim()
            .replace(/\s+/g, ' ');
    }
    normalizeTextList(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        const seen = new Set();
        const result = [];
        for (const entry of value) {
            const normalized = this.normalizeText(entry).toLowerCase();
            if (!normalized || seen.has(normalized)) {
                continue;
            }
            seen.add(normalized);
            result.push(normalized);
        }
        return result;
    }
    inferKindFromRegistryPayload(payload) {
        const categoryHint = this.normalizeText(payload.category).toUpperCase();
        const typeHint = this.normalizeText(payload.type).toUpperCase();
        const tagHints = this.normalizeTextList(payload.tags).join(' ');
        const allHints = `${categoryHint} ${typeHint} ${tagHints}`.trim();
        if (allHints.includes('WORKFLOW'))
            return 'workflow';
        if (allHints.includes('TEMPLATE'))
            return 'agent_template';
        if (allHints.includes('MODEL'))
            return 'model';
        if (allHints.includes('MCP'))
            return 'mcp_server';
        if (allHints.includes('PROMPT'))
            return 'prompt';
        if (allHints.includes('EXPERIENCE'))
            return 'experience';
        return 'skill';
    }
    inferCategoryFromRegistryPayload(payload) {
        const categoryHint = this.normalizeText(payload.category).toUpperCase();
        if (categoryHint.includes('WORKFLOW'))
            return 'automation';
        if (categoryHint.includes('MODEL'))
            return 'ai';
        if (categoryHint.includes('MCP'))
            return 'developer-tools';
        if (categoryHint.includes('PROMPT'))
            return 'productivity';
        if (categoryHint.includes('SKILL'))
            return 'development';
        const tags = this.normalizeTextList(payload.tags);
        return tags[0] || 'automation';
    }
    mapRegistryPayloadToCatalogSubmission(payload) {
        const contentDescription = payload.content && typeof payload.content === 'object'
            ? this.normalizeText(payload.content.description)
            : '';
        const name = this.normalizeText(payload.name) || 'Imported Skill';
        const description = this.normalizeText(payload.description) ||
            contentDescription ||
            'Imported from skill-bank resource registry';
        const tags = Array.from(new Set([
            ...this.normalizeTextList(payload.tags),
            ...this.normalizeTextList(payload.keywords),
        ])).slice(0, 12);
        const capabilities = [...tags].slice(0, 12);
        const sourceHint = this.normalizeText(payload.source).toLowerCase();
        const createdBy = sourceHint || 'skill-bank';
        return {
            name,
            description,
            kind: this.inferKindFromRegistryPayload(payload),
            category: this.inferCategoryFromRegistryPayload(payload),
            tags,
            capabilities,
            createdBy,
        };
    }
    async createResource(body) {
        const submission = this.mapRegistryPayloadToCatalogSubmission(body || {});
        // Idempotent behavior for bulk imports/retries.
        const { items } = await this.marketplaceService.getCatalog({
            q: submission.name,
            limit: 200,
        });
        const existing = items.find((item) => this.normalizeText(item.name).toLowerCase() === submission.name.toLowerCase() &&
            this.normalizeText(item.description).toLowerCase() ===
                submission.description.toLowerCase() &&
            this.normalizeText(item.createdBy).toLowerCase() === submission.createdBy?.toLowerCase());
        if (existing) {
            return {
                ...existing,
                deduplicated: true,
            };
        }
        return await this.marketplaceService.submitCatalogItem(submission);
    }
    async getAllResources() {
        const items = await this.getPublishedCatalog();
        const skills = items
            .filter((item) => ['skill', 'prompt', 'mcp_server', 'model'].includes(item.kind))
            .map((item) => this.toSkill(item));
        const workflows = items
            .filter((item) => item.kind === 'workflow')
            .map((item) => this.toWorkflow(item));
        const templates = items
            .filter((item) => item.kind === 'agent_template')
            .map((item) => this.toTemplate(item));
        return [...skills, ...workflows, ...templates];
    }
    async getSkills() {
        const items = await this.getPublishedCatalog();
        return items
            .filter((item) => ['skill', 'prompt', 'mcp_server', 'model'].includes(item.kind))
            .map((item) => this.toSkill(item));
    }
    async getWorkflows() {
        const items = await this.getPublishedCatalog();
        return items.filter((item) => item.kind === 'workflow').map((item) => this.toWorkflow(item));
    }
    async getTemplates() {
        const items = await this.getPublishedCatalog();
        return items
            .filter((item) => item.kind === 'agent_template')
            .map((item) => this.toTemplate(item));
    }
    async getStats() {
        const resources = await this.getAllResources();
        const totalResources = resources.length;
        const totalSkills = resources.filter((item) => item.type === 'skill').length;
        const totalWorkflows = resources.filter((item) => item.type === 'workflow').length;
        const totalTemplates = resources.filter((item) => item.type === 'template').length;
        const totalDownloads = resources.reduce((sum, item) => sum + (item.downloads || 0), 0);
        const averageRating = totalResources > 0
            ? Number((resources.reduce((sum, item) => sum + (item.rating || 0), 0) / totalResources).toFixed(2))
            : 0;
        return {
            totalResources,
            totalSkills,
            totalWorkflows,
            totalTemplates,
            totalDownloads,
            averageRating,
        };
    }
    async getPersonalSkills(req) {
        const userId = this.resolveUserId(req);
        return this.personalSkillsService.listByUser(userId);
    }
    async getPersonalSkill(id, req) {
        const userId = this.resolveUserId(req);
        return this.personalSkillsService.getByUser(userId, id);
    }
    async createPersonalSkill(body, req) {
        const userId = this.resolveUserId(req);
        return this.personalSkillsService.createByUser(userId, body);
    }
    async updatePersonalSkill(id, body, req) {
        const userId = this.resolveUserId(req);
        return this.personalSkillsService.updateByUser(userId, id, body);
    }
    async deletePersonalSkill(id, req) {
        const userId = this.resolveUserId(req);
        await this.personalSkillsService.deleteByUser(userId, id);
        return {
            success: true,
            id,
        };
    }
    async searchResources(filter) {
        const resources = await this.getAllResources();
        const includeTraitMeta = Boolean(filter?.includeTraitMeta);
        const { items, meta } = await this.resourceSearchPolicyService.applySearchPolicy(resources, filter);
        if (includeTraitMeta) {
            return {
                items,
                traitScreen: meta,
            };
        }
        return items;
    }
    async searchResourcesProtocol(body) {
        const { filter, requestEnvelope } = this.resourceSearchProtocolService.decodeRequest(body);
        const resources = await this.getAllResources();
        const { items, meta } = await this.resourceSearchPolicyService.applySearchPolicy(resources, filter);
        const payload = filter.includeTraitMeta ? { items, traitScreen: meta } : items;
        return this.resourceSearchProtocolService.encodeResponse(requestEnvelope, payload);
    }
    async toggleFavorite(resourceId, body, req) {
        const userId = this.resolveUserId(req, body?.userId);
        const result = await this.resourceInteractionService.toggleFavorite(resourceId, userId);
        return {
            success: true,
            resourceId,
            userId,
            favorite: result.favorite,
        };
    }
    async shareResource(share, req) {
        const resourceId = String(share?.resourceId || '').trim();
        const toAgentId = String(share?.toAgentId || '').trim();
        if (!resourceId) {
            throw new common_1.BadRequestException('resourceId is required');
        }
        if (!toAgentId) {
            throw new common_1.BadRequestException('toAgentId is required');
        }
        const fromUserId = this.resolveUserId(req, share?.fromUserId);
        const saved = await this.resourceInteractionService.shareResource({
            resourceId,
            fromUserId,
            toAgentId,
            notes: share?.notes,
        });
        return {
            success: true,
            share: saved,
        };
    }
};
exports.ResourcesController = ResourcesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(resource_registry_api_key_guard_1.ResourceRegistryApiKeyGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create resource registry entry (skill-bank ingest compatibility)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "createResource", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "getAllResources", null);
__decorate([
    (0, common_1.Get)('skills'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "getSkills", null);
__decorate([
    (0, common_1.Get)('workflows'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "getWorkflows", null);
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('personal-skills'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List authenticated user private/personal AI skills' }),
    (0, swagger_1.ApiOkResponse)({ type: [personal_skill_dto_1.PersonalSkillDto] }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "getPersonalSkills", null);
__decorate([
    (0, common_1.Get)('personal-skills/:id'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific private/personal AI skill for the authenticated user' }),
    (0, swagger_1.ApiOkResponse)({ type: personal_skill_dto_1.PersonalSkillDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "getPersonalSkill", null);
__decorate([
    (0, common_1.Post)('personal-skills'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new private/personal AI skill for the authenticated user' }),
    (0, swagger_1.ApiBody)({ type: personal_skill_dto_1.CreatePersonalSkillDto }),
    (0, swagger_1.ApiOkResponse)({ type: personal_skill_dto_1.PersonalSkillDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [personal_skill_dto_1.CreatePersonalSkillDto, Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "createPersonalSkill", null);
__decorate([
    (0, common_1.Put)('personal-skills/:id'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update an authenticated user private/personal AI skill' }),
    (0, swagger_1.ApiBody)({ type: personal_skill_dto_1.UpdatePersonalSkillDto }),
    (0, swagger_1.ApiOkResponse)({ type: personal_skill_dto_1.PersonalSkillDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, personal_skill_dto_1.UpdatePersonalSkillDto, Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "updatePersonalSkill", null);
__decorate([
    (0, common_1.Delete)('personal-skills/:id'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an authenticated user private/personal AI skill' }),
    (0, swagger_1.ApiOkResponse)({
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                id: { type: 'string' },
            },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "deletePersonalSkill", null);
__decorate([
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiOperation)({
        summary: 'Search resources with optional trait-based narrowing and ranking',
    }),
    (0, swagger_1.ApiExtraModels)(resource_search_dto_1.ResourceDto, resource_search_dto_1.ResourceSearchMetaDto, resource_search_dto_1.ResourceSearchEnvelopeDto, resource_search_dto_1.ResourceSearchRequestDto),
    (0, swagger_1.ApiBody)({ type: resource_search_dto_1.ResourceSearchRequestDto }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Legacy array response by default. When includeTraitMeta=true, returns an envelope with trait-screen metadata.',
        schema: {
            oneOf: [
                {
                    type: 'array',
                    items: { $ref: (0, swagger_1.getSchemaPath)(resource_search_dto_1.ResourceDto) },
                },
                {
                    $ref: (0, swagger_1.getSchemaPath)(resource_search_dto_1.ResourceSearchEnvelopeDto),
                },
            ],
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resource_search_dto_1.ResourceSearchRequestDto]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "searchResources", null);
__decorate([
    (0, common_1.Post)('search/protocol'),
    (0, swagger_1.ApiOperation)({
        summary: 'Protocol envelope search endpoint for NestJS/SGP bridge clients',
    }),
    (0, swagger_1.ApiExtraModels)(resource_search_protocol_dto_1.ResourceSearchProtocolRequestEnvelopeDto, resource_search_protocol_dto_1.ResourceSearchProtocolResponseEnvelopeDto, resource_search_dto_1.ResourceSearchRequestDto, resource_search_dto_1.ResourceDto, resource_search_dto_1.ResourceSearchEnvelopeDto),
    (0, swagger_1.ApiBody)({
        description: 'Accepts either RESOURCE.SEARCH.REQUEST envelope or a plain search filter object. Returns RESOURCE.SEARCH.RESPONSE envelope.',
        schema: {
            oneOf: [
                { $ref: (0, swagger_1.getSchemaPath)(resource_search_protocol_dto_1.ResourceSearchProtocolRequestEnvelopeDto) },
                { $ref: (0, swagger_1.getSchemaPath)(resource_search_dto_1.ResourceSearchRequestDto) },
            ],
        },
    }),
    (0, swagger_1.ApiOkResponse)({
        type: resource_search_protocol_dto_1.ResourceSearchProtocolResponseEnvelopeDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: "Invalid protocol envelope. For protocol mode, type MUST be 'RESOURCE.SEARCH.REQUEST' and include id/spec/tenant/resource/sent_at/trace/payload.",
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "searchResourcesProtocol", null);
__decorate([
    (0, common_1.Post)(':id/favorite'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.JwtAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "toggleFavorite", null);
__decorate([
    (0, common_1.Post)('share'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.JwtAuth)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "shareResource", null);
exports.ResourcesController = ResourcesController = __decorate([
    (0, swagger_1.ApiTags)('resources'),
    (0, common_1.Controller)('resources'),
    __metadata("design:paramtypes", [marketplace_service_1.MarketplaceService,
        resource_search_policy_service_1.ResourceSearchPolicyService,
        resource_search_protocol_service_1.ResourceSearchProtocolService,
        resource_interaction_service_1.ResourceInteractionService,
        personal_skills_service_1.PersonalSkillsService])
], ResourcesController);
//# sourceMappingURL=resources.controller.js.map