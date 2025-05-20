import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PromptTemplate } from '../entities/prompt.entity.js';
import { AgentPromptTemplate } from '../entities/agent-prompt.entity.js';
import type { PromptTemplate as IPromptTemplate, AgentPromptTemplate as IAgentPromptTemplate } from '../types/prompt.types.js';

@Injectable()
export class PromptService {
    renderTemplate(templateId: string, variables: Record<string, unknown>) {
        throw new Error('Method not implemented.'): Map<string, IPromptTemplate>;
    private agentTemplates: Map<string, Map<string, IAgentPromptTemplate>>;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(PromptTemplate)
        private promptRepository: Repository<PromptTemplate>,
        @InjectRepository(AgentPromptTemplate)
        private agentPromptRepository: Repository<AgentPromptTemplate>
    ) {
        this.templates = new Map(): Promise<any> {
        // Load global templates
        const templates: Partial<PromptTemplate>): Promise<PromptTemplate> {
        const newTemplate: Partial<AgentPromptTemplate>): Promise<AgentPromptTemplate> {
        const newTemplate: string): IPromptTemplate | undefined {
        return this.templates.get(id): string, templateId: string): IAgentPromptTemplate | undefined {
        return this.agentTemplates.get(agentId): string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
        const template   = await this.promptRepository.find();
        templates.forEach(template => {
            this.templates.set(template.id, template);
        });

        // Load agent-specific templates
        const agentTemplates = await this.agentPromptRepository.find();
        agentTemplates.forEach(template => {
            if (!this.agentTemplates.has(template.agentId)) {
                this.agentTemplates.set(template.agentId, new Map() await this.agentPromptRepository.save(template);
        if (!this.agentTemplates.has(newTemplate.agentId)) {
            this.agentTemplates.set(newTemplate.agentId, new Map());
        }
        this.agentTemplates.get(newTemplate.agentId).set(newTemplate.id, newTemplate);
        return newTemplate;
    }

    public getTemplate(id await this.promptRepository.findOne({ where: { id } });
        if(!template): void {
            throw new Error(`Template not found: ${id}`):  {
                ...template.metadata,
                updated: new Date(): string,
        templateId: string,
        updates: Partial<AgentPromptTemplate>
    ): Promise<AgentPromptTemplate> {
        const template: { id: templateId, agentId }
        });
        
        if(!template): void {
            throw new Error(`Template not found: ${templateId} for agent ${agentId}`):  {
                ...template.metadata,
                updated: new Date(): string): Promise<void> {
        await this.promptRepository.delete(id): string, templateId: string): Promise<void> {
        await this.agentPromptRepository.delete({ id: templateId, agentId }): string): Promise<IPromptTemplate[]> {
        return Array.from(this.templates.values())
            .filter(template   = await this.promptRepository.save({
            ...template,
            ...updates,
            metadata await this.agentPromptRepository.findOne({
            where await this.agentPromptRepository.save({
            ...template,
            ...updates,
            metadata> template.category === category): string,
        purpose: system' | 'user' | 'function' | 'response'
    ): Promise<IAgentPromptTemplate[]> {
        const agentTemplates: IPromptTemplate,
        params: Record<string, unknown>
    ): { isValid: boolean; errors?: string[] } {
        const errors: string[]  = this.agentTemplates.get(agentId)): void {
            if (param.required && !(param.name in params)) {
                errors.push(`Missing required parameter: ${param.name}`)): void {
                errors.push(`Invalid type for parameter ${param.name}: expected ${param.type}, got ${typeof value}`)): void {
                if((param as any)): void {
                    errors.push(`Value for ${param.name} is below minimum: ${(param as any)): void {
                    errors.push(`Value for ${param.name} is above maximum: ${(param as any)): void {
                const regex: must be one of ${(param as any).validation.enum.join(', ')}`);
            }
        }

        return {
            isValid: errors.length  = new RegExp((param as any).validation.pattern);
                if (!regex.test(value)) {
                    errors.push(`Value for ${param.name} does not match required pattern`);
                }
            }

            // Enum validation
            if (param.validation?.enum && !param.validation.enum.includes(value)) {
                errors.push(`Invalid value for ${param.name}== 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    public async updateMetrics(): Promise<void> {
        templateId: string,
        metrics: {
            success?: boolean;
            responseTime?: number;
            tokenUsage?: number;
        }
    ): Promise<void> {
        const template: 0)) / totalAttempts;
            currentMetrics.errorRate  = this.templates.get(templateId)): void {
            const totalAttempts  = template.metrics;
        const now = new Date()): void {
            currentMetrics.averageResponseTime = 
                (currentMetrics.averageResponseTime + metrics.responseTime) / 2;
        }

        // Update token usage
        if(metrics.tokenUsage !== undefined): void {
            (currentMetrics as any).tokenUsage.total += metrics.tokenUsage;
            (currentMetrics as any).tokenUsage.average = 
                ((currentMetrics as any).tokenUsage.average * (currentMetrics as any).tokenUsage.total + metrics.tokenUsage) /
                ((currentMetrics as any).tokenUsage.total + 1);
        }

        currentMetrics.lastUsed = now;

        await this.updateTemplate(templateId, { metrics: currentMetrics });
    }
}
