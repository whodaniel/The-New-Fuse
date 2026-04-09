/**
 * WorkflowCategorizer
 * Categorizes n8n workflows based on their content, nodes, and metadata
 */

import {
  N8nWorkflow,
  WorkflowCategory,
  CategoryConfig,
  WorkflowNode,
} from '../types/index.js';

export class WorkflowCategorizer {
  private categoryConfigs: CategoryConfig[] = [
    {
      name: 'ai-agents',
      displayName: 'AI & Agent Automation',
      description: 'Workflows involving AI models, LLMs, and agent automation',
      keywords: [
        'ai',
        'llm',
        'gpt',
        'openai',
        'claude',
        'anthropic',
        'agent',
        'chatbot',
        'assistant',
        'langchain',
        'embedding',
        'vector',
        'machine learning',
        'ml',
        'hugging face',
      ],
      nodeTypes: [
        'openai',
        'langchain',
        'pinecone',
        'weaviate',
        'chromadb',
        'ai',
        'chatgpt',
        'claude',
        'anthropic',
      ],
      priority: 10,
    },
    {
      name: 'api-integrations',
      displayName: 'API Integrations',
      description: 'Workflows that integrate with third-party APIs',
      keywords: [
        'api',
        'integration',
        'http',
        'rest',
        'graphql',
        'webhook',
        'gmail',
        'slack',
        'discord',
        'github',
        'gitlab',
      ],
      nodeTypes: [
        'httprequest',
        'webhook',
        'gmail',
        'slack',
        'discord',
        'github',
        'gitlab',
        'jira',
        'trello',
        'asana',
      ],
      priority: 9,
    },
    {
      name: 'automation',
      displayName: 'Automation Workflows',
      description: 'General automation and task workflows',
      keywords: [
        'automate',
        'automation',
        'scheduled',
        'cron',
        'trigger',
        'workflow',
        'process',
        'pipeline',
      ],
      nodeTypes: ['cron', 'schedule', 'trigger', 'switch', 'if', 'merge'],
      priority: 7,
    },
    {
      name: 'data-processing',
      displayName: 'Data Processing',
      description: 'Workflows for data transformation and processing',
      keywords: [
        'data',
        'transform',
        'process',
        'parse',
        'csv',
        'json',
        'xml',
        'etl',
        'extract',
        'load',
        'clean',
        'filter',
        'map',
        'reduce',
      ],
      nodeTypes: [
        'function',
        'code',
        'set',
        'spreadsheet',
        'csv',
        'json',
        'xml',
        'html',
        'markdown',
      ],
      priority: 8,
    },
    {
      name: 'database-operations',
      displayName: 'Database Operations',
      description: 'Workflows involving database queries and operations',
      keywords: [
        'database',
        'sql',
        'query',
        'mongodb',
        'postgres',
        'mysql',
        'redis',
        'dynamodb',
        'firestore',
        'supabase',
      ],
      nodeTypes: [
        'postgres',
        'mysql',
        'mongodb',
        'redis',
        'sqlite',
        'mssql',
        'oracle',
        'dynamodb',
        'firestore',
        'supabase',
      ],
      priority: 8,
    },
    {
      name: 'file-management',
      displayName: 'File Management',
      description: 'Workflows for file operations and management',
      keywords: [
        'file',
        'upload',
        'download',
        'storage',
        's3',
        'ftp',
        'drive',
        'dropbox',
        'onedrive',
        'document',
      ],
      nodeTypes: ['googledrive', 'dropbox', 'onedrive', 's3', 'ftp', 'sftp', 'box', 'file'],
      priority: 6,
    },
    {
      name: 'notifications',
      displayName: 'Notifications',
      description: 'Workflows for sending notifications and alerts',
      keywords: ['notification', 'alert', 'email', 'sms', 'push', 'notify', 'message', 'send'],
      nodeTypes: [
        'email',
        'gmail',
        'sendgrid',
        'mailgun',
        'twilio',
        'slack',
        'discord',
        'telegram',
        'pushbullet',
        'pushover',
      ],
      priority: 7,
    },
    {
      name: 'webhooks',
      displayName: 'Webhook Handlers',
      description: 'Workflows triggered by or handling webhooks',
      keywords: ['webhook', 'http', 'trigger', 'endpoint', 'api'],
      nodeTypes: ['webhook', 'responsetoarequest', 'httprequest'],
      priority: 6,
    },
    {
      name: 'crm',
      displayName: 'CRM & Sales',
      description: 'Workflows for CRM and sales automation',
      keywords: [
        'crm',
        'sales',
        'customer',
        'contact',
        'lead',
        'salesforce',
        'hubspot',
        'pipedrive',
      ],
      nodeTypes: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'freshsales', 'copper'],
      priority: 6,
    },
    {
      name: 'email',
      displayName: 'Email Automation',
      description: 'Workflows focused on email operations',
      keywords: ['email', 'mail', 'inbox', 'send', 'receive', 'imap', 'smtp'],
      nodeTypes: ['gmail', 'email', 'imap', 'smtp', 'sendgrid', 'mailgun'],
      priority: 7,
    },
    {
      name: 'social-media',
      displayName: 'Social Media',
      description: 'Workflows for social media automation',
      keywords: [
        'social',
        'twitter',
        'linkedin',
        'facebook',
        'instagram',
        'post',
        'tweet',
        'share',
      ],
      nodeTypes: ['twitter', 'linkedin', 'facebook', 'instagram', 'reddit', 'mastodon'],
      priority: 6,
    },
    {
      name: 'analytics',
      displayName: 'Analytics & Reporting',
      description: 'Workflows for analytics and reporting',
      keywords: [
        'analytics',
        'report',
        'dashboard',
        'metrics',
        'statistics',
        'google analytics',
        'mixpanel',
        'segment',
      ],
      nodeTypes: ['googleanalytics', 'mixpanel', 'segment', 'amplitude', 'matomo', 'plausible'],
      priority: 6,
    },
    {
      name: 'DevOps',
      displayName: 'DevOps & CI/CD',
      description: 'Workflows for DevOps and continuous integration',
      keywords: [
        'devops',
        'ci/cd',
        'deploy',
        'docker',
        'kubernetes',
        'jenkins',
        'gitlab ci',
        'github actions',
      ],
      nodeTypes: ['github', 'gitlab', 'jenkins', 'docker', 'kubernetes', 'terraform', 'ansible'],
      priority: 6,
    },
    {
      name: 'security',
      displayName: 'Security & Monitoring',
      description: 'Workflows for security and monitoring',
      keywords: ['security', 'monitor', 'alert', 'scan', 'vulnerability', 'audit', 'compliance'],
      nodeTypes: ['snyk', 'sonarqube', 'vault', 'auth0', 'okta'],
      priority: 6,
    },
  ];

  /**
   * Categorize a workflow
   */
  public categorize(workflow: N8nWorkflow): WorkflowCategory {
    const scores = new Map<WorkflowCategory, number>();

    // Initialize scores
    this.categoryConfigs.forEach((config) => {
      scores.set(config.name, 0);
    });

    // Score based on keywords in name and description
    const text =
      `${workflow.name} ${workflow.description} ${workflow.tags.join(' ')}`.toLowerCase();

    this.categoryConfigs.forEach((config) => {
      config.keywords.forEach((keyword) => {
        if (text.includes(keyword.toLowerCase())) {
          scores.set(config.name, (scores.get(config.name) || 0) + config.priority);
        }
      });
    });

    // Score based on node types
    workflow.nodes.forEach((node) => {
      const nodeType = node.type.toLowerCase();

      this.categoryConfigs.forEach((config) => {
        config.nodeTypes.forEach((type) => {
          if (nodeType.includes(type.toLowerCase())) {
            scores.set(config.name, (scores.get(config.name) || 0) + config.priority * 2);
          }
        });
      });
    });

    // Score based on use cases
    if (workflow.metadata.useCases) {
      workflow.metadata.useCases.forEach((useCase) => {
        const useCaseLower = useCase.toLowerCase();

        this.categoryConfigs.forEach((config) => {
          if (config.keywords.some((keyword) => useCaseLower.includes(keyword))) {
            scores.set(config.name, (scores.get(config.name) || 0) + config.priority);
          }
        });
      });
    }

    // Find highest scoring category
    let bestCategory: WorkflowCategory = 'other';
    let bestScore = 0;

    scores.forEach((score, category) => {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });

    return bestScore > 0 ? bestCategory : 'other';
  }

  /**
   * Categorize multiple workflows
   */
  public categorizeWorkflows(workflows: N8nWorkflow[]): N8nWorkflow[] {
    return workflows.map((workflow) => ({
      ...workflow,
      category: this.categorize(workflow),
      metadata: {
        ...workflow.metadata,
        category: this.categorize(workflow),
      },
    }));
  }

  /**
   * Get category statistics
   */
  public getCategoryStats(workflows: N8nWorkflow[]): { [key in WorkflowCategory]?: number } {
    const stats: { [key in WorkflowCategory]?: number } = {};

    workflows.forEach((workflow) => {
      const category = workflow.category;
      stats[category] = (stats[category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get all category configs
   */
  public getCategoryConfigs(): CategoryConfig[] {
    return this.categoryConfigs;
  }

  /**
   * Get category config by name
   */
  public getCategoryConfig(category: WorkflowCategory): CategoryConfig | undefined {
    return this.categoryConfigs.find((config) => config.name === category);
  }

  /**
   * Suggest categories for a workflow
   */
  public suggestCategories(
    workflow: N8nWorkflow,
    topN: number = 3
  ): Array<{ category: WorkflowCategory; score: number; confidence: number }> {
    const scores = new Map<WorkflowCategory, number>();

    // Calculate scores (same as categorize method)
    const text =
      `${workflow.name} ${workflow.description} ${workflow.tags.join(' ')}`.toLowerCase();

    this.categoryConfigs.forEach((config) => {
      let score = 0;

      // Keyword matching
      config.keywords.forEach((keyword) => {
        if (text.includes(keyword.toLowerCase())) {
          score += config.priority;
        }
      });

      // Node type matching
      workflow.nodes.forEach((node) => {
        const nodeType = node.type.toLowerCase();
        config.nodeTypes.forEach((type) => {
          if (nodeType.includes(type.toLowerCase())) {
            score += config.priority * 2;
          }
        });
      });

      if (score > 0) {
        scores.set(config.name, score);
      }
    });

    // Convert to array and sort
    const suggestions = Array.from(scores.entries())
      .map(([category, score]) => ({
        category,
        score,
        confidence: this.calculateConfidence(score, Array.from(scores.values())),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    return suggestions;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(score: number, allScores: number[]): number {
    const maxScore = Math.max(...allScores);
    const totalScore = allScores.reduce((sum, s) => sum + s, 0);

    if (totalScore === 0) return 0;

    // Normalize between 0 and 1
    const normalizedScore = score / maxScore;
    const distribution = score / totalScore;

    // Weighted average
    return (normalizedScore * 0.7 + distribution * 0.3) * 100;
  }
}
