import {
  PromptTemplate,
  PromptVersion,
  PromptSnippet,
  PromptBlock,
  PromptExecutionResult,
  PromptTemplateService
} from './types.js';

export class PromptTemplateServiceImpl implements PromptTemplateService {
  private templates: Map<string, PromptTemplate> = new Map();
  private versions: Map<string, PromptVersion> = new Map();
  private snippets: Map<string, PromptSnippet> = new Map();
  private executionResults: PromptExecutionResult[] = [];

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default snippets
    const defaultSnippets: PromptSnippet[] = [
      {
        id: 'snippet-1',
        name: 'System Role',
        content: 'You are a helpful AI assistant specialized in {{domain}}.',
        type: 'system',
        category: 'System',
        tags: ['role', 'system'],
        usageCount: 245,
        description: 'Basic system role with domain specialization',
        isStarred: true
      },
      {
        id: 'snippet-2',
        name: 'Context Block',
        content: '# Context\n{{context_description}}\n\n{{context_data}}',
        type: 'user',
        category: 'Context',
        tags: ['context', 'input'],
        usageCount: 189,
        description: 'Structured context injection block'
      },
      {
        id: 'snippet-3',
        name: 'Task Definition',
        content: '# Task\n{{task_description}}\n\n## Requirements\n{{requirements}}',
        type: 'user',
        category: 'Instructions',
        tags: ['task', 'requirements'],
        usageCount: 156,
        description: 'Structured task definition with requirements'
      },
      {
        id: 'snippet-4',
        name: 'Output Format',
        content: '# Output Format\nRespond in the following structure:\n{{format_template}}',
        type: 'user',
        category: 'Output',
        tags: ['format', 'structure'],
        usageCount: 134,
        description: 'Output format specification'
      },
      {
        id: 'snippet-5',
        name: 'Function Call',
        content: '{{function_name}}({{parameters}})',
        type: 'function',
        category: 'Functions',
        tags: ['function', 'call'],
        usageCount: 98,
        description: 'Function invocation template'
      },
      {
        id: 'snippet-6',
        name: 'Summary Section',
        content: '# Summary\n{{summary_content}}',
        type: 'summary',
        category: 'Content',
        tags: ['summary', 'content'],
        usageCount: 87,
        description: 'Content summary block'
      }
    ];

    defaultSnippets.forEach(snippet => {
      this.snippets.set(snippet.id, snippet);
    });

    // Create default template
    const defaultVersion: PromptVersion = {
      id: 'version-1',
      version: 1,
      name: 'Initial Version',
      label: 'production',
      content: `You are a helpful AI assistant specialized in {{domain}}.

# Task
{{task_description}}

## Requirements
{{requirements}}

# Context
{{context_description}}

{{context_data}}

# Output Format
Respond in the following structure:
{{format_template}}`,
      variables: {
        domain: 'general assistance',
        task_description: 'Help the user with their request',
        requirements: '- Be helpful and accurate\n- Provide clear explanations\n- Ask for clarification if needed',
        context_description: 'User context and background information',
        context_data: '',
        format_template: 'Provide a clear, structured response'
      },
      blocks: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      createdBy: 'System',
      isActive: true,
      metrics: {
        successRate: 94.2,
        totalRuns: 127,
        avgResponseTime: 1250,
        lastRun: new Date(Date.now() - 1000 * 60 * 15)
      },
      changelog: 'Initial template version'
    };

    const defaultTemplate: PromptTemplate = {
      id: 'template-1',
      name: 'General Assistant Template',
      description: 'A versatile template for general AI assistance tasks',
      currentVersion: 'version-1',
      versions: [defaultVersion],
      blocks: [],
      variables: defaultVersion.variables,
      tags: ['general', 'assistant', 'help'],
      category: 'General',
      isPublic: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      updatedAt: new Date(),
      analytics: {
        totalRuns: 127,
        successRate: 94.2,
        popularVariables: ['task_description', 'domain', 'requirements'],
        recentActivity: [
          new Date(Date.now() - 1000 * 60 * 15),
          new Date(Date.now() - 1000 * 60 * 45),
          new Date(Date.now() - 1000 * 60 * 60 * 2)
        ]
      }
    };

