/**
 * PromptTemplatesService - Migrated to Drizzle ORM
 * Handles prompt template CRUD operations
 *
 * Note: Prompt templates schema needs to be created for full functionality
 * This is a temporary simplified implementation
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import * as crypto from 'node:crypto';

// In-memory storage for prompt templates until full schema is created
interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  category?: string;
  tags: string[];
  analytics: Record<string, any>;
  currentVersionId?: string;
  createdAt: Date;
  updatedAt: Date;
  versions: PromptVersion[];
}

interface PromptVersion {
  id: string;
  templateId: string;
  version: number;
  content: string;
  label?: string;
  variables: Record<string, any>;
  changelog?: string;
  isActive: boolean;
  createdAt: Date;
}

interface PromptSnippet {
  id: string;
  name: string;
  content: string;
  category?: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PromptTemplatesService {
  private readonly logger = new Logger(PromptTemplatesService.name);

  // In-memory storage until full schema migration
  private templates: Map<string, PromptTemplate> = new Map();
  private snippets: Map<string, PromptSnippet> = new Map();

  constructor(private readonly db: DatabaseService) {
    this.logger.warn(
      'PromptTemplatesService: Using in-memory storage. Prompt templates schema migration pending.'
    );
  }

  // Template Management
  async createTemplate(data: any): Promise<PromptTemplate> {
    const id = this.generateId();
    const template: PromptTemplate = {
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
        const version: PromptVersion = {
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

  async findAllTemplates(filter?: any): Promise<PromptTemplate[]> {
    const templates = Array.from(this.templates.values());
    // Apply basic filtering
    if (filter?.isPublic !== undefined) {
      return templates.filter((t) => t.isPublic === filter.isPublic);
    }
    return templates;
  }

  async findTemplate(id: string): Promise<PromptTemplate> {
    const template = this.templates.get(id);
    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }
    return template;
  }

  async updateTemplate(id: string, data: any): Promise<PromptTemplate> {
    const template = await this.findTemplate(id);
    const updated: PromptTemplate = {
      ...template,
      ...data,
      updatedAt: new Date(),
    };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  // Version Management
  async createVersion(templateId: string, data: any): Promise<PromptVersion> {
    const template = await this.findTemplate(templateId);

    const nextVersion = template.versions.length + 1;
    const version: PromptVersion = {
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

  async getVersions(templateId: string): Promise<PromptVersion[]> {
    const template = await this.findTemplate(templateId);
    return [...template.versions].sort((a, b) => b.version - a.version);
  }

  // Snippet Management
  async createSnippet(data: any): Promise<PromptSnippet> {
    const id = this.generateId();
    const snippet: PromptSnippet = {
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

  async findAllSnippets(filter?: any): Promise<PromptSnippet[]> {
    const snippets = Array.from(this.snippets.values());
    return snippets.sort((a, b) => b.usageCount - a.usageCount);
  }

  async updateSnippet(id: string, data: any): Promise<PromptSnippet> {
    const snippet = this.snippets.get(id);
    if (!snippet) {
      throw new NotFoundException(`Snippet ${id} not found`);
    }
    const updated: PromptSnippet = {
      ...snippet,
      ...data,
      updatedAt: new Date(),
    };
    this.snippets.set(id, updated);
    return updated;
  }

  async deleteSnippet(id: string): Promise<boolean> {
    return this.snippets.delete(id);
  }

  async incrementSnippetUsage(id: string): Promise<PromptSnippet> {
    const snippet = this.snippets.get(id);
    if (!snippet) {
      throw new NotFoundException(`Snippet ${id} not found`);
    }
    snippet.usageCount++;
    snippet.updatedAt = new Date();
    this.snippets.set(id, snippet);
    return snippet;
  }

  async compileTemplate(
    templateId: string,
    variables: Record<string, any> = {}
  ): Promise<{ content: string }> {
    const template = await this.findTemplate(templateId);

    if (!template.versions || template.versions.length === 0) {
      throw new NotFoundException(`Template ${templateId} has no versions`);
    }

    // Use current version or latest
    const version = template.currentVersionId
      ? template.versions.find((v) => v.id === template.currentVersionId)
      : template.versions.sort((a, b) => b.version - a.version)[0];

    if (!version) {
      throw new NotFoundException(`Active version for template ${templateId} not found`);
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

  private generateId(): string {
    return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
}
