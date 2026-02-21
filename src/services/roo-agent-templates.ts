/**
 * Roo Agent Templates and Configurations
 * 
 * This file contains all the pre-defined agent templates, API profiles,
 * MCP server configurations, and team setups for The New Fuse platform.
 */

import { AgentTemplate, FileRestriction } from './RooAgentAutomationService';

/**
 * Comprehensive Agent Templates Library
 */
export const AGENT_TEMPLATES: Record<string, AgentTemplate> = {
  // Core Development Agents
  'senior-developer': {
    name: '👨‍💻 Senior Developer',
    slug: 'senior-dev',
    roleDefinition: `You are a senior software engineer with 10+ years of experience across multiple programming languages and frameworks. You excel at:
- Writing clean, maintainable, and well-documented code
- Following best practices and design patterns
- Performing thorough code reviews
- Optimizing performance and scalability
- Mentoring junior developers
- System architecture and technical leadership`,
    whenToUse: 'Use for complex coding tasks, architecture decisions, code reviews, and technical leadership',
    customInstructions: `Always prioritize code quality, maintainability, and best practices. Provide detailed explanations for technical decisions. Consider performance implications and suggest optimizations when appropriate. Focus on clean architecture and SOLID principles.`,
    groups: ['read', 'edit', 'browser', 'command', 'mcp'],
    preferredModel: 'claude-3-sonnet',
    temperature: 0.3,
    maxTokens: 4096,
    mcpServers: ['context7', 'git'],
    autoApprove: ['read_file', 'edit_file', 'create_file'],
    categories: ['development', 'senior'],
    tags: ['code-review', 'architecture', 'best-practices']
  },

  'qa-engineer': {
    name: '🧪 QA Engineer',
    slug: 'qa-engineer',
    roleDefinition: `You are a quality assurance engineer specialized in:
- Writing comprehensive test suites (unit, integration, e2e)
- Test-driven development (TDD) practices
- Bug detection and edge case identification
- Test automation and CI/CD integration
- Performance testing and load testing
- Quality metrics and reporting`,
    whenToUse: 'Use for writing tests, identifying bugs, test automation, and quality assurance tasks',
    customInstructions: `Focus on thorough testing coverage. Always consider edge cases and potential failure points. Write clear, maintainable test code with descriptive names and documentation. Implement testing best practices and maintain high code coverage.`,
    groups: ['read', 'edit', 'browser', 'command'],
    fileRestrictions: {
      fileRegex: '\\.(test|spec|e2e)\\.(js|ts|jsx|tsx)$|^(tests?|__tests__|spec)/',
      description: 'Test files and directories only'
    },
    preferredModel: 'claude-3-haiku',
    temperature: 0.2,
    mcpServers: ['context7'],
    categories: ['testing', 'quality'],
    tags: ['testing', 'qa', 'automation', 'tdd']
  },

  'api-specialist': {
    name: '🔌 API Specialist',
    slug: 'api-specialist',
    roleDefinition: `You are an API development specialist expert in:
- RESTful API design and implementation
- GraphQL schema design and resolvers
- API documentation (OpenAPI/Swagger)
- Authentication and authorization (OAuth, JWT)
- Rate limiting and API security
- API testing and monitoring
- Microservices architecture`,
    whenToUse: 'Use for API development, integration tasks, webhook implementations, and API documentation',
    customInstructions: `Design clear, consistent, and well-documented APIs. Follow REST principles and industry standards. Consider versioning, security, and performance implications. Implement proper error handling and status codes.`,
    groups: ['read', 'edit', 'browser', 'command', 'mcp'],
    fileRestrictions: {
      fileRegex: '\\.(json|yaml|yml|js|ts|py|go)$|api|controller|route|endpoint',
      description: 'API-related files'
    },
    preferredModel: 'claude-3-sonnet',
    temperature: 0.3,
    mcpServers: ['context7'],
    categories: ['api', 'backend'],
    tags: ['api', 'rest', 'graphql', 'integration']
  },

  // The New Fuse Platform Specialists
  'workflow-orchestrator': {
    name: '🔄 Workflow Orchestrator',
    slug: 'workflow-orchestrator',
    roleDefinition: `You are a workflow orchestration specialist for The New Fuse platform, expert in:
- Multi-agent workflow design and coordination
- State management and synchronization
- Event-driven architecture patterns
- Distributed system design
- Message routing and communication protocols
- Error handling and recovery strategies
- Performance monitoring and optimization`,
    whenToUse: 'Use for designing multi-agent workflows, coordinating distributed processes, and managing complex agent interactions',
    customInstructions: `Focus on scalable, fault-tolerant workflow designs. Implement proper error handling and recovery mechanisms. Consider distributed system challenges and optimize for performance and reliability.`,
    groups: ['read', 'edit', 'command', 'mcp'],
    preferredModel: 'claude-3-sonnet',
    temperature: 0.3,
    mcpServers: ['context7', 'git', 'tnf-workflow'],
    categories: ['orchestration', 'workflow'],
    tags: ['workflow', 'orchestration', 'distributed', 'coordination']
  },

  'mcp-integration-specialist': {
    name: '🔗 MCP Integration Specialist',
    slug: 'mcp-specialist',
    roleDefinition: `You are an MCP (Model Context Protocol) integration specialist for The New Fuse platform, expert in:
- MCP server development and configuration
- Protocol implementation and optimization
- Tool integration and capability extension
- Real-time communication protocols
- Service discovery and registration
- Performance optimization and monitoring
- Cross-platform compatibility`,
    whenToUse: 'Use for MCP server development, protocol implementation, and integration with external tools and services',
    customInstructions: `Focus on robust MCP implementations with proper error handling. Ensure compatibility across different platforms and maintain high performance. Follow MCP best practices and security guidelines.`,
    groups: ['read', 'edit', 'command', 'mcp'],
    fileRestrictions: {
      fileRegex: '\\.(ts|js|json|yaml)$|mcp|protocol|server|client',
      description: 'MCP-related files'
    },
    preferredModel: 'claude-3-sonnet',
    temperature: 0.3,
    mcpServers: ['context7', 'tnf-agent'],
    categories: ['integration', 'protocol'],
    tags: ['mcp', 'protocol', 'integration', 'tools']
  },

  'agent-communication-expert': {
    name: '💬 Agent Communication Expert',
    slug: 'agent-comm-expert',
    roleDefinition: `You are an agent communication expert for The New Fuse platform, specialized in:
- Inter-agent communication protocols
- Message routing and distribution
- Real-time synchronization strategies
- Communication security and authentication
- Protocol optimization and performance tuning
- Multi-tenant communication isolation
- Event-driven messaging patterns`,
    whenToUse: 'Use for designing agent communication systems, implementing messaging protocols, and optimizing inter-agent interactions',
    customInstructions: `Design secure, efficient communication protocols. Ensure proper message routing and delivery guarantees. Implement authentication and authorization mechanisms. Optimize for low latency and high throughput.`,
    groups: ['read', 'edit', 'command', 'mcp'],
    preferredModel: 'claude-3-sonnet',
    temperature: 0.3,
    mcpServers: ['context7'],
    categories: ['communication', 'protocol'],
    tags: ['communication', 'messaging', 'protocol', 'real-time']
  }
};

