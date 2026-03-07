export enum ResourceCategory {
  CLAUDE_SKILL = 'CLAUDE_SKILL',
  N8N_WORKFLOW = 'N8N_WORKFLOW',
  AGENT_TEMPLATE = 'AGENT_TEMPLATE',
  CODE_SNIPPET = 'CODE_SNIPPET',
  DOCUMENTATION = 'DOCUMENTATION',
  TOOL = 'TOOL',
  INTEGRATION = 'INTEGRATION',
  WORKFLOW_TEMPLATE = 'WORKFLOW_TEMPLATE',
  API_ENDPOINT = 'API_ENDPOINT',
  DATABASE_SCHEMA = 'DATABASE_SCHEMA',
  UI_COMPONENT = 'UI_COMPONENT',
  CONFIGURATION = 'CONFIGURATION',
  SCRIPT = 'SCRIPT',
  PROMPT_TEMPLATE = 'PROMPT_TEMPLATE',
  DATA_SOURCE = 'DATA_SOURCE',
}

export enum ResourceType {
  JAVASCRIPT = 'JAVASCRIPT',
  TYPESCRIPT = 'TYPESCRIPT',
  PYTHON = 'PYTHON',
  SHELL = 'SHELL',
  SQL = 'SQL',
  JSON = 'JSON',
  YAML = 'YAML',
  TOML = 'TOML',
  ENV = 'ENV',
  MARKDOWN = 'MARKDOWN',
  HTML = 'HTML',
  PDF = 'PDF',
  N8N_JSON = 'N8N_JSON',
  ZAPIER_JSON = 'ZAPIER_JSON',
  MAKE_JSON = 'MAKE_JSON',
  TEMPLATE = 'TEMPLATE',
  SNIPPET = 'SNIPPET',
  OPENAPI = 'OPENAPI',
  GRAPHQL = 'GRAPHQL',
  REST = 'REST',
  BINARY = 'BINARY',
  ARCHIVE = 'ARCHIVE',
  CUSTOM = 'CUSTOM',
}

export enum ResourceVisibility {
  PUBLIC = 'PUBLIC',
  AGENTS_ONLY = 'AGENTS_ONLY',
  PRIVATE = 'PRIVATE',
  RESTRICTED = 'RESTRICTED',
  INTERNAL = 'INTERNAL',
}

export enum ResourceStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

export enum ResourceAction {
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  EXECUTE = 'EXECUTE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  FORK = 'FORK',
  FAVORITE = 'FAVORITE',
  SHARE = 'SHARE',
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
  category: ResourceCategory;
  type: ResourceType;
  content: any;
  tags: string[];
  version: string;
  source: string;
  visibility: ResourceVisibility;
  author?: string;
  authorId?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  searchableText?: string;
  keywords: string[];
  usageCount: number;
  downloadCount: number;
  favoriteCount: number;
  status: ResourceStatus;
  isVerified: boolean;
  isFeatured: boolean;
  dependencies: string[];
  relatedResources: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  deprecatedAt?: Date;
  deletedAt?: Date;
}

export interface ResourceVersion {
  id: string;
  resourceId: string;
  version: string;
  changelog?: string;
  content: any;
  isLatest: boolean;
  isDraft: boolean;
  createdAt: Date;
  createdBy?: string;
}

export interface ResourceMetadata {
  id: string;
  resourceId: string;
  metadata: any;
  performanceMetrics?: any;
  qualityScore?: number;
  complexityScore?: number;
  estimatedExecutionTime?: number;
  requiredDependencies: string[];
  optionalDependencies: string[];
  minimumNodeVersion?: string;
  platforms: string[];
  configSchema?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceAccessLog {
  id: string;
  resourceId: string;
  accessorId?: string;
  accessorType: string;
  action: ResourceAction;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  timestamp: Date;
}

export interface SearchFilters {
  category?: ResourceCategory | ResourceCategory[];
  type?: ResourceType | ResourceType[];
  visibility?: ResourceVisibility | ResourceVisibility[];
  status?: ResourceStatus | ResourceStatus[];
  tags?: string[];
  keywords?: string[];
  author?: string;
  authorId?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  minVersion?: string;
  maxVersion?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface SortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'downloadCount' | 'favoriteCount';
  order: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
