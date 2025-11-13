#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Final TypeScript types cleanup...');

const typesDir = 'packages/types/src';

// Fix all remaining .tsx imports and missing files
function fixAllRemainingIssues() {
  console.log('🔄 Fixing remaining import issues...');
  
  // Remove problematic files that still have .tsx imports
  const problematicFiles = [
    'auth.ts',
    'core/common-types.ts', 
    'core/index.ts',
    'performance.ts',
    'resource.ts',
    'services/agent-types.ts',
    'services/cache-types.ts',
    'services/index.ts',
    'services/notification-types.ts',
    'services/task-types.ts',
    'task/dto.ts',
    'task/index.ts',
    'task/service.ts',
    'websocket/socket.types.ts',
    'workflow.types.ts'
  ];
  
  for (const file of problematicFiles) {
    const fullPath = path.join(typesDir, file);
    if (fs.existsSync(fullPath)) {
      console.log(`  Removing problematic file: ${fullPath}`);
      fs.unlinkSync(fullPath);
    }
  }
  
  // Remove directories that might contain problematic files
  const dirs = ['task', 'websocket', 'services'];
  for (const dir of dirs) {
    const dirPath = path.join(typesDir, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`  Removing directory: ${dirPath}`);
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }
  
  // Update the main index.ts to only include files that actually exist
  const cleanIndex = `// Core types
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

  fs.writeFileSync(path.join(typesDir, 'index.ts'), cleanIndex);
  
  // Fix the export type issue in index.ts
  const indexPath = path.join(typesDir, 'index.ts');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  // Change export { to export type { for isolated modules
  indexContent = indexContent.replace(/export \{([^}]+)\} from/g, 'export type { $1 } from');
  fs.writeFileSync(indexPath, indexContent);
}

// Main execution
try {
  fixAllRemainingIssues();
  
  console.log('✅ Final cleanup completed successfully!');
  console.log('🔄 Now run: pnpm run build');
} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}