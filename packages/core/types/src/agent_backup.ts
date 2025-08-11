import { z } from 'zod';

// Base enums
export enum AgentStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE'
}

export enum AgentType {
  CONVERSATIONAL = 'CONVERSATIONAL',
  IDE_EXTENSION = 'IDE_EXTENSION',
  API = 'API'
}

export enum AgentRole {
  ASSISTANT = 'ASSISTANT',
  DEVELOPER = 'DEVELOPER',
  REVIEWER = 'REVIEWER'
}

export enum AgentCapability {
  // Code-related capabilities
  CODE_REVIEW = 'CODE_REVIEW',
  CODE_REFACTORING = 'CODE_REFACTORING',
  DEBUGGING = 'DEBUGGING',
  TESTING = 'TESTING',
  DOCUMENTATION = 'DOCUMENTATION',
  CODE_COMPLETION = 'CODE_COMPLETION',
  CODE_SUGGESTIONS = 'CODE_SUGGESTIONS',
  SYNTAX_HIGHLIGHTING = 'SYNTAX_HIGHLIGHTING',
  ERROR_DETECTION = 'ERROR_DETECTION',
  CODE_FORMATTING = 'CODE_FORMATTING',
  INTELLISENSE = 'INTELLISENSE',
  REFACTORING = 'REFACTORING',
  DOCUMENTATION_GENERATION = 'DOCUMENTATION_GENERATION',
  
  // Tool-related capabilities
  TOOL_USAGE = 'TOOL_USAGE',
  TASK_EXECUTION = 'TASK_EXECUTION',
  FILE_MANAGEMENT = 'FILE_MANAGEMENT',
  PROCESS_MANAGEMENT = 'PROCESS_MANAGEMENT',
  SHELL_COMMAND_EXECUTION = 'SHELL_COMMAND_EXECUTION',
  
  // Web and API capabilities
  WEB_SEARCH = 'WEB_SEARCH',
  WEB_BROWSING = 'WEB_BROWSING',
  API_INTEGRATION = 'API_INTEGRATION',
  
  // Integration capabilities
  GITHUB_INTEGRATION = 'GITHUB_INTEGRATION',
  JIRA_INTEGRATION = 'JIRA_INTEGRATION',
  LINEAR_INTEGRATION = 'LINEAR_INTEGRATION',
  CONFLUENCE_INTEGRATION = 'CONFLUENCE_INTEGRATION',
  NOTION_INTEGRATION = 'NOTION_INTEGRATION',
  SUPABASE_INTEGRATION = 'SUPABASE_INTEGRATION',
  
  // Memory and context capabilities
  MEMORY_MANAGEMENT = 'MEMORY_MANAGEMENT',
  CONTEXT_AWARENESS = 'CONTEXT_AWARENESS',
  CODEBASE_RETRIEVAL = 'CODEBASE_RETRIEVAL'
}

export enum AgentToolType {
  // File Management Tools
  SAVE_FILE = 'SAVE_FILE',
  EDIT_FILE = 'EDIT_FILE',
  REMOVE_FILES = 'REMOVE_FILES',
  
  // Web Interaction Tools
  OPEN_BROWSER = 'OPEN_BROWSER',
  WEB_SEARCH = 'WEB_SEARCH',
  WEB_FETCH = 'WEB_FETCH',
  
  // Process Management Tools
  LAUNCH_PROCESS = 'LAUNCH_PROCESS',
  KILL_PROCESS = 'KILL_PROCESS',
  READ_PROCESS = 'READ_PROCESS',
  WRITE_PROCESS = 'WRITE_PROCESS',
  LIST_PROCESSES = 'LIST_PROCESSES',
  
  // Code Analysis Tools
  DIAGNOSTICS = 'DIAGNOSTICS',
  CODEBASE_RETRIEVAL = 'CODEBASE_RETRIEVAL',
  
  // Integration Tools
  GITHUB_API = 'GITHUB_API',
  LINEAR = 'LINEAR',
  JIRA = 'JIRA',
  CONFLUENCE = 'CONFLUENCE',
  NOTION = 'NOTION',
  SUPABASE = 'SUPABASE',
  
  // Memory Tool
  REMEMBER = 'REMEMBER'
}

export enum AgentFramework {
  VSCODE = 'VSCODE',
  WEBIDE = 'WEBIDE',
  CLI = 'CLI'
}

// Zod schemas
export const agentStatusSchema = z.nativeEnum(AgentStatus);
export const agentTypeSchema = z.nativeEnum(AgentType);
export const agentRoleSchema = z.nativeEnum(AgentRole);
export const agentCapabilitySchema = z.nativeEnum(AgentCapability);
export const agentToolTypeSchema = z.nativeEnum(AgentToolType);
export const agentFrameworkSchema = z.nativeEnum(AgentFramework);

export const baseAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  capabilities: z.array(agentCapabilitySchema),
  status: agentStatusSchema,
  lastActive: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export const agentProfileSchema = baseAgentSchema.extend({
  type: agentTypeSchema,
  role: agentRoleSchema,
  framework: agentFrameworkSchema,
  provider: z.string(),
  config: z.record(z.unknown()),
});

export const agentConfigurationSchema = z.object({
  provider: z.string(),
  config: z.record(z.unknown()),
});

export const agentMetricsSchema = z.object({
  successRate: z.number(),
  totalTasks: z.number(),
  averageResponseTime: z.number(),
  lastUpdated: z.date(),
});

// Zod schemas for DTOs
export const createAgentDtoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: agentTypeSchema,
  role: agentRoleSchema,
  framework: agentFrameworkSchema,
  provider: z.string(),
  capabilities: z.array(agentCapabilitySchema),
  config: z.record(z.unknown()),
});

export const updateAgentDtoSchema = createAgentDtoSchema.partial();

export const updateAgentStatusDtoSchema = z.object({
  status: agentStatusSchema,
});

// Type definitions derived from schemas
export type AgentProfile = z.infer<typeof agentProfileSchema>;
export type AgentConfiguration = z.infer<typeof agentConfigurationSchema>;
export type AgentMetrics = z.infer<typeof agentMetricsSchema>;
export type CreateAgentDto = z.infer<typeof createAgentDtoSchema>;
export type UpdateAgentDto = z.infer<typeof updateAgentDtoSchema>;
export type UpdateAgentStatusDto = z.infer<typeof updateAgentStatusDtoSchema>;