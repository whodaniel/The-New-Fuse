import { ClaudeDevConfiguration, ClaudeDevPermissions } from './ClaudeDevAutomationService';

export interface ClaudeDevTemplate {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'analysis' | 'operations' | 'security' | 'ui_ux';
  version: string;
  author: string;
  tags: string[];
  defaultConfiguration: ClaudeDevConfiguration;
  defaultPermissions: ClaudeDevPermissions;
  prompts: {
    systemPrompt: string;
    taskPrompts: Record<string, string>;
    contextPrompts: Record<string, string>;
  };
  workflows: ClaudeDevWorkflow[];
  capabilities: string[];
  integrations: string[];
  examples: ClaudeDevTemplateExample[];
}

export interface ClaudeDevWorkflow {
  id: string;
  name: string;
  description: string;
  steps: ClaudeDevWorkflowStep[];
  triggers: string[];
  outputs: string[];
}

export interface ClaudeDevWorkflowStep {
  id: string;
  name: string;
  type: 'analysis' | 'action' | 'review' | 'approval' | 'notification';
  description: string;
  prompt: string;
  parameters: Record<string, any>;
  conditions: string[];
  timeout: number;
}

export interface ClaudeDevTemplateExample {
  name: string;
  description: string;
  input: Record<string, any>;
  expectedOutput: Record<string, any>;
  workflow: string;
}

// Template Registry
export class ClaudeDevTemplateRegistry {
  private static templates: Map<string, ClaudeDevTemplate> = new Map();

  static registerTemplate(template: ClaudeDevTemplate): void {
    this.templates.set(template.id, template);
  }

  static getTemplate(id: string): ClaudeDevTemplate | undefined {
    return this.templates.get(id);
  }

  static getAllTemplates(): ClaudeDevTemplate[] {
    return Array.from(this.templates.values());
  }

  static getTemplatesByCategory(category: string): ClaudeDevTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  static getTemplatesByTag(tag: string): ClaudeDevTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.tags.includes(tag));
  }
}

