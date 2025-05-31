import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Template interfaces and types
export interface ClaudeDevTemplate {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'analysis' | 'automation' | 'communication';
  prompt: string;
  parameters: TemplateParameter[];
  outputFormat?: 'json' | 'markdown' | 'code' | 'plain';
  estimatedTokens: number;
  tags: string[];
}

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface AutomationRequest {
  templateId: string;
  parameters: Record<string, any>;
  userId: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: Date;
  context?: {
    projectId?: string;
    workflowId?: string;
    parentTaskId?: string;
  };
}

export interface AutomationResult {
  id: string;
  templateId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
  tokensUsed: number;
  cost: number;
  metadata: {
    userId: string;
    templateName: string;
    parameters: Record<string, any>;
  };
}

@Injectable()
export class ClaudeDevAutomationService {
  private readonly logger = new Logger(ClaudeDevAutomationService.name);
  private readonly redis: Redis;
  private readonly templates: Map<string, ClaudeDevTemplate> = new Map();

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      db: this.configService.get('REDIS_DB', 0),
    });
    
    this.initializeTemplates();
  }

  private async initializeTemplates(): Promise<void> {
    // Load templates from configuration or database
    const defaultTemplates: ClaudeDevTemplate[] = [
      {
        id: 'code-review',
        name: 'Automated Code Review',
        description: 'Comprehensive code review with suggestions for improvements',
        category: 'development',
        prompt: `Review the following code and provide detailed feedback:

Code: {{code}}
Language: {{language}}
Context: {{context}}

Please analyze:
1. Code quality and best practices
2. Performance considerations  
3. Security vulnerabilities
4. Maintainability improvements
5. Documentation suggestions

Format the response as structured feedback with specific line-by-line comments where applicable.`,
        parameters: [
          {
            name: 'code',
            type: 'string',
            description: 'The code to review',
            required: true,
          },
          {
            name: 'language',
            type: 'string',
            description: 'Programming language',
            required: true,
            validation: {
              options: ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'other']
            }
          },
          {
            name: 'context',
            type: 'string',
            description: 'Additional context about the code purpose',
            required: false,
          }
        ],
        outputFormat: 'markdown',
        estimatedTokens: 2000,
        tags: ['development', 'quality', 'review']
      },
      {
        id: 'api-documentation',
        name: 'API Documentation Generator',
        description: 'Generate comprehensive API documentation from code',
        category: 'development',
        prompt: `Generate comprehensive API documentation for the following endpoints:

Code: {{code}}
API Type: {{apiType}}
Include Examples: {{includeExamples}}

Please generate:
1. Endpoint descriptions
2. Request/response schemas
3. Parameter documentation
4. Error codes and handling
5. Usage examples (if requested)
6. Authentication details

Format as {{outputFormat}}.`,
        parameters: [
          {
            name: 'code',
            type: 'string',
            description: 'API code or endpoint definitions',
            required: true,
          },
          {
            name: 'apiType',
            type: 'string',
            description: 'Type of API (REST, GraphQL, etc.)',
            required: true,
            defaultValue: 'REST'
          },
          {
            name: 'includeExamples',
            type: 'boolean',
            description: 'Include usage examples',
            required: false,
            defaultValue: true
          }
        ],
        outputFormat: 'markdown',
        estimatedTokens: 3000,
        tags: ['documentation', 'api', 'development']
      },
      {
        id: 'test-generation',
        name: 'Unit Test Generator',
        description: 'Generate comprehensive unit tests for given code',
        category: 'development',
        prompt: `Generate comprehensive unit tests for the following code:

Code: {{code}}
Testing Framework: {{framework}}
Coverage Requirements: {{coverage}}

Please generate:
1. Test cases for all public methods
2. Edge case testing
3. Mock dependencies where needed
4. Error condition testing
5. Setup and teardown code

Ensure {{coverage}}% code coverage and follow {{framework}} best practices.`,
        parameters: [
          {
            name: 'code',
            type: 'string',
            description: 'Code to generate tests for',
            required: true,
          },
          {
            name: 'framework',
            type: 'string',
            description: 'Testing framework to use',
            required: true,
            validation: {
              options: ['jest', 'mocha', 'jasmine', 'pytest', 'junit', 'other']
            }
          },
          {
            name: 'coverage',
            type: 'number',
            description: 'Required code coverage percentage',
            required: false,
            defaultValue: 80,
            validation: {
              min: 50,
              max: 100
            }
          }
        ],
        outputFormat: 'code',
        estimatedTokens: 2500,
        tags: ['testing', 'development', 'quality']
      },
      {
        id: 'data-analysis',
        name: 'Data Analysis Report',
        description: 'Analyze datasets and generate insights',
        category: 'analysis',
        prompt: `Analyze the following dataset and provide insights:

Data: {{data}}
Analysis Type: {{analysisType}}
Focus Areas: {{focusAreas}}

Please provide:
1. Data summary and statistics
2. Key patterns and trends
3. Anomalies or outliers
4. Actionable insights
5. Recommendations
6. Visualizations suggestions

Format the analysis as a comprehensive report.`,
        parameters: [
          {
            name: 'data',
            type: 'string',
            description: 'Dataset to analyze (CSV, JSON, or description)',
            required: true,
          },
          {
            name: 'analysisType',
            type: 'string',
            description: 'Type of analysis to perform',
            required: true,
            validation: {
              options: ['descriptive', 'diagnostic', 'predictive', 'prescriptive']
            }
          },
          {
            name: 'focusAreas',
            type: 'array',
            description: 'Specific areas to focus the analysis on',
            required: false,
          }
        ],
        outputFormat: 'markdown',
        estimatedTokens: 3500,
        tags: ['analysis', 'data', 'insights']
      }
    ];

    // Load templates into memory
    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }

    this.logger.log(`Initialized ${defaultTemplates.length} templates`);
  }

  async listTemplates(category?: string): Promise<ClaudeDevTemplate[]> {
    const templates = Array.from(this.templates.values());
    return category 
      ? templates.filter(t => t.category === category)
      : templates;
  }

  async getTemplate(templateId: string): Promise<ClaudeDevTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async executeAutomation(request: AutomationRequest): Promise<AutomationResult> {
    const template = this.templates.get(request.templateId);
    if (!template) {
      throw new Error(`Template not found: ${request.templateId}`);
    }

    const automationId = `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result: AutomationResult = {
      id: automationId,
      templateId: request.templateId,
      status: 'pending',
      startTime: new Date(),
      tokensUsed: 0,
      cost: 0,
      metadata: {
        userId: request.userId,
        templateName: template.name,
        parameters: request.parameters,
      }
    };

    // Store initial result
    await this.redis.set(
      `automation:${automationId}`,
      JSON.stringify(result),
      'EX',
      3600 // 1 hour expiry
    );

    // Process automation asynchronously
    this.processAutomation(result, template, request.parameters)
      .catch(error => {
        this.logger.error(`Automation ${automationId} failed:`, error);
      });

    return result;
  }

  private async processAutomation(
    result: AutomationResult,
    template: ClaudeDevTemplate,
    parameters: Record<string, any>
  ): Promise<void> {
    try {
      result.status = 'running';
      await this.updateAutomationResult(result);

      // Validate parameters
      this.validateParameters(template.parameters, parameters);

      // Generate prompt by substituting parameters
      const prompt = this.generatePrompt(template.prompt, parameters);

      // Execute Claude request (mock for now - replace with actual Claude API call)
      const mockResult = await this.executeClaude(prompt, template);

      result.status = 'completed';
      result.result = mockResult;
      result.endTime = new Date();
      result.tokensUsed = template.estimatedTokens; // Mock value
      result.cost = this.calculateCost(result.tokensUsed);

    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      result.endTime = new Date();
      this.logger.error(`Automation ${result.id} failed:`, error);
    }

    await this.updateAutomationResult(result);
  }

  private validateParameters(
    templateParams: TemplateParameter[],
    provided: Record<string, any>
  ): void {
    for (const param of templateParams) {
      if (param.required && !(param.name in provided)) {
        throw new Error(`Required parameter missing: ${param.name}`);
      }

      const value = provided[param.name];
      if (value !== undefined) {
        // Type validation
        if (param.type === 'number' && typeof value !== 'number') {
          throw new Error(`Parameter ${param.name} must be a number`);
        }
        if (param.type === 'boolean' && typeof value !== 'boolean') {
          throw new Error(`Parameter ${param.name} must be a boolean`);
        }
        if (param.type === 'array' && !Array.isArray(value)) {
          throw new Error(`Parameter ${param.name} must be an array`);
        }

        // Validation rules
        if (param.validation) {
          const { min, max, pattern, options } = param.validation;
          
          if (min !== undefined && value < min) {
            throw new Error(`Parameter ${param.name} must be >= ${min}`);
          }
          if (max !== undefined && value > max) {
            throw new Error(`Parameter ${param.name} must be <= ${max}`);
          }
          if (pattern && typeof value === 'string' && !new RegExp(pattern).test(value)) {
            throw new Error(`Parameter ${param.name} does not match required pattern`);
          }
          if (options && !options.includes(value)) {
            throw new Error(`Parameter ${param.name} must be one of: ${options.join(', ')}`);
          }
        }
      }
    }
  }

  private generatePrompt(template: string, parameters: Record<string, any>): string {
    let prompt = template;
    
    // Replace {{parameter}} placeholders with actual values
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{{${key}}}`;
      const replacement = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);
      prompt = prompt.replace(new RegExp(placeholder, 'g'), replacement);
    }

    return prompt;
  }

  private async executeClaude(prompt: string, template: ClaudeDevTemplate): Promise<any> {
    // Mock implementation - replace with actual Claude API call
    this.logger.log(`Executing Claude request for template: ${template.name}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response based on template type
    switch (template.category) {
      case 'development':
        return {
          type: 'code_analysis',
          findings: ['Mock finding 1', 'Mock finding 2'],
          suggestions: ['Mock suggestion 1', 'Mock suggestion 2'],
          confidence: 0.85
        };
      case 'analysis':
        return {
          type: 'data_analysis',
          summary: 'Mock data analysis summary',
          insights: ['Mock insight 1', 'Mock insight 2'],
          recommendations: ['Mock recommendation 1']
        };
      default:
        return {
          type: 'general',
          content: 'Mock response content',
          metadata: { processed_at: new Date().toISOString() }
        };
    }
  }

  private calculateCost(tokens: number): number {
    // Mock cost calculation - replace with actual pricing
    const costPerToken = 0.000001; // $0.000001 per token
    return tokens * costPerToken;
  }

  private async updateAutomationResult(result: AutomationResult): Promise<void> {
    await this.redis.set(
      `automation:${result.id}`,
      JSON.stringify(result),
      'EX',
      3600 // 1 hour expiry
    );
  }

  async getAutomationResult(automationId: string): Promise<AutomationResult | null> {
    const data = await this.redis.get(`automation:${automationId}`);
    return data ? JSON.parse(data) : null;
  }

  async listAutomations(userId: string, limit = 50): Promise<AutomationResult[]> {
    // This is a simplified implementation - in production you'd want proper indexing
    const keys = await this.redis.keys('automation:*');
    const results: AutomationResult[] = [];

    for (const key of keys.slice(0, limit)) {
      const data = await this.redis.get(key);
      if (data) {
        const result: AutomationResult = JSON.parse(data);
        if (result.metadata.userId === userId) {
          results.push(result);
        }
      }
    }

    return results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async cancelAutomation(automationId: string, userId: string): Promise<boolean> {
    const result = await this.getAutomationResult(automationId);
    
    if (!result || result.metadata.userId !== userId) {
      return false;
    }

    if (result.status === 'completed' || result.status === 'failed' || result.status === 'cancelled') {
      return false;
    }

    result.status = 'cancelled';
    result.endTime = new Date();
    
    await this.updateAutomationResult(result);
    return true;
  }

  async createCustomTemplate(template: Omit<ClaudeDevTemplate, 'id'>): Promise<string> {
    const templateId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTemplate: ClaudeDevTemplate = {
      ...template,
      id: templateId,
    };

    this.templates.set(templateId, fullTemplate);

    // Persist to Redis
    await this.redis.set(
      `template:${templateId}`,
      JSON.stringify(fullTemplate),
      'EX',
      86400 // 24 hours
    );

    this.logger.log(`Created custom template: ${templateId}`);
    return templateId;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    if (!templateId.startsWith('custom_')) {
      throw new Error('Cannot delete built-in templates');
    }

    const deleted = this.templates.delete(templateId);
    if (deleted) {
      await this.redis.del(`template:${templateId}`);
    }

    return deleted;
  }

  async getUsageStats(userId: string): Promise<{
    totalAutomations: number;
    successfulAutomations: number;
    failedAutomations: number;
    totalTokensUsed: number;
    totalCost: number;
    averageExecutionTime: number;
  }> {
    const automations = await this.listAutomations(userId, 1000);
    
    const stats = {
      totalAutomations: automations.length,
      successfulAutomations: automations.filter(a => a.status === 'completed').length,
      failedAutomations: automations.filter(a => a.status === 'failed').length,
      totalTokensUsed: automations.reduce((sum, a) => sum + a.tokensUsed, 0),
      totalCost: automations.reduce((sum, a) => sum + a.cost, 0),
      averageExecutionTime: 0
    };

    // Calculate average execution time for completed automations
    const completedAutomations = automations.filter(a => a.endTime);
    if (completedAutomations.length > 0) {
      const totalTime = completedAutomations.reduce((sum, a) => {
        return sum + (a.endTime!.getTime() - a.startTime.getTime());
      }, 0);
      stats.averageExecutionTime = totalTime / completedAutomations.length;
    }

    return stats;
  }
}
