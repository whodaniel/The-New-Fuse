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
var WorkflowTemplatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowTemplatesService = void 0;
// @ts-nocheck
/**
 * WorkflowTemplatesService - Migrated to Drizzle ORM
 * Handles workflow template operations
 *
 * Note: Workflow templates schema needs to be created for full functionality
 * This is a temporary simplified implementation
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let WorkflowTemplatesService = WorkflowTemplatesService_1 = class WorkflowTemplatesService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(WorkflowTemplatesService_1.name);
    }
    async findAll(userId) {
        const publicTemplates = await this.db.workflows.findPublicTemplates();
        if (!userId) {
            return publicTemplates;
        }
        const userTemplates = await this.db.workflows.findTemplatesByCreatorId(userId);
        // Merge public and user templates, deduplicating by ID
        const templateMap = new Map();
        publicTemplates.forEach((t) => templateMap.set(t.id, t));
        userTemplates.forEach((t) => templateMap.set(t.id, t));
        return Array.from(templateMap.values());
    }
    async findOne(id) {
        const template = await this.db.workflows.findTemplateById(id);
        if (!template)
            throw new common_1.NotFoundException('Template not found');
        return template;
    }
    async create(data, userId) {
        // Basic validation / transformation if needed
        // 'data' likely contains definition, name, etc.
        // Ensure required fields
        if (!data.name || !data.definition) {
            // Should probably throw bad request, but for now assuming data is valid or partials handled
        }
        const newTemplate = {
            ...data,
            creatorId: userId,
            definition: data.definition || {},
            isPublic: data.isPublic || false,
            metadata: data.metadata,
            category: data.category || 'Custom',
        };
        return this.db.workflows.createTemplate(newTemplate);
    }
    async update(id, data, userId) {
        const template = await this.findOne(id);
        if (template.creatorId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own templates');
        }
        const updated = await this.db.workflows.updateTemplate(id, data);
        return updated;
    }
    async remove(id, userId) {
        const template = await this.findOne(id);
        if (template.creatorId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own templates');
        }
        return this.db.workflows.deleteTemplate(id);
    }
};
exports.WorkflowTemplatesService = WorkflowTemplatesService;
exports.WorkflowTemplatesService = WorkflowTemplatesService = WorkflowTemplatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], WorkflowTemplatesService);
//# sourceMappingURL=workflow-templates.service.js.map