// 1. Senior Code Reviewer Template
const SENIOR_CODE_REVIEWER_TEMPLATE: ClaudeDevTemplate = {
  id: 'senior-code-reviewer',
  name: 'Senior Code Reviewer',
  description: 'Comprehensive code review with security analysis, performance optimization, and architectural insights',
  category: 'development',
  version: '1.0.0',
  author: 'The New Fuse Platform',
  tags: ['code-review', 'quality', 'security', 'performance', 'architecture'],
  defaultConfiguration: {
    autoApprove: false,
    maxFileOperations: 200,
    allowedDirectories: ['src/', 'lib/', 'components/', 'pages/', 'utils/', 'tests/'],
    taskTimeout: 600000, // 10 minutes
    concurrentTasks: 2,
    integrations: {
      workspace: true,
      terminal: false,
      browser: false,
      vscode: true,
    },
    capabilities: {
      fileOperations: true,
      codeAnalysis: true,
      terminalAccess: false,
      webBrowsing: false,
      imageProcessing: false,
    },
    automationLevel: 'semi-auto',
    notifications: {
      onTaskStart: true,
      onTaskComplete: true,
      onError: true,
      onApprovalRequired: true,
    },
  },
  defaultPermissions: {
    canCreateFiles: false,
    canDeleteFiles: false,
    canModifyFiles: false,
    canExecuteTerminal: false,
    canBrowseWeb: false,
    canAccessWorkspace: true,
    allowedFileTypes: ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.cs'],
    restrictedPaths: ['node_modules/', '.git/', 'dist/', 'build/'],
    maxFileSize: 5242880, // 5MB
  },
  prompts: {
    systemPrompt: `You are a Senior Code Reviewer with 15+ years of experience in software development. Your expertise spans multiple programming languages, architectural patterns, security best practices, and performance optimization. 

Your role is to provide comprehensive, actionable code reviews that help developers improve their skills while maintaining high code quality standards.

Review Focus Areas:
1. Code Quality & Best Practices
2. Security Vulnerabilities & Compliance
3. Performance Optimization Opportunities
4. Architectural Patterns & Design
5. Testing Coverage & Strategy
6. Documentation Quality
7. Maintainability & Readability

Always provide specific, actionable feedback with examples and explanations.`,
    taskPrompts: {
      full_review: `Perform a comprehensive code review of the provided files. Analyze:
1. Code structure and organization
2. Security vulnerabilities (OWASP Top 10, common attack vectors)
3. Performance bottlenecks and optimization opportunities
4. Design patterns and architectural decisions
5. Error handling and edge cases
6. Testing coverage and quality
7. Documentation completeness
8. Code style and consistency

Provide detailed feedback with severity levels (Critical, High, Medium, Low) and specific recommendations for improvement.`,
      security_focus: `Conduct a security-focused code review. Look for:
- Input validation vulnerabilities
- Authentication/authorization issues
- Data exposure risks
- Injection vulnerabilities (SQL, XSS, etc.)
- Insecure dependencies
- Sensitive data handling
- API security issues
- Configuration security

Rate each finding by severity and provide remediation steps.`,
      performance_focus: `Analyze code for performance optimization opportunities:
- Algorithm efficiency and Big O complexity
- Database query optimization
- Memory usage patterns
- Caching strategies
- Async/await usage
- Bundle size and loading performance
- Resource utilization
- Scalability considerations

Provide specific optimization recommendations with expected impact.`,
    },
    contextPrompts: {
      project_context: `Consider the project context: {{projectType}} using {{techStack}}. 
Target environment: {{environment}}
Performance requirements: {{performanceRequirements}}
Security requirements: {{securityRequirements}}
Team experience level: {{teamLevel}}`,
      legacy_modernization: `This is a legacy modernization project. Focus on:
- Migration path recommendations
- Backward compatibility considerations
- Risk assessment for proposed changes
- Incremental improvement strategies`,
    },
  },
  workflows: [
    {
      id: 'comprehensive-review',
      name: 'Comprehensive Code Review',
      description: 'Full code review covering all aspects of code quality',
      steps: [
        {
          id: 'initial-scan',
          name: 'Initial Code Scan',
          type: 'analysis',
          description: 'Quick scan for obvious issues and overall structure',
          prompt: 'Perform initial code scan for structure and obvious issues',
          parameters: { scope: 'overview' },
          conditions: [],
          timeout: 60000,
        },
        {
          id: 'security-analysis',
          name: 'Security Analysis',
          type: 'analysis',
          description: 'Deep security vulnerability assessment',
          prompt: 'security_focus',
          parameters: { depth: 'comprehensive' },
          conditions: ['initial-scan.completed'],
          timeout: 180000,
        },
        {
          id: 'performance-review',
          name: 'Performance Review',
          type: 'analysis',
          description: 'Performance optimization analysis',
          prompt: 'performance_focus',
          parameters: { metrics: true },
          conditions: ['initial-scan.completed'],
          timeout: 120000,
        },
        {
          id: 'final-assessment',
          name: 'Final Assessment',
          type: 'review',
          description: 'Comprehensive final review and recommendations',
          prompt: 'full_review',
          parameters: { include_examples: true },
          conditions: ['security-analysis.completed', 'performance-review.completed'],
          timeout: 240000,
        },
      ],
      triggers: ['code_review_requested', 'pull_request_created'],
      outputs: ['review_report', 'security_findings', 'performance_recommendations'],
    },
  ],
  capabilities: [
    'static_code_analysis',
    'security_vulnerability_detection',
    'performance_profiling',
    'architectural_review',
    'dependency_analysis',
    'code_complexity_analysis',
  ],
  integrations: ['vscode', 'git', 'sonarqube', 'eslint', 'prettier'],
  examples: [
    {
      name: 'React Component Review',
      description: 'Review a React component for best practices',
      input: {
        files: ['components/UserProfile.tsx'],
        context: { projectType: 'react-app', focus: 'performance' },
      },
      expectedOutput: {
        findings: 'array of findings with severity levels',
        recommendations: 'specific improvement suggestions',
        score: 'overall code quality score',
      },
      workflow: 'comprehensive-review',
    },
  ],
};