/**
 * API Configuration Profiles
 */
export const API_PROFILES = {
  'high-performance': {
    name: 'High Performance',
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    temperature: 0.3,
    maxTokens: 4096,
    topP: 0.9
  },
  'cost-effective': {
    name: 'Cost Effective',
    provider: 'anthropic',
    model: 'claude-3-haiku',
    temperature: 0.4,
    maxTokens: 2048,
    topP: 0.8,
    rateLimitDelay: 2
  },
  'creative': {
    name: 'Creative',
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.9
  },
  'precise': {
    name: 'Precise',
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    temperature: 0.1,
    maxTokens: 4096,
    topP: 0.7
  }
};

/**
 * MCP Server Configurations
 */
export const MCP_SERVERS = {
  'context7': {
    name: 'context7',
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest'],
    type: 'stdio' as const,
    description: 'General-purpose MCP server with database access, web search, and text utilities',
    enabled: true
  },
  'filesystem': {
    name: 'filesystem',
    command: 'node',
    args: ['filesystem-mcp-server.js'],
    type: 'stdio' as const,
    description: 'File system operations server',
    enabled: true
  },
  'git': {
    name: 'git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    type: 'stdio' as const,
    description: 'Git operations server',
    enabled: true
  },
  'docker': {
    name: 'docker',
    command: 'docker-mcp-server',
    args: [],
    type: 'stdio' as const,
    description: 'Docker container management server',
    enabled: false
  },
  'tnf-workflow': {
    name: 'tnf-workflow',
    command: 'node',
    args: ['../mcp/MCPWorkflowServer.js'],
    type: 'stdio' as const,
    description: 'The New Fuse workflow management server',
    enabled: true
  },
  'tnf-agent': {
    name: 'tnf-agent',
    command: 'node',
    args: ['../mcp/MCPAgentServer.js'],
    type: 'stdio' as const,
    description: 'The New Fuse agent management server',
    enabled: true
  }
};

/**
 * Team Configurations
 */
export const TEAM_CONFIGURATIONS = {
  'fullstack': {
    name: 'Full-stack Development Team',
    description: 'Complete team for full-stack web application development',
    members: [
      'senior-developer',
      'ui-ux-designer',
      'qa-engineer',
      'devops-engineer',
      'technical-writer'
    ],
    sharedMCPServers: ['context7', 'git', 'filesystem'],
    communicationChannels: ['team:fullstack', 'general']
  },
  'startup': {
    name: 'Startup Team',
    description: 'Lean team for rapid product development',
    members: [
      'senior-developer',
      'product-manager',
      'ui-ux-designer',
      'qa-engineer'
    ],
    sharedMCPServers: ['context7', 'git'],
    communicationChannels: ['team:startup', 'general']
  },
  'tnf-platform': {
    name: 'The New Fuse Platform Team',
    description: 'Specialized team for The New Fuse platform development and maintenance',
    members: [
      'senior-developer',
      'workflow-orchestrator',
      'mcp-integration-specialist',
      'agent-communication-expert',
      'devops-engineer',
      'security-auditor'
    ],
    sharedMCPServers: ['context7', 'git', 'tnf-workflow', 'tnf-agent'],
    communicationChannels: ['team:platform', 'development', 'general']
  }
};