    this.templates.set(defaultTemplate.id, defaultTemplate);
    this.versions.set(defaultVersion.id, defaultVersion);
  }

  // Template management
  async createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptTemplate> {
    const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newTemplate: PromptTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  async getTemplate(id: string): Promise<PromptTemplate | null> {
    return this.templates.get(id) || null;
  }

  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate | null> {
    const template = this.templates.get(id);
    if (!template) return null;

    const updatedTemplate: PromptTemplate = {
      ...template,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  async listTemplates(filter?: Partial<PromptTemplate>): Promise<PromptTemplate[]> {
    const templates = Array.from(this.templates.values());
    
    if (!filter) return templates;

    return templates.filter(template => {
      return Object.entries(filter).every(([key, value]) => {
        if (value === undefined) return true;
        return template[key as keyof PromptTemplate] === value;
      });
    });
  }

  // Version management
  async createVersion(templateId: string, version: Omit<PromptVersion, 'id' | 'createdAt'>): Promise<PromptVersion> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    const id = `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newVersion: PromptVersion = {
      ...version,
      id,
      createdAt: now
    };

    // Add to versions map
    this.versions.set(id, newVersion);

    // Update template with new version
    const updatedTemplate = {
      ...template,
      versions: [...template.versions, newVersion],
      updatedAt: now
    };

    this.templates.set(templateId, updatedTemplate);
    return newVersion;
  }

  async getVersion(versionId: string): Promise<PromptVersion | null> {
    return this.versions.get(versionId) || null;
  }

  async setActiveVersion(templateId: string, versionId: string): Promise<PromptTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const version = this.versions.get(versionId);
    if (!version) return null;

    const updatedTemplate = {
      ...template,
      currentVersion: versionId,
      updatedAt: new Date()
    };

    this.templates.set(templateId, updatedTemplate);
    return updatedTemplate;
  }

  async listVersions(templateId: string): Promise<PromptVersion[]> {
    const template = this.templates.get(templateId);
    return template ? template.versions : [];
  }

  // Snippet management
  async createSnippet(snippet: Omit<PromptSnippet, 'id' | 'usageCount'>): Promise<PromptSnippet> {
    const id = `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newSnippet: PromptSnippet = {
      ...snippet,
      id,
      usageCount: 0
    };

    this.snippets.set(id, newSnippet);
    return newSnippet;
  }

  async getSnippet(id: string): Promise<PromptSnippet | null> {
    return this.snippets.get(id) || null;
  }

  async updateSnippet(id: string, updates: Partial<PromptSnippet>): Promise<PromptSnippet | null> {
    const snippet = this.snippets.get(id);
    if (!snippet) return null;

    const updatedSnippet = {
      ...snippet,
      ...updates,
      id // Ensure ID doesn't change
    };

    this.snippets.set(id, updatedSnippet);
    return updatedSnippet;
  }

  async deleteSnippet(id: string): Promise<boolean> {
    return this.snippets.delete(id);
  }

  async listSnippets(filter?: Partial<PromptSnippet>): Promise<PromptSnippet[]> {
    const snippets = Array.from(this.snippets.values());
    
    if (!filter) return snippets;

    return snippets.filter(snippet => {
      return Object.entries(filter).every(([key, value]) => {
        if (value === undefined) return true;
        return snippet[key as keyof PromptSnippet] === value;
      });
    });
  }

  async incrementSnippetUsage(id: string): Promise<void> {
    const snippet = this.snippets.get(id);
    if (snippet) {
      snippet.usageCount += 1;
      this.snippets.set(id, snippet);
    }
  }

  // Template compilation and execution
  async compileTemplate(templateId: string, versionId?: string, variables?: Record<string, any>): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    const version = versionId 
      ? this.versions.get(versionId) 
      : template.versions.find(v => v.id === template.currentVersion);
    
    if (!version) throw new Error(`Version not found: ${versionId || template.currentVersion}`);

    let compiled = version.content;
    const templateVariables = { ...version.variables, ...variables };

    // Replace variables with actual values
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      compiled = compiled.replace(regex, String(value));
    });

    return compiled;
  }

  async executeTemplate(templateId: string, versionId?: string, variables?: Record<string, any>): Promise<PromptExecutionResult> {
    const startTime = Date.now();
    
    try {
      const compiled = await this.compileTemplate(templateId, versionId, variables);
      const responseTime = Date.now() - startTime;
      
      // Simulate execution (in real implementation, this would call an LLM)
      const mockResult = {
        response: "This is a simulated response based on the compiled template.",
        tokenUsage: Math.floor(Math.random() * 500) + 100
      };

      const result: PromptExecutionResult = {
        id: `execution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        versionId: versionId || this.templates.get(templateId)?.currentVersion || '',
        executedAt: new Date(),
        success: true,
        responseTime,
        tokenUsage: mockResult.tokenUsage,
        result: mockResult,
        variables: variables || {}
      };

      this.executionResults.push(result);
      await this.recordExecution(result);
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const result: PromptExecutionResult = {
        id: `execution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        versionId: versionId || '',
        executedAt: new Date(),
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        variables: variables || {}
      };

      this.executionResults.push(result);
      await this.recordExecution(result);
      
      return result;
    }
  }

  // Analytics
  async getTemplateAnalytics(templateId: string): Promise<PromptTemplate['analytics']> {
    const template = this.templates.get(templateId);
    return template?.analytics;
  }

  async recordExecution(result: PromptExecutionResult): Promise<void> {
    // Update template analytics
    const template = this.templates.get(result.templateId);
    if (!template) return;

    const analytics = template.analytics || {
      totalRuns: 0,
      successRate: 0,
      popularVariables: [],
      recentActivity: []
    };

    analytics.totalRuns += 1;
    analytics.recentActivity = [result.executedAt, ...analytics.recentActivity.slice(0, 9)];
    
    // Calculate success rate
    const recentResults = this.executionResults
      .filter(r => r.templateId === result.templateId)
      .slice(-100); // Last 100 executions
    
    const successCount = recentResults.filter(r => r.success).length;
    analytics.successRate = Math.round((successCount / recentResults.length) * 100);

    // Update version metrics
    if (result.versionId) {
      const version = this.versions.get(result.versionId);
      if (version) {
        if (!version.metrics) {
          version.metrics = {
            successRate: 0,
            totalRuns: 0,
            avgResponseTime: 0
          };
        }

        version.metrics.totalRuns += 1;
        version.metrics.lastRun = result.executedAt;
        
        // Update response time (simple average)
        version.metrics.avgResponseTime = Math.round(
          (version.metrics.avgResponseTime * (version.metrics.totalRuns - 1) + result.responseTime) / 
          version.metrics.totalRuns
        );

        // Update success rate
        const versionResults = this.executionResults
          .filter(r => r.versionId === result.versionId)
          .slice(-100);
        
        const versionSuccessCount = versionResults.filter(r => r.success).length;
        version.metrics.successRate = Math.round((versionSuccessCount / versionResults.length) * 100);

        this.versions.set(result.versionId, version);
      }
    }

    // Update template
    this.templates.set(result.templateId, {
      ...template,
      analytics,
      updatedAt: new Date()
    });
  }
}

export default PromptTemplateServiceImpl;