// 2. Full-Stack Project Setup Template
const FULLSTACK_PROJECT_SETUP_TEMPLATE: ClaudeDevTemplate = {
  id: 'fullstack-project-setup',
  name: 'Full-Stack Project Setup',
  description: 'Modern project scaffolding with best practices, tooling, and configuration',
  category: 'development',
  version: '1.0.0',
  author: 'The New Fuse Platform',
  tags: ['project-setup', 'scaffolding', 'configuration', 'tooling', 'best-practices'],
  defaultConfiguration: {
    autoApprove: false,
    maxFileOperations: 500,
    allowedDirectories: ['./', 'src/', 'config/', 'scripts/', 'docs/'],
    taskTimeout: 900000, // 15 minutes
    concurrentTasks: 3,
    integrations: {
      workspace: true,
      terminal: true,
      browser: false,
      vscode: true,
    },
    capabilities: {
      fileOperations: true,
      codeAnalysis: true,
      terminalAccess: true,
      webBrowsing: false,
      imageProcessing: false,
    },
    automationLevel: 'semi-auto',
    notifications: {
      onTaskStart: true,
      onTaskComplete: true,
      onError: true,
      onApprovalRequired: true,
    },
  },
  defaultPermissions: {
    canCreateFiles: true,
    canDeleteFiles: false,
    canModifyFiles: true,
    canExecuteTerminal: true,
    canBrowseWeb: false,
    canAccessWorkspace: true,
    allowedFileTypes: ['.ts', '.js', '.json', '.md', '.yml', '.yaml', '.env', '.gitignore'],
    restrictedPaths: [],
    maxFileSize: 1048576, // 1MB
  },
  prompts: {
    systemPrompt: `You are a Full-Stack Project Setup Specialist with expertise in modern development tooling and best practices. You help teams quickly bootstrap new projects with proper architecture, tooling, and configuration.

Your expertise includes:
- Modern JavaScript/TypeScript ecosystems
- Frontend frameworks (React, Vue, Angular, etc.)
- Backend frameworks (Node.js, Python, Go, etc.)
- Database design and configuration
- DevOps and CI/CD setup
- Security best practices
- Performance optimization
- Testing strategies
- Documentation standards

Always create production-ready, scalable project structures.`,
    taskPrompts: {
      new_project: `Create a new {{projectType}} project with the following requirements:
- Tech stack: {{techStack}}
- Features: {{features}}
- Target environment: {{environment}}
- Team size: {{teamSize}}

Include:
1. Proper project structure
2. Configuration files (tsconfig, package.json, etc.)
3. Development tooling (linting, formatting, testing)
4. CI/CD pipeline setup
5. Documentation structure
6. Environment configuration
7. Security setup
8. Performance monitoring

Provide detailed setup instructions and next steps.`,
      add_feature: `Add {{featureName}} feature to existing project:
- Integration requirements: {{integrationRequirements}}
- Dependencies needed: {{dependencies}}
- Configuration changes: {{configChanges}}

Ensure proper integration with existing architecture.`,
      migration_setup: `Set up migration from {{oldTech}} to {{newTech}}:
- Migration strategy: {{strategy}}
- Compatibility requirements: {{compatibility}}
- Risk mitigation: {{risks}}

Create migration plan and setup tools.`,
    },
    contextPrompts: {
      team_context: `Team context:
- Experience level: {{teamLevel}}
- Preferred tools: {{preferredTools}}
- Deployment target: {{deploymentTarget}}
- Budget constraints: {{budget}}`,
      enterprise_context: `Enterprise requirements:
- Security compliance: {{compliance}}
- Scalability requirements: {{scalability}}
- Integration needs: {{integrations}}
- Monitoring requirements: {{monitoring}}`,
    },
  },
  workflows: [
    {
      id: 'new-project-setup',
      name: 'New Project Setup',
      description: 'Complete setup for a new project from scratch',
      steps: [
        {
          id: 'project-structure',
          name: 'Create Project Structure',
          type: 'action',
          description: 'Set up directory structure and basic files',
          prompt: 'Create the basic project structure',
          parameters: { includeExamples: true },
          conditions: [],
          timeout: 120000,
        },
        {
          id: 'package-config',
          name: 'Package Configuration',
          type: 'action',
          description: 'Set up package.json and dependency management',
          prompt: 'Configure package.json and dependencies',
          parameters: { includeDev: true },
          conditions: ['project-structure.completed'],
          timeout: 180000,
        },
        {
          id: 'tooling-setup',
          name: 'Development Tooling',
          type: 'action',
          description: 'Configure linting, formatting, and testing',
          prompt: 'Set up development tools and configuration',
          parameters: { strict: true },
          conditions: ['package-config.completed'],
          timeout: 240000,
        },
        {
          id: 'documentation',
          name: 'Documentation Setup',
          type: 'action',
          description: 'Create documentation structure and README',
          prompt: 'Create project documentation',
          parameters: { comprehensive: true },
          conditions: ['tooling-setup.completed'],
          timeout: 120000,
        },
      ],
      triggers: ['new_project_requested'],
      outputs: ['project_structure', 'configuration_files', 'documentation', 'setup_guide'],
    },
  ],
  capabilities: [
    'project_scaffolding',
    'dependency_management',
    'configuration_setup',
    'tooling_integration',
    'documentation_generation',
    'ci_cd_setup',
  ],
  integrations: ['npm', 'yarn', 'git', 'docker', 'github_actions', 'vscode'],
  examples: [
    {
      name: 'React TypeScript Project',
      description: 'Set up a new React project with TypeScript',
      input: {
        projectType: 'react-app',
        techStack: ['react', 'typescript', 'vite'],
        features: ['routing', 'state-management', 'testing'],
      },
      expectedOutput: {
        structure: 'complete project structure',
        config: 'all configuration files',
        documentation: 'setup and usage docs',
      },
      workflow: 'new-project-setup',
    },
  ],
};

