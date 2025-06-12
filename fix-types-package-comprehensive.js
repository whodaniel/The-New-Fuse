#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive types package cleanup...');

const typesDir = 'packages/types/src';

// Step 1: Remove all duplicate and corrupted files
function cleanupDuplicateFiles() {
  console.log('📁 Cleaning up duplicate files...');
  
  function removeFilesByPattern(dir, patterns) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        removeFilesByPattern(fullPath, patterns);
      } else {
        // Remove files matching unwanted patterns
        for (const pattern of patterns) {
          if (pattern.test(file.name)) {
            console.log(`  Removing: ${fullPath}`);
            fs.unlinkSync(fullPath);
            break;
          }
        }
      }
    }
  }
  
  const unwantedPatterns = [
    /\.d\.d\.ts$/,        // Double .d.ts files
    /\.ts-e$/,            // Files ending with -e
    /\.d\.ts-e$/,         // Declaration files ending with -e
    /\.d\.tsx$/,          // Declaration files with .tsx extension
    /\.js$/,              // Compiled JS files in src
  ];
  
  removeFilesByPattern(typesDir, unwantedPatterns);
}

// Step 2: Standardize file extensions
function standardizeExtensions() {
  console.log('🔄 Standardizing file extensions...');
  
  function processDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        processDirectory(fullPath);
      } else if (file.name.endsWith('.tsx') && !file.name.includes('component') && !file.name.includes('Component')) {
        // Convert .tsx to .ts for type-only files
        const newPath = fullPath.replace('.tsx', '.ts');
        console.log(`  Converting: ${fullPath} -> ${newPath}`);
        fs.renameSync(fullPath, newPath);
      }
    }
  }
  
  processDirectory(typesDir);
}

// Step 3: Create clean index.ts file
function createCleanIndex() {
  console.log('📝 Creating clean index.ts file...');
  
  const cleanIndexContent = `// Core types
export type {
  JsonValue,
  DataMap,
  UnknownRecord,
  Primitive,
  BaseEntity,
  ISODateTime,
  UUID,
  BaseConfig,
  BaseResponse,
  ValidationResult
} from './core/base-types';

// Common types
export type {
  ApiResponse,
  Handler
} from './common-types';

// Agent types
export type {
  Agent,
  CreateAgentDto,
  UpdateAgentDto,
  AgentCapabilityConfig
} from './agent';

export {
  AgentStatus,
  AgentRole,
  AgentCapability,
  AgentType
} from './agent';

// Workflow types
export type {
  WorkflowStep,
  WorkflowDefinition,
  WorkflowInstance,
  CreateWorkflowDefinitionDto,
  UpdateWorkflowDefinitionDto,
  StartWorkflowInstanceDto,
  WorkflowService
} from './workflow';

export { WorkflowStatus } from './workflow';

// Task types
export type {
  TaskStatusType,
  TaskPriorityType,
  TaskTypeValue,
  TaskMetadata,
  TaskDependency,
  CreateTaskDto,
  UpdateTaskDto,
  TaskService,
  TaskQuery,
  TaskResult,
  TaskFilter
} from './tasks';

// MCP types
export type {
  MCPMessage,
  MCPError,
  MCPTool,
  MCPResource,
  RegisteredEntity,
  CreateEntityDto,
  UpdateEntityDto
} from './mcp';

export {
  parseMCPMessage,
  createMCPResponse,
  createMCPError
} from './mcp';

// WebSocket types
export type {
  WebSocketMessage,
  WebSocketConfig,
  WebSocketHandler
} from './websocket';

// Service types
export type { ServiceStatus } from './services';

// Other core exports
export * from './marketplace';
export * from './metrics';
export * from './security';
export * from './user';
export * from './state';
export * from './validation';
export * from './chat';
export * from './session';
export * from './suggestion';
export * from './export';
`;

  fs.writeFileSync(path.join(typesDir, 'index.ts'), cleanIndexContent);
}

