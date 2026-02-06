import { Injectable, Logger } from '@nestjs/common';

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptContext {
  [key: string]: any;
}

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Code Review',
        template:
          'Please review the following code for {language}:\n\n{code}\n\nFocus on: {focus_areas}',
        variables: ['language', 'code', 'focus_areas'],
        category: 'development',
        description: 'Template for code review requests',
      },
      {
        name: 'Bug Analysis',
        template:
          'Analyze this bug report:\n\nError: {error_message}\nContext: {context}\nSteps to reproduce: {steps}',
        variables: ['error_message', 'context', 'steps'],
        category: 'debugging',
        description: 'Template for bug analysis',
      },
      {
        name: 'Feature Planning',
        template:
          'Plan the implementation of: {feature_name}\n\nRequirements: {requirements}\nConstraints: {constraints}',
        variables: ['feature_name', 'requirements', 'constraints'],
        category: 'planning',
        description: 'Template for feature planning',
      },
    ];

    for (const template of defaultTemplates) {
      this.createTemplate(template);
    }
  }

  createTemplate(
    templateData: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  ): PromptTemplate {
    const id = this.generateId();
    const now = new Date();

    const template: PromptTemplate = {
      ...templateData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.templates.set(id, template);
    this.logger.log(`Created prompt template: ${template.name} (${id})`);

    return template;
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter((template) => template.category === category);
  }

  updateTemplate(
    id: string,
    updates: Partial<Omit<PromptTemplate, 'id' | 'createdAt'>>,
  ): PromptTemplate | null {
    const template = this.templates.get(id);
    if (!template) {
      return null;
    }

    const updatedTemplate: PromptTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    this.logger.log(`Updated prompt template: ${updatedTemplate.name} (${id})`);

    return updatedTemplate;
  }

  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id);
    if (!template) {
      return false;
    }

    this.templates.delete(id);
    this.logger.log(`Deleted prompt template: ${template.name} (${id})`);

    return true;
  }

  renderPrompt(templateId: string, context: PromptContext): string | null {
    const template = this.templates.get(templateId);
    if (!template) {
      this.logger.warn(`Template not found: ${templateId}`);
      return null;
    }

    return this.interpolateTemplate(template.template, context);
  }

  renderPromptFromTemplate(template: string, context: PromptContext): string {
    return this.interpolateTemplate(template, context);
  }

  private interpolateTemplate(template: string, context: PromptContext): string {
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

  validateTemplate(template: string): { isValid: boolean; variables: string[]; errors: string[] } {
    const errors: string[] = [];
    const variables: string[] = [];

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
      errors,
    };
  }

  searchTemplates(query: string): PromptTemplate[] {
    const lowercaseQuery = query.toLowerCase();

    return Array.from(this.templates.values()).filter(
      (template) =>
        template.name.toLowerCase().includes(lowercaseQuery) ||
        template.description?.toLowerCase().includes(lowercaseQuery) ||
        template.category.toLowerCase().includes(lowercaseQuery) ||
        template.template.toLowerCase().includes(lowercaseQuery),
    );
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const template of this.templates.values()) {
      categories.add(template.category);
    }
    return Array.from(categories).sort();
  }

  private generateId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  exportTemplates(): PromptTemplate[] {
    return this.getAllTemplates();
  }

  importTemplates(templates: PromptTemplate[]): { imported: number; errors: string[] } {
    const errors: string[] = [];
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
      } catch (error: any) {
        errors.push(`Failed to import template "${template.name}": ${error.message}`);
      }
    }

    this.logger.log(`Imported ${imported} templates with ${errors.length} errors`);

    return { imported, errors };
  }
}
