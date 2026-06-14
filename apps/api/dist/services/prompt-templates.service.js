"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PromptTemplatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptTemplatesService = void 0;
/**
 * PromptTemplatesService - Migrated to Drizzle ORM
 * Handles prompt template CRUD operations
 *
 * Note: Prompt templates schema needs to be created for full functionality
 * This is a temporary simplified implementation
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const crypto = __importStar(require("node:crypto"));
let PromptTemplatesService = PromptTemplatesService_1 = class PromptTemplatesService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(PromptTemplatesService_1.name);
        // In-memory storage until full schema migration
        this.templates = new Map();
        this.snippets = new Map();
        this.logger.warn('PromptTemplatesService: Using in-memory storage. Prompt templates schema migration pending.');
    }
    // Template Management
    async createTemplate(data) {
        const id = this.generateId();
        const template = {
            id,
            name: data.name,
            description: data.description,
            isPublic: data.isPublic || false,
            category: data.category,
            tags: data.tags || [],
            analytics: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            versions: [],
        };
        // Create initial versions if provided
        if (data.versions && Array.isArray(data.versions)) {
            for (const v of data.versions) {
                const version = {
                    id: this.generateId(),
                    templateId: id,
                    version: template.versions.length + 1,
                    content: v.content,
                    label: v.label,
                    variables: v.variables || {},
                    changelog: v.changelog,
                    isActive: true,
                    createdAt: new Date(),
                };
                template.versions.push(version);
            }
        }
        this.templates.set(id, template);
        return template;
    }
    async findAllTemplates(filter) {
        const templates = Array.from(this.templates.values());
        // Apply basic filtering
        if (filter?.isPublic !== undefined) {
            return templates.filter((t) => t.isPublic === filter.isPublic);
        }
        return templates;
    }
    async findTemplate(id) {
        const template = this.templates.get(id);
        if (!template) {
            throw new common_1.NotFoundException(`Template ${id} not found`);
        }
        return template;
    }
    async updateTemplate(id, data) {
        const template = await this.findTemplate(id);
        const updated = {
            ...template,
            ...data,
            updatedAt: new Date(),
        };
        this.templates.set(id, updated);
        return updated;
    }
    async deleteTemplate(id) {
        return this.templates.delete(id);
    }
    // Version Management
    async createVersion(templateId, data) {
        const template = await this.findTemplate(templateId);
        const nextVersion = template.versions.length + 1;
        const version = {
            id: this.generateId(),
            templateId,
            version: nextVersion,
            content: data.content,
            label: data.label,
            variables: data.variables || {},
            changelog: data.changelog,
            isActive: true,
            createdAt: new Date(),
        };
        template.versions.push(version);
        template.updatedAt = new Date();
        this.templates.set(templateId, template);
        return version;
    }
    async getVersions(templateId) {
        const template = await this.findTemplate(templateId);
        return [...template.versions].sort((a, b) => b.version - a.version);
    }
    // Snippet Management
    async createSnippet(data) {
        const id = this.generateId();
        const snippet = {
            id,
            name: data.name,
            content: data.content,
            category: data.category,
            tags: data.tags || [],
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.snippets.set(id, snippet);
        return snippet;
    }
    async findAllSnippets(filter) {
        const snippets = Array.from(this.snippets.values());
        return snippets.sort((a, b) => b.usageCount - a.usageCount);
    }
    async updateSnippet(id, data) {
        const snippet = this.snippets.get(id);
        if (!snippet) {
            throw new common_1.NotFoundException(`Snippet ${id} not found`);
        }
        const updated = {
            ...snippet,
            ...data,
            updatedAt: new Date(),
        };
        this.snippets.set(id, updated);
        return updated;
    }
    async deleteSnippet(id) {
        return this.snippets.delete(id);
    }
    async incrementSnippetUsage(id) {
        const snippet = this.snippets.get(id);
        if (!snippet) {
            throw new common_1.NotFoundException(`Snippet ${id} not found`);
        }
        snippet.usageCount++;
        snippet.updatedAt = new Date();
        this.snippets.set(id, snippet);
        return snippet;
    }
    async compileTemplate(templateId, variables = {}) {
        const template = await this.findTemplate(templateId);
        if (!template.versions || template.versions.length === 0) {
            throw new common_1.NotFoundException(`Template ${templateId} has no versions`);
        }
        // Use current version or latest
        const version = template.currentVersionId
            ? template.versions.find((v) => v.id === template.currentVersionId)
            : template.versions.sort((a, b) => b.version - a.version)[0];
        if (!version) {
            throw new common_1.NotFoundException(`Active version for template ${templateId} not found`);
        }
        let compiledContent = version.content;
        const templateVariables = { ...version.variables, ...variables };
        // Replace variables with actual values
        Object.entries(templateVariables).forEach(([key, value]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            compiledContent = compiledContent.replace(regex, String(value));
        });
        return { content: compiledContent };
    }
    generateId() {
        return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }
};
exports.PromptTemplatesService = PromptTemplatesService;
exports.PromptTemplatesService = PromptTemplatesService = PromptTemplatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], PromptTemplatesService);
//# sourceMappingURL=prompt-templates.service.js.map