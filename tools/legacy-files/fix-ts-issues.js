#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining TypeScript compilation issues...');

let fixCount = 0;

// 1. Fix @the-new-fuse/types exports
function fixTypesPackage() {
    const typesIndexPath = 'packages/types/src/index.ts';
    if (fs.existsSync(typesIndexPath)) {
        let content = fs.readFileSync(typesIndexPath, 'utf8');
        
        // Add missing exports
        const missingExports = [
            '',
            '// Agent related types',
            'export interface Agent {',
            '  id: string;',
            '  name: string;',
            '  type: AgentType;',
            '  status: AgentStatus;',
            '  description?: string;',
            '  systemPrompt?: string;',
            '  capabilities?: AgentCapability[];',
            '  configuration?: any;',
            '  createdAt: Date;',
            '  updatedAt: Date;',
            '}',
            '',
            'export interface CreateAgentDto {',
            '  name: string;',
            '  type: AgentType;',
            '  description?: string;',
            '  systemPrompt?: string;',
            '  capabilities?: AgentCapability[];',
            '  configuration?: any;',
            '}',
            '',
            'export interface UpdateAgentDto {',
            '  name?: string;',
            '  description?: string;',
            '  systemPrompt?: string;',
            '  capabilities?: AgentCapability[];',
            '  configuration?: any;',
            '  status?: AgentStatus;',
            '}',
            '',
            'export enum AgentType {',
            '  CHAT = "CHAT",',
            '  WORKFLOW = "WORKFLOW",',
            '  TASK = "TASK",',
            '  ASSISTANT = "ASSISTANT"',
            '}',
            '',
            'export enum AgentStatus {',
            '  ACTIVE = "ACTIVE",',
            '  INACTIVE = "INACTIVE",',
            '  BUSY = "BUSY",',
            '  ERROR = "ERROR"',
            '}',
            '',
            'export interface AgentCapability {',
            '  name: string;',
            '  description?: string;',
            '  parameters?: any;',
            '}',
            '',
            '// Workflow related types',
            'export interface Workflow {',
            '  id: string;',
            '  name: string;',
            '  description?: string;',
            '  status: WorkflowStatus;',
            '  steps: WorkflowStep[];',
            '  createdAt: Date;',
            '  updatedAt: Date;',
            '}',
            '',
            'export enum WorkflowStatus {',
            '  DRAFT = "DRAFT",',
            '  ACTIVE = "ACTIVE",',
            '  PAUSED = "PAUSED",',
            '  COMPLETED = "COMPLETED",',
            '  ERROR = "ERROR"',
            '}',
            '',
            'export interface WorkflowStep {',
            '  id: string;',
            '  name: string;',
            '  type: string;',
            '  config: any;',
            '  order: number;',
            '}',
            '',
            'export enum WorkflowExecutionStatus {',
            '  PENDING = "PENDING",',
            '  RUNNING = "RUNNING",',
            '  COMPLETED = "COMPLETED",',
            '  FAILED = "FAILED",',
            '  CANCELLED = "CANCELLED"',
            '}',
            '',
            '// MCP related types',
            'export interface MCPMessage {',
            '  id: string;',
            '  type: string;',
            '  data: any;',
            '  timestamp: Date;',
            '}',
            '',
            'export interface MCPTool {',
            '  name: string;',
            '  description: string;',
            '  parameters: any;',
            '}',
            '',
            '// Entity related types',
            'export interface RegisteredEntity {',
            '  id: string;',
            '  name: string;',
            '  type: string;',
            '  metadata: any;',
            '  createdAt: Date;',
            '}',
            '',
            '// Export related types',
            'export enum ExportFormat {',
            '  JSON = "JSON",',
            '  CSV = "CSV",',
            '  XML = "XML",',
            '  PDF = "PDF"',
            '}',
            '',
            'export interface ConversationExportService {',
            '  export(format: ExportFormat, data: any): Promise<string>;',
            '}',
            '',
            '// Permission types',
            'export enum Permission {',
            '  READ = "READ",',
            '  WRITE = "WRITE",',
            '  DELETE = "DELETE",',
            '  ADMIN = "ADMIN"',
            '}',
            '',
            '// Message types',
            'export interface AgentMessage {',
            '  id: string;',
            '  from: string;',
            '  to: string;',
            '  content: string;',
            '  type: string;',
            '  timestamp: Date;',
            '}',
            '',
            'export interface AgentResponse {',
            '  id: string;',
            '  success: boolean;',
            '  data?: any;',
            '  error?: string;',
            '  timestamp: Date;',
            '}'
        ];
        
        if (!content.includes('export interface Agent')) {
            content += '\n' + missingExports.join('\n');
            fs.writeFileSync(typesIndexPath, content);
            console.log('✅ Added missing exports to packages/types/src/index.ts');
            fixCount++;
        }
    }
}

// 2. Create missing service files
function createMissingServices() {
    const missingFiles = [
        {
            path: 'packages/api/src/modules/prisma/prisma.service.ts',
            content: `import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
`
        }
    ];
    
    missingFiles.forEach(({ path: filePath, content }) => {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Created missing service: ${filePath}`);
            fixCount++;
        }
    });
}

// Run all fixes
try {
    console.log('🔧 Starting TypeScript fixes...\n');
    
    fixTypesPackage();
    createMissingServices();
    
    console.log(`\n✅ TypeScript fixes completed! Applied ${fixCount} fixes.`);
    
} catch (error) {
    console.error('❌ Error during TypeScript fixes:', error);
    process.exit(1);
}
