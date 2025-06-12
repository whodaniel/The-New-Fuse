import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PromptTemplate } from '../entities/prompt.entity.tsx';
import { AgentPromptTemplate } from '../entities/agent-prompt.entity';
import type { PromptTemplate as IPromptTemplate, AgentPromptTemplate as IAgentPromptTemplate } from '../types/prompt.types.js';

@Injectable()
export class PromptService {
    private templates: Map<string, IPromptTemplate>;
    private agentTemplates: Map<string, Map<string, IAgentPromptTemplate>>;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(PromptTemplate)
        private promptRepository: Repository<PromptTemplate>,
        @InjectRepository(AgentPromptTemplate)
        private agentPromptRepository: Repository<AgentPromptTemplate>
    ) {
        this.templates = new Map();
        this.agentTemplates = new Map();
        this.loadTemplates();
    }

    private async loadTemplates(): Promise<void> {
        // Load global templates
        const templates = await this.promptRepository.find();
        templates.forEach(template => {
            this.templates.set(template.id, template);
        });

        // Load agent-specific templates
        const agentTemplates = await this.agentPromptRepository.find();
        agentTemplates.forEach(template => {
            if (!this.agentTemplates.has(template.agentId)) {
                this.agentTemplates.set(template.agentId, new Map());
            }
            this.agentTemplates.get(template.agentId)!.set(template.id, template);
        });
    }

    public async createTemplate(templateData: Partial<PromptTemplate>): Promise<PromptTemplate> {
        const newTemplate = await this.promptRepository.save(templateData);
        this.templates.set(newTemplate.id, newTemplate);
        return newTemplate;
    }

    public async createAgentTemplate(templateData: Partial<AgentPromptTemplate>): Promise<AgentPromptTemplate> {
        const newTemplate = await this.agentPromptRepository.save(templateData);
        if (!this.agentTemplates.has(newTemplate.agentId)) {
            this.agentTemplates.set(newTemplate.agentId, new Map());
        }
        this.agentTemplates.get(newTemplate.agentId)!.set(newTemplate.id, newTemplate);
        return newTemplate;
    }

    public getTemplate(id: string): IPromptTemplate | undefined {
        return this.templates.get(id);
    }

    public getAgentTemplate(agentId: string, templateId: string): IAgentPromptTemplate | undefined {
        return this.agentTemplates.get(agentId)?.get(templateId);
    }

    public async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
        const template = await this.promptRepository.findOne({ where: { id } });
        if (!template) {
            throw new Error(`Template not found: ${id}`);
        }

        const updatedTemplate = await this.promptRepository.save({
            ...template,
            ...updates,
            metadata: {
                ...template.metadata,
                updated: new Date()
            }
        });

        this.templates.set(id, updatedTemplate);
        return updatedTemplate;
    }

    public async updateAgentTemplate(
        agentId: string,
        templateId: string,
        updates: Partial<AgentPromptTemplate>
    ): Promise<AgentPromptTemplate> {
        const template = await this.agentPromptRepository.findOne({
            where: { id: templateId, agentId }
        });
        
        if (!template) {
            throw new Error(`Template not found: ${templateId} for agent ${agentId}`);
        }

        const updatedTemplate = await this.agentPromptRepository.save({
            ...template,
            ...updates,
            metadata: {
                ...template.metadata,
                updated: new Date()
            }
        });

        if (!this.agentTemplates.has(agentId)) {
            this.agentTemplates.set(agentId, new Map());
        }
        this.agentTemplates.get(agentId)!.set(templateId, updatedTemplate);
        return updatedTemplate;
    }

    public async deleteTemplate(id: string): Promise<void> {
        await this.promptRepository.delete(id);
        this.templates.delete(id);
    }

    public async deleteAgentTemplate(agentId: string, templateId: string): Promise<void> {
        await this.agentPromptRepository.delete({ id: templateId, agentId });
        this.agentTemplates.get(agentId)?.delete(templateId);
    }

    public async getTemplatesByCategory(category: string): Promise<IPromptTemplate[]> {
        return Array.from(this.templates.values())
            .filter(template => template.category === category);
    }

    public async getAgentTemplatesByPurpose(
        agentId: string,
        purpose:system' | user' | function' | response'
    ): Promise<IAgentPromptTemplate[]> {
        const agentTemplates = this.agentTemplates.get(agentId);
        if (!agentTemplates) {
            return [];
        }

        return Array.from(agentTemplates.values())
            .filter(template => template.purpose === purpose);
    }

    public validateTemplateParams(
        template: IPromptTemplate,
        params: Record<string, unknown>
    ): { isValid: boolean; errors?: string[] } {
        const errors: string[] = [];

        template.parameters.forEach(param => {
            const value = params[param.name];

            // Check required parameters
            if (param.required && !(param.name in params)) {
                errors.push(`Missing required parameter: ${param.name}`);
                return;
            }

            if (value !== undefined) {
                // Type validation
                if (!this.validateParameterType(value, param.type)) {
                    errors.push(`Invalid type for parameter ${param.name}: expected ${param.type}, got ${typeof value}`);
                }

                // Validation rules
                if (param.validation) {
                    // Min/Max validation for numbers
                    if (param.validation.min !== undefined && typeof value === number' && value < param.validation.min) {
                        errors.push(`Value for ${param.name} is below minimum: ${param.validation.min}`);
                    }
                    if (param.validation.max !== undefined && typeof value === number' && value > param.validation.max) {
                        errors.push(`Value for ${param.name} is above maximum: ${param.validation.max}`);
                    }

                    // Pattern validation for strings
                    if (param.validation.pattern && typeof value === 'string') {
                        const regex = new RegExp(param.validation.pattern);
                        if (!regex.test(value)) {
                            errors.push(`Value for ${param.name} does not match required pattern`);
                        }
                    }

                    // Enum validation
                    if (param.validation.enumValues && !param.validation.enumValues.includes(value)) {
                        errors.push(`Invalid value for ${param.name}: must be one of ${param.validation.enumValues.join(', )}`);
                    }
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    private validateParameterType(value: unknown, expectedType: string): boolean {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case number':
                return typeof value === 'number';
            case boolean':
                return typeof value === 'boolean';
            case array':
                return Array.isArray(value);
            case object':
                return typeof value === object' && value !== null && !Array.isArray(value);
            default:
                return false;
        }
    }

    public renderTemplate(templateId: string, variables: Record<string, unknown>): string {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        const validation = this.validateTemplateParams(template, variables);
        if (!validation.isValid) {
            throw new Error(`Template validation failed: ${validation.errors?.join(', )}`);
        }

        return template.render(variables);
    }

    public async updateMetrics(
        templateId: string,
        metrics: {
            success?: boolean;
            responseTime?: number;
            tokenUsage?: number;
        }
    ): Promise<void> {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        const currentMetrics = template.metrics;
        const now = new Date();

        // Update success rate
        if (metrics.success !== undefined) {
            const totalAttempts = (currentMetrics as any).totalAttempts || 0;
            const successfulAttempts = (currentMetrics as any).successfulAttempts || 0;
            
            const newTotalAttempts = totalAttempts + 1;
            const newSuccessfulAttempts = successfulAttempts + (metrics.success ? 1 : 0);
            
            currentMetrics.successRate = newSuccessfulAttempts / newTotalAttempts;
            currentMetrics.errorRate = 1 - currentMetrics.successRate;
            
            (currentMetrics as any).totalAttempts = newTotalAttempts;
            (currentMetrics as any).successfulAttempts = newSuccessfulAttempts;
        }

        // Update response time
        if (metrics.responseTime !== undefined) {
            currentMetrics.averageResponseTime = 
                (currentMetrics.averageResponseTime + metrics.responseTime) / 2;
        }

        // Update token usage
        if (metrics.tokenUsage !== undefined) {
            currentMetrics.tokenUsage.total += metrics.tokenUsage;
            currentMetrics.tokenUsage.average = 
                (currentMetrics.tokenUsage.average * (currentMetrics.tokenUsage.total - metrics.tokenUsage) + metrics.tokenUsage) /
                currentMetrics.tokenUsage.total;
        }

        currentMetrics.lastUsed = now;

        await this.updateTemplate(templateId, { metrics: currentMetrics });
    }
}
