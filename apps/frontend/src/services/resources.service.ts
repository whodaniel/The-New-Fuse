import axios from 'axios';
import {
  Resource,
  ClaudeSkill,
  N8NWorkflow,
  AgentTemplate,
  ResourceFilter,
  ResourceStats,
  FavoriteResource,
  ResourceShare,
} from '../types/resources';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Mock data for development
const mockSkills: ClaudeSkill[] = [
  {
    id: 'skill-1',
    name: 'Web Search Pro',
    description: 'Advanced web search capabilities with real-time data fetching and content extraction',
    type: 'skill',
    skillType: 'mcp-tool',
    category: 'ai',
    tags: ['search', 'web', 'data', 'real-time'],
    author: 'Claude Team',
    version: '2.1.0',
    downloads: 15420,
    rating: 4.8,
    reviews: 234,
    featured: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-11-18T00:00:00Z',
    capabilities: ['Web search', 'Content extraction', 'Link following', 'Screenshot capture'],
    modelCompatibility: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3.5 Sonnet'],
    examples: [
      {
        title: 'Search for recent news',
        description: 'Search for the latest news about AI developments',
        input: 'What are the latest developments in AI from the past week?',
        output: 'Based on web search results from the past week, here are the key AI developments...',
      },
    ],
    documentation: 'https://docs.anthropic.com/skills/web-search',
    installCommand: 'npm install @anthropic/skill-web-search',
  },
  {
    id: 'skill-2',
    name: 'Code Analyzer',
    description: 'Analyze code quality, security vulnerabilities, and suggest improvements',
    type: 'skill',
    skillType: 'mcp-tool',
    category: 'development',
    tags: ['code', 'analysis', 'security', 'quality'],
    author: 'DevTools Inc',
    version: '1.5.2',
    downloads: 8930,
    rating: 4.6,
    reviews: 156,
    featured: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-11-10T00:00:00Z',
    capabilities: ['Static analysis', 'Security scanning', 'Code metrics', 'Best practices'],
    modelCompatibility: ['Claude 3 Opus', 'Claude 3 Sonnet'],
    examples: [
      {
        title: 'Analyze Python code',
        description: 'Review a Python function for potential issues',
        input: 'def calculate(x, y): return x / y',
        output: 'Potential division by zero error when y is 0. Recommendation: Add validation...',
      },
    ],
    documentation: 'https://github.com/devtools/code-analyzer',
  },
  {
    id: 'skill-3',
    name: 'Data Visualization',
    description: 'Create beautiful charts and graphs from data using various visualization libraries',
    type: 'skill',
    skillType: 'workflow',
    category: 'data',
    tags: ['visualization', 'charts', 'graphs', 'data'],
    author: 'DataViz Team',
    version: '3.0.1',
    downloads: 12340,
    rating: 4.9,
    reviews: 289,
    featured: true,
    createdAt: '2023-11-20T00:00:00Z',
    updatedAt: '2024-11-05T00:00:00Z',
    capabilities: ['Bar charts', 'Line graphs', 'Pie charts', 'Scatter plots', 'Heatmaps'],
    modelCompatibility: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
    examples: [],
    documentation: 'https://dataviz.io/docs',
  },
  {
    id: 'skill-4',
    name: 'Email Assistant',
    description: 'Automate email tasks including drafting, sending, and organizing',
    type: 'skill',
    skillType: 'integration',
    category: 'communication',
    tags: ['email', 'automation', 'communication'],
    author: 'Productivity Hub',
    version: '2.3.0',
    downloads: 6720,
    rating: 4.5,
    reviews: 98,
    featured: false,
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-10-28T00:00:00Z',
    capabilities: ['Draft emails', 'Send emails', 'Email classification', 'Smart replies'],
    modelCompatibility: ['Claude 3 Sonnet', 'Claude 3.5 Sonnet'],
    examples: [],
    documentation: 'https://productivity-hub.com/email-assistant',
  },
];

