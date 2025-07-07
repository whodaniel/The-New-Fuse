import { z } from 'zod';

// Base enums
export enum AgentStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE',
}

export enum AgentType {
  CONVERSATIONAL = 'CONVERSATIONAL',
  IDE_EXTENSION = 'IDE_EXTENSION',
  API = 'API',
}

export enum AgentRole {
  ASSISTANT = 'ASSISTANT',
  REVIEWER = 'REVIEWER',
}

export enum AgentCapability {
  CODE_GENERATION = 'CODE_GENERATION',
  CODE_REVIEW = 'CODE_REVIEW',
  DOCUMENTATION = 'DOCUMENTATION',
  DEBUGGING = 'DEBUGGING',
  TESTING = 'TESTING',
  OPTIMIZATION = 'OPTIMIZATION',
  CODE_COMPLETION = 'CODE_COMPLETION',
  SYNTAX_VALIDATION = 'SYNTAX_VALIDATION',
  ERROR_DETECTION = 'ERROR_DETECTION',
  DEPENDENCY_MANAGEMENT = 'DEPENDENCY_MANAGEMENT',
  REFACTORING = 'REFACTORING',
  ARCHITECTURE_ANALYSIS = 'ARCHITECTURE_ANALYSIS',
  PERFORMANCE_ANALYSIS = 'PERFORMANCE_ANALYSIS',
  TASK_EXECUTION = 'TASK_EXECUTION',
  PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
  SHELL_COMMAND_EXECUTION = 'SHELL_COMMAND_EXECUTION',
  FILE_MANAGEMENT = 'FILE_MANAGEMENT',
  WEB_SEARCH = 'WEB_SEARCH',
  DATA_ANALYSIS = 'DATA_ANALYSIS',
  API_INTEGRATION = 'API_INTEGRATION',
  DATABASE_OPERATIONS = 'DATABASE_OPERATIONS',
  GITHUB_INTEGRATION = 'GITHUB_INTEGRATION',
  VERSION_CONTROL = 'VERSION_CONTROL',
  LINEAR_INTEGRATION = 'LINEAR_INTEGRATION',
  PROJECT_TRACKING = 'PROJECT_TRACKING',
  SUPABASE_INTEGRATION = 'SUPABASE_INTEGRATION',
  AUTHENTICATION = 'AUTHENTICATION',
  MEMORY_MANAGEMENT = 'MEMORY_MANAGEMENT',
  CONTEXT_RETRIEVAL = 'CONTEXT_RETRIEVAL',
  CODEBASE_RETRIEVAL = 'CODEBASE_RETRIEVAL',
}

export enum AgentToolType {
  READ_FILE = 'READ_FILE',
  SAVE_FILE = 'SAVE_FILE',
  LIST_FILES = 'LIST_FILES',
  REMOVE_FILES = 'REMOVE_FILES',
  CREATE_DIRECTORY = 'CREATE_DIRECTORY',
  SHELL_COMMAND = 'SHELL_COMMAND',
  WEB_FETCH = 'WEB_FETCH',
  WEB_SEARCH = 'WEB_SEARCH',
  CODE_ANALYSIS = 'CODE_ANALYSIS',
  READ_PROCESS = 'READ_PROCESS',
  WRITE_PROCESS = 'WRITE_PROCESS',
  SYSTEM_INFO = 'SYSTEM_INFO',
  DIAGNOSTICS = 'DIAGNOSTICS',
  GITHUB = 'GITHUB',
  VERSION_CONTROL = 'VERSION_CONTROL',
  LINEAR = 'LINEAR',
  PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
  NOTION = 'NOTION',
  DOCUMENTATION = 'DOCUMENTATION',
}

export enum AgentFramework {
  VSCODE = 'VSCODE',
}

// Zod schemas for validation
export const agentStatusSchema = z.nativeEnum(AgentStatus);
export const agentTypeSchema = z.nativeEnum(AgentType);
export const agentRoleSchema = z.nativeEnum(AgentRole);
export const agentCapabilitySchema = z.nativeEnum(AgentCapability);
export const agentToolTypeSchema = z.nativeEnum(AgentToolType);
export const agentFrameworkSchema = z.nativeEnum(AgentFramework);

// Base agent schema
export const baseAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: agentTypeSchema,
  status: agentStatusSchema,
  role: agentRoleSchema,
  capabilities: z.array(agentCapabilitySchema),
  tools: z.array(agentToolTypeSchema),
  framework: agentFrameworkSchema,
  version: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Agent profile schema
export const agentProfileSchema = z.object({
  name: z.string(),
  description: z.string(),
  role: agentRoleSchema,
  capabilities: z.array(agentCapabilitySchema),
  tools: z.array(agentToolTypeSchema),
  configuration: z.record(z.unknown()).optional(),
});

// Agent configuration schema
export const agentConfigurationSchema = z.object({
  maxConcurrentTasks: z.number().positive().default(1),
  timeout: z.number().positive().default(30000),
  retryAttempts: z.number().nonnegative().default(3),
  priority: z.number().min(0).max(10).default(5),
  environment: z.record(z.string()).optional(),
  customSettings: z.record(z.unknown()).optional(),
});

// Agent metrics schema
export const agentMetricsSchema = z.object({
  totalTasks: z.number().nonnegative(),
  completedTasks: z.number().nonnegative(),
  failedTasks: z.number().nonnegative(),
  averageExecutionTime: z.number().nonnegative(),
  lastActivity: z.date(),
  uptime: z.number().nonnegative(),
});

// DTOs for API operations
export const createAgentDtoSchema = z.object({
  name: z.string().min(1),
  type: agentTypeSchema,
  role: agentRoleSchema,
  capabilities: z.array(agentCapabilitySchema),
  tools: z.array(agentToolTypeSchema),
  framework: agentFrameworkSchema,
  configuration: agentConfigurationSchema.optional(),
});

export const updateAgentDtoSchema = createAgentDtoSchema.partial();

export const updateAgentStatusDtoSchema = z.object({
  status: agentStatusSchema,
});

// TypeScript types inferred from schemas
export type AgentStatus = z.infer<typeof agentStatusSchema>;
export type AgentType = z.infer<typeof agentTypeSchema>;
export type AgentRole = z.infer<typeof agentRoleSchema>;
export type AgentCapability = z.infer<typeof agentCapabilitySchema>;
export type AgentToolType = z.infer<typeof agentToolTypeSchema>;
export type AgentFramework = z.infer<typeof agentFrameworkSchema>;

export type BaseAgent = z.infer<typeof baseAgentSchema>;
export type AgentProfile = z.infer<typeof agentProfileSchema>;
export type AgentConfiguration = z.infer<typeof agentConfigurationSchema>;
export type AgentMetrics = z.infer<typeof agentMetricsSchema>;

export type CreateAgentDto = z.infer<typeof createAgentDtoSchema>;
export type UpdateAgentDto = z.infer<typeof updateAgentDtoSchema>;
export type UpdateAgentStatusDto = z.infer<typeof updateAgentStatusDtoSchema>;
