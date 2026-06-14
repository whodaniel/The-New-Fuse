"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptTemplateServiceImpl = void 0;
const database_1 = require("@the-new-fuse/database");
class PromptTemplateServiceImpl {
    repository = database_1.drizzlePromptTemplateRepository;
    constructor() { }
    // Template management
    async createTemplate(template) {
        const result = await this.repository.createTemplate(template);
        return this.mapTemplate(result);
    }
    async getTemplate(id, userId) {
        const template = await this.repository.findTemplateByIdAndUser(id, userId);
        return template ? this.mapTemplate(template) : null;
    }
    async updateTemplate(id, updates) {
        const result = await this.repository.updateTemplate(id, updates);
        return result ? this.mapTemplate(result) : null;
    }
    async deleteTemplate(id) {
        return this.repository.deleteTemplate(id);
    }
    async listTemplates(userId, filter) {
        const results = await this.repository.listTemplates(userId, filter);
        return results.map((t) => this.mapTemplate(t));
    }
    // Version management
    async createVersion(templateId, version) {
        const result = await this.repository.createVersion({ ...version, templateId });
        return this.mapVersion(result);
    }
    async getVersion(versionId) {
        const result = await this.repository.findVersionById(versionId);
        return result ? this.mapVersion(result) : null;
    }
    async setActiveVersion(templateId, versionId) {
        const result = await this.repository.setActiveVersion(templateId, versionId);
        return result ? this.mapTemplate(result) : null;
    }
    async listVersions(templateId, userId) {
        const results = await this.repository.listVersions(templateId, userId);
        return results.map((v) => this.mapVersion(v));
    }
    // Snippet management
    async createSnippet(snippet) {
        const result = await this.repository.createSnippet(snippet);
        return this.mapSnippet(result);
    }
    async getSnippet(id) {
        const result = await this.repository.findSnippetById(id);
        return result ? this.mapSnippet(result) : null;
    }
    async updateSnippet(id, updates) {
        const result = await this.repository.updateSnippet(id, updates);
        return result ? this.mapSnippet(result) : null;
    }
    async deleteSnippet(id) {
        return this.repository.deleteSnippet(id);
    }
    async listSnippets(userId, filter) {
        const results = await this.repository.listSnippets(userId, filter);
        return results.map((s) => this.mapSnippet(s));
    }
    async incrementSnippetUsage(id) {
        await this.repository.incrementSnippetUsage(id);
    }
    // Template compilation and execution
    async compileTemplate(templateId, userId, versionId, variables) {
        const template = await this.getTemplate(templateId, userId);
        if (!template)
            throw new Error(`Template not found: ${templateId}`);
        let version;
        if (versionId) {
            version = await this.getVersion(versionId);
        }
        else {
            // Find current version from template's currentVersion ID
            // Note: getTemplate already fetched basic info, but we need the actual version object
            version = await this.getVersion(template.currentVersion);
        }
        if (!version)
            throw new Error(`Version not found: ${versionId || template.currentVersion}`);
        let compiledContent = version.content;
        const templateVariables = { ...version.variables, ...variables };
        // Replace variables with actual values
        Object.entries(templateVariables).forEach(([key, value]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            compiledContent = compiledContent.replace(regex, String(value));
        });
        return compiledContent;
    }
    async executeTemplate(templateId, userId, versionId, variables) {
        const startTime = Date.now();
        let success = false;
        let result = null;
        let error;
        try {
            // In a real implementation, you would call an LLM service here
            // For now, we simulate success
            const compiled = await this.compileTemplate(templateId, userId, versionId, variables);
            // ... Call LLM ...
            result = {
                response: `Simulated response for ${templateId}`,
                compiled,
            };
            success = true;
        }
        catch (e) {
            error = e.message;
            success = false;
        }
        const responseTime = Date.now() - startTime;
        // Resolve version ID if missing
        const finalVersionId = versionId || (await this.getTemplate(templateId, userId))?.currentVersion || '';
        const executionResult = {
            id: '', // database will generate ID
            templateId,
            versionId: finalVersionId,
            executedAt: new Date(),
            success,
            responseTime,
            variables: variables || {},
            result,
            error,
        };
        // Save to DB
        const savedResult = await this.repository.recordExecution(executionResult);
        return {
            ...executionResult,
            id: savedResult.id, // Return with DB ID
        };
    }
    // Analytics
    async getTemplateAnalytics(templateId) {
        const analytics = await this.repository.getTemplateAnalytics(templateId);
        return analytics || undefined;
    }
    async recordExecution(result) {
        await this.repository.recordExecution(result);
    }
    // Mappers to ensure type safety between DB and Domain entities
    mapTemplate(dbRecord) {
        return {
            ...dbRecord,
            currentVersion: dbRecord.currentVersionId, // Map DB column to Interface field
            // versions are typically not loaded by default unless requested, but here we might need them or leave empty
            versions: dbRecord.versions ? dbRecord.versions.map((v) => this.mapVersion(v)) : [],
        };
    }
    mapVersion(dbRecord) {
        return {
            ...dbRecord,
            // Ensure specific fields map correctly if needed
        };
    }
    mapSnippet(dbRecord) {
        return {
            ...dbRecord,
        };
    }
}
exports.PromptTemplateServiceImpl = PromptTemplateServiceImpl;
exports.default = PromptTemplateServiceImpl;
//# sourceMappingURL=PromptTemplateService.js.map