// Export templates registry and utility functions
export class ClaudeDevTemplateUtils {
  static createAgentFromTemplate(templateId: string, customizations?: {
    configuration?: Partial<ClaudeDevConfiguration>;
    permissions?: Partial<ClaudeDevPermissions>;
    metadata?: Record<string, any>;
  }) {
    const template = ClaudeDevTemplateRegistry.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      template: templateId,
      configuration: {
        ...template.defaultConfiguration,
        ...customizations?.configuration,
      },
      permissions: {
        ...template.defaultPermissions,
        ...customizations?.permissions,
      },
      metadata: {
        templateVersion: template.version,
        templateAuthor: template.author,
        capabilities: template.capabilities,
        ...customizations?.metadata,
      },
    };
  }

  static getTemplatesByCapability(capability: string): ClaudeDevTemplate[] {
    return ClaudeDevTemplateRegistry.getAllTemplates()
      .filter(template => template.capabilities.includes(capability));
  }

  static getRecommendedTemplate(taskType: string, requirements: string[]): ClaudeDevTemplate | null {
    const templates = ClaudeDevTemplateRegistry.getAllTemplates();
    
    // Simple recommendation algorithm based on task type and requirements
    const scoreMap = new Map<string, number>();
    
    templates.forEach(template => {
      let score = 0;
      
      // Score based on task type alignment
      if (template.tags.includes(taskType)) {
        score += 10;
      }
      
      // Score based on capability matching
      requirements.forEach(req => {
        if (template.capabilities.includes(req)) {
          score += 5;
        }
        if (template.tags.includes(req)) {
          score += 3;
        }
      });
      
      scoreMap.set(template.id, score);
    });
    
    // Return template with highest score
    let bestTemplate: ClaudeDevTemplate | null = null;
    let highestScore = 0;
    
    scoreMap.forEach((score, templateId) => {
      if (score > highestScore) {
        highestScore = score;
        bestTemplate = ClaudeDevTemplateRegistry.getTemplate(templateId) || null;
      }
    });
    
    return bestTemplate;
  }

  static getTemplateDocumentation(templateId: string): string {
    const template = ClaudeDevTemplateRegistry.getTemplate(templateId);
    if (!template) {
      return `Template ${templateId} not found`;
    }

    return `
# ${template.name}

**Version:** ${template.version}  
**Author:** ${template.author}  
**Category:** ${template.category}

## Description
${template.description}

## Capabilities
${template.capabilities.map(cap => `- ${cap}`).join('\n')}

## Tags
${template.tags.map(tag => `\`${tag}\``).join(', ')}

## Workflows
${template.workflows.map(workflow => `
### ${workflow.name}
${workflow.description}

**Steps:**
${workflow.steps.map(step => `1. **${step.name}** (${step.type}): ${step.description}`).join('\n')}
`).join('\n')}
    `.trim();
  }
}

// Initialize templates on module load
ClaudeDevTemplateRegistry.registerTemplate(SENIOR_CODE_REVIEWER_TEMPLATE);
ClaudeDevTemplateRegistry.registerTemplate(FULLSTACK_PROJECT_SETUP_TEMPLATE);

// Export all templates and utilities
export {
  ClaudeDevTemplateRegistry,
  ClaudeDevTemplateUtils,
  SENIOR_CODE_REVIEWER_TEMPLATE,
  FULLSTACK_PROJECT_SETUP_TEMPLATE,
};
