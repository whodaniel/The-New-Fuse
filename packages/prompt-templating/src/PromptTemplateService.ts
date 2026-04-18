import { drizzlePromptTemplateRepository } from '@the-new-fuse/database';
import {
  PromptExecutionResult,
  PromptSnippet,
  PromptTemplate,
  PromptTemplateService,
  PromptVersion,
} from './types';

export class PromptTemplateServiceImpl implements PromptTemplateService {
  private repository = drizzlePromptTemplateRepository;

  constructor() {}

  // Template management
  async createTemplate(
    template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PromptTemplate> {
    const result = await this.repository.createTemplate(template);
    return this.mapTemplate(result);
  }

  async getTemplate(id: string, userId: string): Promise<PromptTemplate | null> {
    const template = await this.repository.findTemplateByIdAndUser(id, userId);
    return template ? this.mapTemplate(template) : null;
  }

  async updateTemplate(
    id: string,
    updates: Partial<PromptTemplate>
  ): Promise<PromptTemplate | null> {
    const result = await this.repository.updateTemplate(id, updates);
    return result ? this.mapTemplate(result) : null;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.repository.deleteTemplate(id);
  }

  async listTemplates(userId: string, filter?: Partial<PromptTemplate>): Promise<PromptTemplate[]> {
    const results = await this.repository.listTemplates(userId, filter);
    return results.map((t) => this.mapTemplate(t));
  }

  // Version management
  async createVersion(
    templateId: string,
    version: Omit<PromptVersion, 'id' | 'createdAt'>
  ): Promise<PromptVersion> {
    const result = await this.repository.createVersion({ ...version, templateId });
    return this.mapVersion(result);
  }

  async getVersion(versionId: string): Promise<PromptVersion | null> {
    const result = await this.repository.findVersionById(versionId);
    return result ? this.mapVersion(result) : null;
  }

  async setActiveVersion(templateId: string, versionId: string): Promise<PromptTemplate | null> {
    const result = await this.repository.setActiveVersion(templateId, versionId);
    return result ? this.mapTemplate(result) : null;
  }

  async listVersions(templateId: string, userId: string): Promise<PromptVersion[]> {
    const results = await this.repository.listVersions(templateId, userId);
    return results.map((v) => this.mapVersion(v));
  }

  // Snippet management
  async createSnippet(snippet: Omit<PromptSnippet, 'id' | 'usageCount'>): Promise<PromptSnippet> {
    const result = await this.repository.createSnippet(snippet);
    return this.mapSnippet(result);
  }

  async getSnippet(id: string): Promise<PromptSnippet | null> {
    const result = await this.repository.findSnippetById(id);
    return result ? this.mapSnippet(result) : null;
  }

  async updateSnippet(id: string, updates: Partial<PromptSnippet>): Promise<PromptSnippet | null> {
    const result = await this.repository.updateSnippet(id, updates);
    return result ? this.mapSnippet(result) : null;
  }

  async deleteSnippet(id: string): Promise<boolean> {
    return this.repository.deleteSnippet(id);
  }

  async listSnippets(userId: string, filter?: Partial<PromptSnippet>): Promise<PromptSnippet[]> {
    const results = await this.repository.listSnippets(userId, filter);
    return results.map((s) => this.mapSnippet(s));
  }

  async incrementSnippetUsage(id: string): Promise<void> {
    await this.repository.incrementSnippetUsage(id);
  }

  // Template compilation and execution
  async compileTemplate(
    templateId: string,
    userId: string,
    versionId?: string,
    variables?: Record<string, any>
  ): Promise<string> {
    const template = await this.getTemplate(templateId, userId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    let version: PromptVersion | null;
    if (versionId) {
      version = await this.getVersion(versionId);
    } else {
      // Find current version from template's currentVersion ID
      // Note: getTemplate already fetched basic info, but we need the actual version object
      version = await this.getVersion(template.currentVersion);
    }

    if (!version) throw new Error(`Version not found: ${versionId || template.currentVersion}`);

    let compiledContent = version.content;
    const templateVariables = { ...version.variables, ...variables };

    // Replace variables with actual values
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      compiledContent = compiledContent.replace(regex, String(value));
    });

    return compiledContent;
  }

  async executeTemplate(
    templateId: string,
    userId: string,
    versionId?: string,
    variables?: Record<string, any>
  ): Promise<PromptExecutionResult> {
    const startTime = Date.now();
    let success = false;
    let result: any = null;
    let error: string | undefined;

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
    } catch (e: any) {
      error = e.message;
      success = false;
    }

    const responseTime = Date.now() - startTime;

    // Resolve version ID if missing
    const finalVersionId =
      versionId || (await this.getTemplate(templateId, userId))?.currentVersion || '';

    const executionResult: PromptExecutionResult = {
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
  async getTemplateAnalytics(templateId: string): Promise<PromptTemplate['analytics']> {
    const analytics = await this.repository.getTemplateAnalytics(templateId);
    return (analytics as PromptTemplate['analytics']) || undefined;
  }

  async recordExecution(result: PromptExecutionResult): Promise<void> {
    await this.repository.recordExecution(result);
  }

  // Mappers to ensure type safety between DB and Domain entities
  private mapTemplate(dbRecord: any): PromptTemplate {
    return {
      ...dbRecord,
      currentVersion: dbRecord.currentVersionId, // Map DB column to Interface field
      // versions are typically not loaded by default unless requested, but here we might need them or leave empty
      versions: dbRecord.versions ? dbRecord.versions.map((v: any) => this.mapVersion(v)) : [],
    };
  }

  private mapVersion(dbRecord: any): PromptVersion {
    return {
      ...dbRecord,
      // Ensure specific fields map correctly if needed
    };
  }

  private mapSnippet(dbRecord: any): PromptSnippet {
    return {
      ...dbRecord,
    };
  }
}

export default PromptTemplateServiceImpl;
