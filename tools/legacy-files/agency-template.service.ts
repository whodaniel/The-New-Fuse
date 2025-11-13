/**
 * Agency Template Service
 * Provides standardized templates for agency creation and configuration
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface AgentTemplate {
  name: string;
  slug: string;
  roleDefinition: string;
  whenToUse?: string;
  customInstructions?: string;
  groups: (string | [string, FileRestriction])[];
  fileRestrictions?: FileRestriction;
  preferredModel?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  mcpServers?: string[];
  autoApprove?: string[];
  categories?: string[];
  tags?: string[];
  allowedFeatures?: string[];
  resourceLimits?: Record<string, any>;
}

export interface FileRestriction {
  fileRegex: string;
  description: string;
}

export interface AgencyTemplateData {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  agents: AgentTemplate[];
  features: string[];
  integrations: string[];
  settings: {
    defaultTheme?: string;
    enabledFeatures?: string[];
    maxUsers?: number;
    maxAgents?: number;
    storageLimit?: number;
  };
}

@Injectable()
export class AgencyTemplateService extends EventEmitter {
  private readonly logger = new Logger(AgencyTemplateService.name);
  private templates: Map<string, AgencyTemplateData> = new Map();

  constructor() {
    super();
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default agency templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: AgencyTemplateData[] = [
      {
        id: 'basic',
        name: 'Basic Agency',
        description: 'Simple agency setup with essential features',
        category: 'starter',
        version: '1.0.0',
        agents: [
          {
            name: 'General Assistant',
            slug: 'general-assistant',
            roleDefinition: 'A versatile AI assistant capable of handling various tasks',
            whenToUse: 'For general purpose assistance and basic automation',
            groups: ['read', 'edit'],
            preferredModel: 'claude-3-sonnet',
            temperature: 0.7,
            maxTokens: 4096,
            categories: ['general', 'assistant'],
            tags: ['general-purpose', 'automation'],
            allowedFeatures: ['text-generation', 'basic-analysis'],
            resourceLimits: {
              maxRequestsPerHour: 100,
              maxTokensPerRequest: 4096
            }
          }
        ],
        features: ['user-management', 'basic-analytics', 'file-storage'],
        integrations: ['email', 'calendar'],
        settings: {
          defaultTheme: 'light',
          enabledFeatures: ['user-management', 'basic-analytics'],
          maxUsers: 10,
          maxAgents: 5,
          storageLimit: 1000 // MB
        }
      },
      {
        id: 'development',
        name: 'Development Agency',
        description: 'Full-featured development team with coding specialists',
        category: 'professional',
        version: '1.0.0',
        agents: [
          {
            name: 'Senior Developer',
            slug: 'senior-developer',
            roleDefinition: 'Expert full-stack developer with architectural knowledge',
            whenToUse: 'For complex development tasks, code review, and system design',
            groups: ['read', 'edit', 'command', 'browser'],
            fileRestrictions: {
              fileRegex: '\\.(js|ts|jsx|tsx|py|java|go|rs|c|cpp|h|hpp)$',
              description: 'Source code files'
            },
            preferredModel: 'claude-3-sonnet',
            temperature: 0.3,
            maxTokens: 8192,
            categories: ['development', 'architecture'],
            tags: ['coding', 'architecture', 'full-stack'],
            allowedFeatures: ['code-generation', 'code-analysis', 'terminal-access'],
            resourceLimits: {
              maxRequestsPerHour: 200,
              maxTokensPerRequest: 8192
            }
          },
          {
            name: 'Code Reviewer',
            slug: 'code-reviewer',
            roleDefinition: 'Specialized in code quality, security, and best practices',
            whenToUse: 'For code reviews, security audits, and quality assurance',
            groups: ['read', 'edit'],
            fileRestrictions: {
              fileRegex: '\\.(js|ts|jsx|tsx|py|java|go|rs|c|cpp|h|hpp|json|yaml|yml)$',
              description: 'Code and configuration files'
            },
            preferredModel: 'claude-3-sonnet',
            temperature: 0.2,
            maxTokens: 6144,
            categories: ['development', 'quality'],
            tags: ['code-review', 'security', 'best-practices'],
            allowedFeatures: ['code-analysis', 'security-scanning'],
            resourceLimits: {
              maxRequestsPerHour: 150,
              maxTokensPerRequest: 6144
            }
          },
          {
            name: 'DevOps Engineer',
            slug: 'devops-engineer',
            roleDefinition: 'Infrastructure and deployment automation specialist',
            whenToUse: 'For CI/CD, infrastructure management, and deployment tasks',
            groups: ['read', 'edit', 'command'],
            fileRestrictions: {
              fileRegex: '\\.(yaml|yml|json|dockerfile|sh|ps1|tf|hcl)$|docker|k8s|kubernetes',
              description: 'Infrastructure and deployment files'
            },
            preferredModel: 'claude-3-sonnet',
            temperature: 0.4,
            maxTokens: 6144,
            categories: ['devops', 'infrastructure'],
            tags: ['ci-cd', 'infrastructure', 'automation'],
            allowedFeatures: ['terminal-access', 'infrastructure-management'],
            resourceLimits: {
              maxRequestsPerHour: 100,
              maxTokensPerRequest: 6144
            }
          }
        ],
        features: [
          'user-management',
          'advanced-analytics',
          'file-storage',
          'git-integration',
          'ci-cd-integration',
          'deployment-management'
        ],
        integrations: [
          'github',
          'gitlab',
          'docker',
          'kubernetes',
          'aws',
          'azure',
          'gcp',
          'slack',
          'discord'
        ],
        settings: {
          defaultTheme: 'dark',
          enabledFeatures: [
            'user-management',
            'advanced-analytics',
            'git-integration',
            'ci-cd-integration'
          ],
          maxUsers: 50,
          maxAgents: 20,
          storageLimit: 10000 // MB
        }
      },
      {
        id: 'marketing',
        name: 'Marketing Agency',
        description: 'Content creation and marketing automation specialists',
        category: 'specialized',
        version: '1.0.0',
        agents: [
          {
            name: 'Content Creator',
            slug: 'content-creator',
            roleDefinition: 'Expert in creating engaging content across various formats',
            whenToUse: 'For blog posts, social media content, and marketing materials',
            groups: ['read', 'edit', 'browser'],
            fileRestrictions: {
              fileRegex: '\\.(md|txt|html|css|json)$|content|blog|marketing',
              description: 'Content and marketing files'
            },
            preferredModel: 'claude-3-sonnet',
            temperature: 0.8,
            maxTokens: 6144,
            categories: ['marketing', 'content'],
            tags: ['content-creation', 'copywriting', 'social-media'],
            allowedFeatures: ['text-generation', 'web-research', 'image-analysis'],
            resourceLimits: {
              maxRequestsPerHour: 200,
              maxTokensPerRequest: 6144
            }
          },
          {
            name: 'SEO Specialist',
            slug: 'seo-specialist',
            roleDefinition: 'Search engine optimization and web analytics expert',
            whenToUse: 'For SEO optimization, keyword research, and web analytics',
            groups: ['read', 'edit', 'browser'],
            fileRestrictions: {
              fileRegex: '\\.(html|css|js|json|xml|txt)$|seo|analytics',
              description: 'Web and SEO related files'
            },
            preferredModel: 'claude-3-sonnet',
            temperature: 0.5,
            maxTokens: 4096,
            categories: ['marketing', 'seo'],
            tags: ['seo', 'analytics', 'web-optimization'],
            allowedFeatures: ['web-research', 'analytics-integration'],
            resourceLimits: {
              maxRequestsPerHour: 150,
              maxTokensPerRequest: 4096
            }
          }
        ],
        features: [
          'user-management',
          'analytics-dashboard',
          'content-management',
          'social-media-integration',
          'campaign-tracking'
        ],
        integrations: [
          'google-analytics',
          'facebook',
          'twitter',
          'linkedin',
          'instagram',
          'hubspot',
          'mailchimp'
        ],
        settings: {
          defaultTheme: 'light',
          enabledFeatures: [
            'content-management',
            'social-media-integration',
            'analytics-dashboard'
          ],
          maxUsers: 30,
          maxAgents: 15,
          storageLimit: 5000 // MB
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise Agency',
        description: 'Full-scale enterprise solution with all features',
        category: 'enterprise',
        version: '1.0.0',
        agents: [
          {
            name: 'Enterprise Coordinator',
            slug: 'enterprise-coordinator',
            roleDefinition: 'High-level coordinator for complex enterprise workflows',
            whenToUse: 'For coordinating multiple agents and complex business processes',
            groups: ['read', 'edit', 'command', 'browser', 'mcp'],
            preferredModel: 'claude-3-opus',
            temperature: 0.6,
            maxTokens: 8192,
            categories: ['enterprise', 'coordination'],
            tags: ['coordination', 'workflow', 'enterprise'],
            allowedFeatures: [
              'agent-coordination',
              'workflow-management',
              'advanced-analytics',
              'custom-integrations'
            ],
            resourceLimits: {
              maxRequestsPerHour: 500,
              maxTokensPerRequest: 8192
            }
          },
          {
            name: 'Data Analyst',
            slug: 'data-analyst',
            roleDefinition: 'Advanced data analysis and business intelligence expert',
            whenToUse: 'For complex data analysis, reporting, and business insights',
            groups: ['read', 'edit', 'command'],
            fileRestrictions: {
              fileRegex: '\\.(csv|xlsx|json|sql|py|r)$|data|analytics',
              description: 'Data and analytics files'
            },
            preferredModel: 'claude-3-sonnet',
            temperature: 0.3,
            maxTokens: 8192,
            categories: ['analytics', 'data'],
            tags: ['data-analysis', 'business-intelligence', 'reporting'],
            allowedFeatures: ['data-analysis', 'visualization', 'database-access'],
            resourceLimits: {
              maxRequestsPerHour: 300,
              maxTokensPerRequest: 8192
            }
          }
        ],
        features: [
          'advanced-user-management',
          'enterprise-analytics',
          'custom-integrations',
          'white-labeling',
          'sso-integration',
          'advanced-security',
          'audit-logging',
          'compliance-tools'
        ],
        integrations: [
          'active-directory',
          'okta',
          'salesforce',
          'dynamics',
          'sap',
          'oracle',
          'custom-apis'
        ],
        settings: {
          defaultTheme: 'corporate',
          enabledFeatures: [
            'advanced-user-management',
            'enterprise-analytics',
            'custom-integrations',
            'sso-integration',
            'advanced-security'
          ],
          maxUsers: -1, // unlimited
          maxAgents: -1, // unlimited
          storageLimit: -1 // unlimited
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    this.logger.log(`Initialized ${defaultTemplates.length} default agency templates`);
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<AgencyTemplateData> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template '${templateId}' not found`);
    }
    return template;
  }

  /**
   * List all available templates
   */
  async listTemplates(): Promise<AgencyTemplateData[]> {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<AgencyTemplateData[]> {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    );
  }

  /**
   * Register a new template
   */
  async registerTemplate(template: AgencyTemplateData): Promise<void> {
    this.templates.set(template.id, template);
    this.emit('template:registered', { templateId: template.id, name: template.name });
    this.logger.log(`Registered new template: ${template.id}`);
  }

  /**
   * Update existing template
   */
  async updateTemplate(templateId: string, updates: Partial<AgencyTemplateData>): Promise<AgencyTemplateData> {
    const existing = this.templates.get(templateId);
    if (!existing) {
      throw new Error(`Template '${templateId}' not found`);
    }

    const updated = { ...existing, ...updates, id: templateId };
    this.templates.set(templateId, updated);
    this.emit('template:updated', { templateId, updates });
    this.logger.log(`Updated template: ${templateId}`);
    
    return updated;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    const existed = this.templates.delete(templateId);
    if (existed) {
      this.emit('template:deleted', { templateId });
      this.logger.log(`Deleted template: ${templateId}`);
    }
    return existed;
  }

  /**
   * Validate template structure
   */
  async validateTemplate(template: AgencyTemplateData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!template.id) errors.push('Template ID is required');
    if (!template.name) errors.push('Template name is required');
    if (!template.description) errors.push('Template description is required');
    if (!template.category) errors.push('Template category is required');
    if (!template.version) errors.push('Template version is required');
    
    if (!Array.isArray(template.agents)) {
      errors.push('Template must include agents array');
    } else {
      template.agents.forEach((agent, index) => {
        if (!agent.name) errors.push(`Agent ${index}: name is required`);
        if (!agent.slug) errors.push(`Agent ${index}: slug is required`);
        if (!agent.roleDefinition) errors.push(`Agent ${index}: roleDefinition is required`);
        if (!Array.isArray(agent.groups)) errors.push(`Agent ${index}: groups must be an array`);
      });
    }

    if (!Array.isArray(template.features)) errors.push('Template features must be an array');
    if (!Array.isArray(template.integrations)) errors.push('Template integrations must be an array');
    
    if (!template.settings || typeof template.settings !== 'object') {
      errors.push('Template settings object is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get recommended template based on requirements
   */
  async getRecommendedTemplate(requirements: {
    teamSize?: number;
    industry?: string;
    features?: string[];
    budget?: 'low' | 'medium' | 'high';
  }): Promise<AgencyTemplateData | null> {
    const templates = Array.from(this.templates.values());
    
    // Simple scoring algorithm
    let bestTemplate: AgencyTemplateData | null = null;
    let bestScore = 0;

    for (const template of templates) {
      let score = 0;

      // Team size scoring
      if (requirements.teamSize) {
        const maxUsers = template.settings.maxUsers || 0;
        if (maxUsers === -1 || maxUsers >= requirements.teamSize) {
          score += 10;
        }
      }

      // Industry alignment
      if (requirements.industry) {
        if (template.category === requirements.industry) {
          score += 20;
        }
      }

      // Feature matching
      if (requirements.features) {
        const matchingFeatures = requirements.features.filter(feature =>
          template.features.includes(feature)
        );
        score += matchingFeatures.length * 5;
      }

      // Budget consideration
      if (requirements.budget) {
        const categoryScore = {
          'starter': requirements.budget === 'low' ? 15 : 5,
          'professional': requirements.budget === 'medium' ? 15 : 8,
          'specialized': requirements.budget === 'medium' ? 12 : 6,
          'enterprise': requirements.budget === 'high' ? 15 : 2
        };
        score += categoryScore[template.category] || 0;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }

    return bestTemplate;
  }

  /**
   * Clone template with modifications
   */
  async cloneTemplate(sourceId: string, newId: string, modifications?: Partial<AgencyTemplateData>): Promise<AgencyTemplateData> {
    const source = await this.getTemplate(sourceId);
    
    const cloned: AgencyTemplateData = {
      ...source,
      ...modifications,
      id: newId,
      name: modifications?.name || `${source.name} (Copy)`,
      version: '1.0.0' // Reset version for cloned template
    };

    await this.registerTemplate(cloned);
    return cloned;
  }

  /**
   * Export template to JSON
   */
  async exportTemplate(templateId: string): Promise<string> {
    const template = await this.getTemplate(templateId);
    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON
   */
  async importTemplate(templateJson: string, overwrite = false): Promise<AgencyTemplateData> {
    const template = JSON.parse(templateJson) as AgencyTemplateData;
    
    const validation = await this.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    if (this.templates.has(template.id) && !overwrite) {
      throw new Error(`Template '${template.id}' already exists. Use overwrite=true to replace.`);
    }

    await this.registerTemplate(template);
    return template;
  }
}