const mockWorkflows: N8NWorkflow[] = [
  {
    id: 'workflow-1',
    name: 'Slack to Notion Integration',
    description: 'Automatically save important Slack messages to Notion database',
    type: 'workflow',
    category: 'productivity',
    tags: ['slack', 'notion', 'automation', 'integration'],
    author: 'Workflow Masters',
    version: '1.2.0',
    downloads: 9870,
    rating: 4.7,
    reviews: 187,
    featured: true,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-11-12T00:00:00Z',
    nodes: 8,
    triggers: ['Slack: New Message'],
    actions: ['Notion: Create Page', 'Filter', 'Transform Data'],
    integrations: ['Slack', 'Notion'],
    complexity: 'simple',
    importUrl: 'https://n8n.io/workflows/slack-notion',
  },
  {
    id: 'workflow-2',
    name: 'AI Content Pipeline',
    description: 'Generate, review, and publish content using AI and multiple platforms',
    type: 'workflow',
    category: 'ai',
    tags: ['ai', 'content', 'automation', 'publishing'],
    author: 'Content Automation',
    version: '2.0.1',
    downloads: 5430,
    rating: 4.8,
    reviews: 92,
    featured: true,
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2024-11-08T00:00:00Z',
    nodes: 15,
    triggers: ['Webhook', 'Schedule'],
    actions: ['Claude AI', 'Review', 'WordPress Publish', 'Social Media Post'],
    integrations: ['Claude', 'WordPress', 'Twitter', 'LinkedIn'],
    complexity: 'complex',
    importUrl: 'https://n8n.io/workflows/ai-content-pipeline',
  },
  {
    id: 'workflow-3',
    name: 'Database Sync & Backup',
    description: 'Sync data between multiple databases and create automatic backups',
    type: 'workflow',
    category: 'data',
    tags: ['database', 'sync', 'backup', 'automation'],
    author: 'DataOps Pro',
    version: '1.8.0',
    downloads: 7230,
    rating: 4.6,
    reviews: 134,
    featured: false,
    createdAt: '2023-12-15T00:00:00Z',
    updatedAt: '2024-11-01T00:00:00Z',
    nodes: 12,
    triggers: ['Schedule: Daily'],
    actions: ['PostgreSQL Query', 'MySQL Insert', 'S3 Upload', 'Notification'],
    integrations: ['PostgreSQL', 'MySQL', 'AWS S3', 'Email'],
    complexity: 'medium',
    importUrl: 'https://n8n.io/workflows/database-sync',
  },
];

const mockTemplates: AgentTemplate[] = [
  {
    id: 'template-1',
    name: 'Customer Support Agent',
    description: 'Professional customer support agent with empathy and problem-solving skills',
    type: 'template',
    templateType: 'chat',
    category: 'communication',
    tags: ['customer-support', 'chat', 'help-desk'],
    author: 'Support Solutions',
    version: '1.0.0',
    downloads: 4560,
    rating: 4.7,
    reviews: 78,
    featured: true,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-11-15T00:00:00Z',
    model: 'Claude 3.5 Sonnet',
    systemPrompt: 'You are a professional customer support agent...',
    capabilities: ['Empathetic responses', 'Problem resolution', 'Ticket creation', 'Escalation'],
    configuration: {
      temperature: 0.7,
      maxTokens: 2000,
      tone: 'professional-friendly',
    },
    requiredSkills: [],
    optionalSkills: ['ticket-system-integration', 'knowledge-base-search'],
  },
  {
    id: 'template-2',
    name: 'Code Review Assistant',
    description: 'Technical agent specialized in code review and suggestions',
    type: 'template',
    templateType: 'task',
    category: 'development',
    tags: ['code-review', 'development', 'programming'],
    author: 'DevAI Team',
    version: '2.1.0',
    downloads: 6780,
    rating: 4.9,
    reviews: 145,
    featured: true,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-11-10T00:00:00Z',
    model: 'Claude 3 Opus',
    systemPrompt: 'You are an expert code reviewer...',
    capabilities: ['Code analysis', 'Security review', 'Best practices', 'Performance optimization'],
    configuration: {
      temperature: 0.3,
      maxTokens: 4000,
      tone: 'technical-detailed',
    },
    requiredSkills: ['code-analyzer'],
    optionalSkills: ['security-scanner', 'performance-profiler'],
  },
  {
    id: 'template-3',
    name: 'Data Analysis Expert',
    description: 'Analytical agent for data processing, visualization, and insights',
    type: 'template',
    templateType: 'analysis',
    category: 'data',
    tags: ['data-analysis', 'analytics', 'insights'],
    author: 'Analytics Pro',
    version: '1.5.0',
    downloads: 3240,
    rating: 4.8,
    reviews: 67,
    featured: false,
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-10-30T00:00:00Z',
    model: 'Claude 3 Sonnet',
    systemPrompt: 'You are a data analysis expert...',
    capabilities: ['Statistical analysis', 'Data visualization', 'Trend detection', 'Reporting'],
    configuration: {
      temperature: 0.5,
      maxTokens: 3000,
      tone: 'analytical-clear',
    },
    requiredSkills: ['data-visualization'],
    optionalSkills: ['statistical-tools', 'ml-integration'],
  },
];

