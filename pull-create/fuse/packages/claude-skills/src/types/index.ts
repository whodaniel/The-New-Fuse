/**
 * Claude Skills Type Definitions
 *
 * Type definitions for integrating Anthropic's Claude Skills into The New Fuse
 */

/**
 * Skill parameter definition with validation schema
 */
export interface SkillParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: any;
  schema?: any; // JSON Schema for complex types
  enum?: string[] | number[];
}

/**
 * Skill metadata from YAML frontmatter
 */
export interface SkillMetadata {
  name: string;
  description: string;
  license?: string;
  allowedTools?: string[];
  metadata?: Record<string, string>;
}

/**
 * Complete skill definition
 */
export interface ClaudeSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  metadata: SkillMetadata;
  content: string; // Markdown content from SKILL.md
  instructions: string; // Processed instructions
  parameters: SkillParameter[];
  version?: string;
  author?: string;
  sourceUrl?: string;
  localPath?: string;
}

/**
 * Skill execution context
 */
export interface SkillExecutionContext {
  skillId: string;
  parameters: Record<string, any>;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Skill execution result
 */
export interface SkillExecutionResult {
  success: boolean;
  output?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    executionTime?: number;
    resourcesUsed?: string[];
    warnings?: string[];
  };
}

/**
 * Skill category enumeration
 */
export enum SkillCategory {
  CREATIVE_DESIGN = 'creative-design',
  DEVELOPMENT_TECHNICAL = 'development-technical',
  ENTERPRISE_COMMUNICATION = 'enterprise-communication',
  DOCUMENT_PROCESSING = 'document-processing',
  META_SKILLS = 'meta-skills',
  CODE_ANALYSIS = 'code-analysis',
  TESTING = 'testing',
  REFACTORING = 'refactoring',
  DOCUMENTATION = 'documentation',
  OTHER = 'other'
}

/**
 * Skill loader configuration
 */
export interface SkillLoaderConfig {
  sourceRepositoryUrl: string;
  localCachePath: string;
  autoUpdate?: boolean;
  updateInterval?: number; // milliseconds
  categoriesFilter?: SkillCategory[];
  tagsFilter?: string[];
}

/**
 * Skill registry interface
 */
export interface ISkillRegistry {
  register(skill: ClaudeSkill): Promise<void>;
  unregister(skillId: string): Promise<void>;
  get(skillId: string): Promise<ClaudeSkill | undefined>;
  list(filter?: SkillFilter): Promise<ClaudeSkill[]>;
  search(query: string): Promise<ClaudeSkill[]>;
  update(skillId: string, updates: Partial<ClaudeSkill>): Promise<void>;
}

/**
 * Skill filter criteria
 */
export interface SkillFilter {
  categories?: SkillCategory[];
  tags?: string[];
  namePattern?: string;
  descriptionPattern?: string;
}

/**
 * Skill executor interface
 */
export interface ISkillExecutor {
  execute(context: SkillExecutionContext): Promise<SkillExecutionResult>;
  validate(skillId: string, parameters: Record<string, any>): Promise<ValidationResult>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    parameter: string;
    message: string;
    constraint?: string;
  }>;
}

/**
 * Skill import result
 */
export interface SkillImportResult {
  imported: number;
  failed: number;
  skipped: number;
  skills: ClaudeSkill[];
  errors: Array<{
    skillName: string;
    error: string;
  }>;
}

/**
 * MCP tool definition for a skill
 */
export interface SkillMCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