// Step 4: Create essential missing files with proper content
function createEssentialFiles() {
  console.log('📄 Creating essential files...');
  
  // Core base types
  const baseTypesPath = path.join(typesDir, 'core', 'base-types.ts');
  if (!fs.existsSync(path.dirname(baseTypesPath))) {
    fs.mkdirSync(path.dirname(baseTypesPath), { recursive: true });
  }
  
  const baseTypesContent = `export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type DataMap = Record<string, JsonValue>;
export type UnknownRecord = Record<string, unknown>;
export type Primitive = string | number | boolean | null | undefined;

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ISODateTime = string;
export type UUID = string;

export interface BaseConfig {
  [key: string]: unknown;
}

export interface BaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
`;
  
  fs.writeFileSync(baseTypesPath, baseTypesContent);
  
  // Common types
  const commonTypesPath = path.join(typesDir, 'common-types.ts');
  const commonTypesContent = `import { BaseResponse } from './core/base-types';

export type ApiResponse<T = unknown> = BaseResponse<T>;

export interface Handler<T = unknown, R = unknown> {
  handle(input: T): Promise<R>;
}
`;
  
  fs.writeFileSync(commonTypesPath, commonTypesContent);
  
  // Agent types
  const agentPath = path.join(typesDir, 'agent.ts');
  const agentContent = `import { BaseEntity } from './core/base-types';

export enum AgentType {
  CHAT = "CHAT",
  WORKFLOW = "WORKFLOW", 
  TASK = "TASK",
  ASSISTANT = "ASSISTANT"
}

export enum AgentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE", 
  BUSY = "BUSY",
  ERROR = "ERROR"
}

export enum AgentRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  SYSTEM = "SYSTEM"
}

export interface AgentCapability {
  name: string;
  description?: string;
  parameters?: unknown;
}

export interface Agent extends BaseEntity {
  name: string;
  type: AgentType;
  status: AgentStatus;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapability[];
  configuration?: unknown;
}

export interface CreateAgentDto {
  name: string;
  type: AgentType;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapability[];
  configuration?: unknown;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapability[];
  configuration?: unknown;
  status?: AgentStatus;
}

export interface AgentCapabilityConfig {
  [key: string]: unknown;
}
`;
  
  fs.writeFileSync(agentPath, agentContent);
  
  // Workflow types
  const workflowPath = path.join(typesDir, 'workflow.ts');
  const workflowContent = `import { BaseEntity } from './core/base-types';

export enum WorkflowStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED", 
  COMPLETED = "COMPLETED",
  ERROR = "ERROR"
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config: unknown;
  order: number;
}

export interface WorkflowDefinition extends BaseEntity {
  name: string;
  description?: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
}

export interface WorkflowInstance extends BaseEntity {
  definitionId: string;
  status: WorkflowStatus;
  currentStep?: string;
  context?: unknown;
}

export interface CreateWorkflowDefinitionDto {
  name: string;
  description?: string;
  steps: Omit<WorkflowStep, 'id'>[];
}

export interface UpdateWorkflowDefinitionDto {
  name?: string;
  description?: string;
  steps?: WorkflowStep[];
  status?: WorkflowStatus;
}

export interface StartWorkflowInstanceDto {
  definitionId: string;
  context?: unknown;
}

export interface WorkflowService {
  create(dto: CreateWorkflowDefinitionDto): Promise<WorkflowDefinition>;
  update(id: string, dto: UpdateWorkflowDefinitionDto): Promise<WorkflowDefinition>;
  start(dto: StartWorkflowInstanceDto): Promise<WorkflowInstance>;
}
`;
  
  fs.writeFileSync(workflowPath, workflowContent);
}

// Step 5: Update tsconfig to be more restrictive
function updateTsConfig() {
  console.log('⚙️ Updating tsconfig.json...');
  
  const tsConfigPath = 'packages/types/tsconfig.json';
  const tsConfig = {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "outDir": "./dist",
      "rootDir": "./src",
      "composite": true,
      "declaration": true,
      "noEmit": false,
      "moduleResolution": "Node",
      "module": "ESNext",
      "target": "ES2020",
      "strict": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*.ts"],
    "exclude": [
      "node_modules",
      "dist", 
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/*.d.ts"
    ]
  };
  
  fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
}

// Main execution
try {
  cleanupDuplicateFiles();
  standardizeExtensions();
  createCleanIndex();
  createEssentialFiles();
  updateTsConfig();
  
  console.log('✅ Types package cleanup completed successfully!');
  console.log('🔄 Now run: bun run build');
} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}