class ResourcesService {
  // Fetch all resources
  async getAllResources(): Promise<Resource[]> {
    try {
      const response = await axios.get(`${API_BASE}/resources`);
      return response.data;
    } catch (error) {
      console.log('Using mock data for resources');
      return [...mockSkills, ...mockWorkflows, ...mockTemplates];
    }
  }

  // Fetch skills
  async getSkills(): Promise<ClaudeSkill[]> {
    try {
      const response = await axios.get(`${API_BASE}/resources/skills`);
      return response.data;
    } catch (error) {
      console.log('Using mock data for skills');
      return mockSkills;
    }
  }

  // Fetch workflows
  async getWorkflows(): Promise<N8NWorkflow[]> {
    try {
      const response = await axios.get(`${API_BASE}/resources/workflows`);
      return response.data;
    } catch (error) {
      console.log('Using mock data for workflows');
      return mockWorkflows;
    }
  }

  // Fetch templates
  async getTemplates(): Promise<AgentTemplate[]> {
    try {
      const response = await axios.get(`${API_BASE}/resources/templates`);
      return response.data;
    } catch (error) {
      console.log('Using mock data for templates');
      return mockTemplates;
    }
  }

  // Search resources
  async searchResources(filter: Partial<ResourceFilter>): Promise<Resource[]> {
    try {
      const response = await axios.post(`${API_BASE}/resources/search`, filter);
      return response.data;
    } catch (error) {
      console.log('Using mock data for search');
      const allResources = [...mockSkills, ...mockWorkflows, ...mockTemplates];

      return allResources.filter(resource => {
        if (filter.search && !resource.name.toLowerCase().includes(filter.search.toLowerCase()) &&
            !resource.description.toLowerCase().includes(filter.search.toLowerCase())) {
          return false;
        }
        if (filter.type && filter.type !== 'all' && resource.type !== filter.type) {
          return false;
        }
        if (filter.category && filter.category !== 'all' && resource.category !== filter.category) {
          return false;
        }
        if (filter.featured && !resource.featured) {
          return false;
        }
        return true;
      });
    }
  }

  // Get resource stats
  async getStats(): Promise<ResourceStats> {
    try {
      const response = await axios.get(`${API_BASE}/resources/stats`);
      return response.data;
    } catch (error) {
      console.log('Using mock data for stats');
      return {
        totalResources: mockSkills.length + mockWorkflows.length + mockTemplates.length,
        totalSkills: mockSkills.length,
        totalWorkflows: mockWorkflows.length,
        totalTemplates: mockTemplates.length,
        totalDownloads: [...mockSkills, ...mockWorkflows, ...mockTemplates].reduce((sum, r) => sum + r.downloads, 0),
        averageRating: [...mockSkills, ...mockWorkflows, ...mockTemplates].reduce((sum, r) => sum + r.rating, 0) /
          (mockSkills.length + mockWorkflows.length + mockTemplates.length),
      };
    }
  }

  // Toggle favorite
  async toggleFavorite(resourceId: string, userId: string): Promise<void> {
    try {
      await axios.post(`${API_BASE}/resources/${resourceId}/favorite`, { userId });
    } catch (error) {
      console.log('Favorite toggled (mock)');
    }
  }

  // Share resource with agent
  async shareResource(share: Omit<ResourceShare, 'sharedAt'>): Promise<void> {
    try {
      await axios.post(`${API_BASE}/resources/share`, share);
    } catch (error) {
      console.log('Resource shared (mock)');
    }
  }

  // Execute/Install skill
  async executeSkill(skillId: string): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE}/skills/${skillId}/execute`);
      return response.data;
    } catch (error) {
      console.log('Skill executed (mock)');
      return { success: true, message: 'Skill installed successfully' };
    }
  }

  // Import workflow
  async importWorkflow(workflowId: string): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE}/workflows/${workflowId}/import`);
      return response.data;
    } catch (error) {
      console.log('Workflow imported (mock)');
      return { success: true, message: 'Workflow imported to n8n successfully' };
    }
  }

  // Create agent from template
  async createAgentFromTemplate(templateId: string, customConfig?: any): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE}/templates/${templateId}/create-agent`, customConfig);
      return response.data;
    } catch (error) {
      console.log('Agent created from template (mock)');
      return { success: true, agentId: 'agent-' + Date.now(), message: 'Agent created successfully' };
    }
  }
}

export const resourcesService = new ResourcesService();
export default resourcesService;
