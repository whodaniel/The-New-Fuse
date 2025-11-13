var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PromptService_1;
import { Injectable, Logger } from '@nestjs/common';
let PromptService = PromptService_1 = class PromptService {
    logger = new Logger(PromptService_1.name);
    templates = new Map();
    constructor() {
        this.initializeDefaultTemplates();
    }
    initializeDefaultTemplates() {
        const defaultTemplates = [
            {
                name: 'Code Review',
                template: 'Please review the following code for {language}:\n\n{code}\n\nFocus on: {focus_areas}',
                variables: ['language', 'code', 'focus_areas'],
                category: 'development',
                description: 'Template for code review requests'
            },
            {
                name: 'Bug Analysis',
                template: 'Analyze this bug report:\n\nError: {error_message}\nContext: {context}\nSteps to reproduce: {steps}',
                variables: ['error_message', 'context', 'steps'],
                category: 'debugging',
                description: 'Template for bug analysis'
            },
            {
                name: 'Feature Planning',
                template: 'Plan the implementation of: {feature_name}\n\nRequirements: {requirements}\nConstraints: {constraints}',
                variables: ['feature_name', 'requirements', 'constraints'],
                category: 'planning',
                description: 'Template for feature planning'
            }
        ];
        for (const template of defaultTemplates) {
            this.createTemplate(template);
        }
    }
    createTemplate(templateData) {
        const id = this.generateId();
        const now = new Date();
        const template = {
            ...templateData,
            id,
            createdAt: now,
            updatedAt: now
        };
        this.templates.set(id, template);
        this.logger.log(`Created prompt template: ${template.name} (${id})`);
        return template;
    }
    getTemplate(id) {
        return this.templates.get(id);
    }
    getAllTemplates() {
        return Array.from(this.templates.values());
    }
    getTemplatesByCategory(category) {
        return Array.from(this.templates.values())
            .filter(template => template.category === category);
    }
    updateTemplate(id, updates) {
        const template = this.templates.get(id);
        if (!template) {
            return null;
        }
        const updatedTemplate = {
            ...template,
            ...updates,
            updatedAt: new Date()
        };
        this.templates.set(id, updatedTemplate);
        this.logger.log(`Updated prompt template: ${updatedTemplate.name} (${id})`);
        return updatedTemplate;
    }
    deleteTemplate(id) {
        const template = this.templates.get(id);
        if (!template) {
            return false;
        }
        this.templates.delete(id);
        this.logger.log(`Deleted prompt template: ${template.name} (${id})`);
        return true;
    }
    renderPrompt(templateId, context) {
        const template = this.templates.get(templateId);
        if (!template) {
            this.logger.warn(`Template not found: ${templateId}`);
            return null;
        }
        return this.interpolateTemplate(template.template, context);
    }
    renderPromptFromTemplate(template, context) {
        return this.interpolateTemplate(template, context);
    }
    interpolateTemplate(template, context) {
        let result = template;
        // Replace variables in the format {variable_name}
        const variableRegex = /\{([^}]+)\}/g;
        result = result.replace(variableRegex, (match, variableName) => {
            const value = context[variableName];
            if (value !== undefined) {
                return String(value);
            }
            this.logger.warn(`Variable not found in context: ${variableName}`);
            return match; // Keep the placeholder if variable not found
        });
        return result;
    }
    validateTemplate(template) {
        const errors = [];
        const variables = [];
        // Extract variables
        const variableRegex = /\{([^}]+)\}/g;
        let match;
        while ((match = variableRegex.exec(template)) !== null) {
            const variableName = match[1];
            if (!variables.includes(variableName)) {
                variables.push(variableName);
            }
        }
        // Check for unclosed braces
        const openBraces = (template.match(/\{/g) || []).length;
        const closeBraces = (template.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            errors.push('Mismatched braces in template');
        }
        // Check for empty variables
        if (template.includes('{}')) {
            errors.push('Empty variable placeholders found');
        }
        return {
            isValid: errors.length === 0,
            variables,
            errors
        };
    }
    searchTemplates(query) {
        const lowercaseQuery = query.toLowerCase();
        return Array.from(this.templates.values()).filter(template => template.name.toLowerCase().includes(lowercaseQuery) ||
            template.description?.toLowerCase().includes(lowercaseQuery) ||
            template.category.toLowerCase().includes(lowercaseQuery) ||
            template.template.toLowerCase().includes(lowercaseQuery));
    }
    getCategories() {
        const categories = new Set();
        for (const template of this.templates.values()) {
            categories.add(template.category);
        }
        return Array.from(categories).sort();
    }
    generateId() {
        return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    exportTemplates() {
        return this.getAllTemplates();
    }
    importTemplates(templates) {
        const errors = [];
        let imported = 0;
        for (const template of templates) {
            try {
                const validation = this.validateTemplate(template.template);
                if (!validation.isValid) {
                    errors.push(`Invalid template "${template.name}": ${validation.errors.join(', ')}`);
                    continue;
                }
                this.templates.set(template.id, template);
                imported++;
            }
            catch (error) {
                errors.push(`Failed to import template "${template.name}": ${error.message}`);
            }
        }
        this.logger.log(`Imported ${imported} templates with ${errors.length} errors`);
        return { imported, errors };
    }
};
PromptService = PromptService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], PromptService);
export { PromptService };
//# sourceMappingURL=PromptService.js.map