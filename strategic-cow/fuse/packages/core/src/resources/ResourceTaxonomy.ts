export enum ResourceType {
  LLM_PROVIDER = 'LLM_PROVIDER',
  CLI_AGENT = 'CLI_AGENT',
  MCP_SERVER = 'MCP_SERVER',
  DOCUMENTATION = 'DOCUMENTATION',
  CODE_REPOSITORY = 'CODE_REPOSITORY',
  API_REFERENCE = 'API_REFERENCE',
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
  DEVELOPMENT_TOOL = 'DEVELOPMENT_TOOL',
  TESTING_FRAMEWORK = 'TESTING_FRAMEWORK',
  DEPLOYMENT_SYSTEM = 'DEPLOYMENT_SYSTEM',
  MONITORING_TOOL = 'MONITORING_TOOL',
  SKILL_DEFINITION = 'SKILL_DEFINITION',
  WORKFLOW_TEMPLATE = 'WORKFLOW_TEMPLATE',
  AGENT_CAPABILITY = 'AGENT_CAPABILITY',
}

export enum ResourceCategory {
  EXECUTION = 'EXECUTION',
  KNOWLEDGE = 'KNOWLEDGE',
  TOOLING = 'TOOLING',
  INTEGRATION = 'INTEGRATION',
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  TESTING = 'TESTING',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
}

export interface ResourceMetadata {
  id: string;
  name: string;
  version: string;
  type: ResourceType;
  categories: ResourceCategory[];
  capabilities: string[];
  supportedSkills: string[];
  provider: string;
  integrationMethod: string;
  authenticationRequired: boolean;
  tags: string[];
  searchableContent: string[];
  relatedResources: string[];
  changelog: string[];
  avgResponseTime: number;
  reliability: number;
  costPerUse: number;
  usageCount: number;
}
