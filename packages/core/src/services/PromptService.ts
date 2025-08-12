/**
 * @fileoverview Production-ready prompt management service
 */

import { Injectable, Logger } from '@nestjs/common';
import { ServiceState } from '../constants/types';
import { BaseError } from '../utils/errors';

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  variables: PromptVariable[];
  category: string;
  tags: string[];
  version: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

export interface PromptContext {
  variables: Record<string, any>;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface GeneratedPrompt {
  content: string;
  templateId: string;
  variables: Record<string, any>;
  generatedAt: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private state: ServiceState = ServiceState.UNINITIALIZED;
  private templates: Map<string, PromptTemplate> = new Map();
  private templatesByName: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  async start(): Promise<void> {
    if (this.state === ServiceState.RUNNING) {
      this.logger.warn('PromptService is already running');
      return;
    }

    try {
      this.state = ServiceState.INITIALIZING;
      this.logger.log('Starting PromptService');

      this.state = ServiceState.RUNNING;
      this.logger.log('PromptService started successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error('Failed to start PromptService', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.state === ServiceState.STOPPED) {
      this.logger.warn('PromptService is already stopped');
      return;
    }

    try {
      this.state = ServiceState.STOPPING;
      this.logger.log('Stopping PromptService');

      this.state = ServiceState.STOPPED;
      this.logger.log('PromptService stopped successfully');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error('Failed to stop PromptService', error as Error);
      throw error;
    }
  }

  getState(): ServiceState {
    return this.state;
  }

  async generatePrompt(templateId: string, context: PromptContext): Promise<GeneratedPrompt> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new BaseError(`Template ${templateId} not found`, 'TEMPLATE_NOT_FOUND');
    }

    try {
      // Validate required variables
      this.validateContext(template, context);

      // Generate the prompt by replacing variables
      const content = this.interpolateTemplate(template.template, context.variables);

      const generatedPrompt: GeneratedPrompt = {
        content,
        templateId,
        variables: context.variables,
        generatedAt: new Date(),
        metadata: context.metadata,
      };

      this.logger.debug(`Generated prompt from template: ${template.name}`, {
        templateId,
        variableCount: Object.keys(context.variables).length,
      });

      return generatedPrompt;
    } catch (error) {
      this.logger.error('Failed to generate prompt', error as Error, { templateId });
      throw error;
    }
  }

  async generatePromptByName(templateName: string, context: PromptContext): Promise<GeneratedPrompt> {
    const template = this.templatesByName.get(templateName);
    if (!template) {
      throw new BaseError(`Template ${templateName} not found`, 'TEMPLATE_NOT_FOUND');
    }

    return this.generatePrompt(template.id, context);
  }

  createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): PromptTemplate {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newTemplate: PromptTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.templates.set(id, newTemplate);
    this.templatesByName.set(template.name, newTemplate);

    this.logger.log(`Created prompt template: ${template.name} (${id})`);
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<Omit<PromptTemplate, 'id' | 'createdAt'>>): PromptTemplate {
    const template = this.templates.get(id);
    if (!template) {
      throw new BaseError(`Template ${id} not found`, 'TEMPLATE_NOT_FOUND');
    }

    // Remove from name index if name is changing
    if (updates.name && updates.name !== template.name) {
      this.templatesByName.delete(template.name);
    }

    const updatedTemplate: PromptTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    this.templatesByName.set(updatedTemplate.name, updatedTemplate);

    this.logger.log(`Updated prompt template: ${updatedTemplate.name} (${id})`);
    return updatedTemplate;
  }

  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id);
    if (!template) {
      return false;
    }

    this.templates.delete(id);
    this.templatesByName.delete(template.name);

    this.logger.log(`Deleted prompt template: ${template.name} (${id})`);
    return true;
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplateByName(name: string): PromptTemplate | undefined {
    return this.templatesByName.get(name);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  getTemplatesByTag(tag: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.tags.includes(tag));
  }

  searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description?.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  private validateContext(template: PromptTemplate, context: PromptContext): void {
    const requiredVariables = template.variables.filter(v => v.required);
    const missingVariables = requiredVariables.filter(v => !(v.name in context.variables));

    if (missingVariables.length > 0) {
      throw new BaseError(): unknown {
        `Missing required variables: ${missingVariables.map(v => v.name).join(', ')}`,
        'MISSING_VARIABLES',
        { missingVariables: missingVariables.map(v => v.name) }
      );
    }

    // Validate variable types and constraints
    for (const variable of template.variables) {
      const value = context.variables[variable.name];
      if (value !== undefined) {
        this.validateVariable(variable, value);
      }
    }
  }

  private validateVariable(variable: PromptVariable, value: any): void {
    // Type validation
    switch (variable.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new BaseError(`Variable ${variable.name} must be a string`, 'INVALID_VARIABLE_TYPE');
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          throw new BaseError(`Variable ${variable.name} must be a number`, 'INVALID_VARIABLE_TYPE');
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new BaseError(`Variable ${variable.name} must be a boolean`, 'INVALID_VARIABLE_TYPE');
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new BaseError(`Variable ${variable.name} must be an array`, 'INVALID_VARIABLE_TYPE');
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw new BaseError(`Variable ${variable.name} must be an object`, 'INVALID_VARIABLE_TYPE');
        }
        break;
    }

    // Validation constraints
    if (variable.validation) {
      const validation = variable.validation;

      if (validation.pattern && typeof value === 'string') {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          throw new BaseError(`Variable ${variable.name} does not match pattern`, 'VALIDATION_FAILED');
        }
      }

      if (validation.min !== undefined && typeof value === 'number') {
        if (value < validation.min) {
          throw new BaseError(`Variable ${variable.name} must be >= ${validation.min}`, 'VALIDATION_FAILED');
        }
      }

      if (validation.max !== undefined && typeof value === 'number') {
        if (value > validation.max) {
          throw new BaseError(`Variable ${variable.name} must be <= ${validation.max}`, 'VALIDATION_FAILED');
        }
      }

      if (validation.enum && !validation.enum.includes(value)) {
        throw new BaseError(`Variable ${variable.name} must be one of: ${validation.enum.join(', ')}`, 'VALIDATION_FAILED');
      }
    }
  }

  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    let result = template;

    // Replace {{variable}} patterns
    result = result.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      if (variableName in variables) {
        const value = variables[variableName];
        return typeof value === 'string' ? value : JSON.stringify(value);
      }
      return match; // Keep original if variable not found
    });

    // Replace {variable} patterns (alternative syntax)
    result = result.replace(/\{(\w+)\}/g, (match, variableName) => {
      if (variableName in variables) {
        const value = variables[variableName];
        return typeof value === 'string' ? value : JSON.stringify(value);
      }
      return match; // Keep original if variable not found
    });

    return result;
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'agent_task_assignment',
        description: 'Template for assigning tasks to agents',
        template: 'You are an AI agent with the following capabilities: {{capabilities}}. Please complete this task: {{task}}. Context: {{context}}',
        variables: [
          { name: 'capabilities', type: 'array', required: true, description: 'List of agent capabilities' },
          { name: 'task', type: 'string', required: true, description: 'Task description' },
          { name: 'context', type: 'string', required: false, description: 'Additional context' },
        ],
        category: 'agent',
        tags: ['task', 'assignment', 'agent'],
        version: '1.0.0',
      },
      {
        name: 'code_review',
        description: 'Template for code review requests',
        template: 'Please review the following {{language}} code and provide feedback on:\n1. Code quality\n2. Best practices\n3. Potential issues\n4. Suggestions for improvement\n\nCode:\n```{{language}}\n{{code}}\n```',
        variables: [
          { name: 'language', type: 'string', required: true, description: 'Programming language' },
          { name: 'code', type: 'string', required: true, description: 'Code to review' },
        ],
        category: 'development',
        tags: ['code', 'review', 'development'],
        version: '1.0.0',
      },
      {
        name: 'error_analysis',
        description: 'Template for analyzing errors',
        template: 'Analyze the following error and provide:\n1. Root cause analysis\n2. Potential solutions\n3. Prevention strategies\n\nError: {{error}}\nContext: {{context}}\nStack trace: {{stackTrace}}',
        variables: [
          { name: 'error', type: 'string', required: true, description: 'Error message' },
          { name: 'context', type: 'string', required: false, description: 'Error context' },
          { name: 'stackTrace', type: 'string', required: false, description: 'Stack trace' },
        ],
        category: 'debugging',
        tags: ['error', 'analysis', 'debugging'],
        version: '1.0.0',
      },
    ];

    defaultTemplates.forEach(template => {
      this.createTemplate(template);
    });

    this.logger.log(`Initialized ${defaultTemplates.length} default prompt templates`);
  }
}