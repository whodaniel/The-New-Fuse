#!/bin/bash

set -e

echo "Fixing entity-related TypeScript issues..."

# Create base entity structure
mkdir -p src/entities

# Create BaseEntity type
cat > src/entities/base.entity.ts << 'EOL'
// filepath: src/entities/base.entity.ts
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt: Date | null;
}

export interface AuditableEntity extends BaseEntity {
  createdBy: string;
  updatedBy: string;
}
EOL

# Create User entity
cat > src/entities/user.entity.ts << 'EOL'
// filepath: src/entities/user.entity.ts
import { BaseEntity } from './base.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export interface User extends BaseEntity {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  metadata?: Record<string, any>;
}
EOL

# Create Task entity
cat > src/entities/task.entity.ts << 'EOL'
// filepath: src/entities/task.entity.ts
import { BaseEntity } from './base.entity';

export interface Task extends BaseEntity {
  name: string;
  description?: string;
  status: string;
  type: string;
  priority: number;
  dueDate?: Date;
  completedAt?: Date;
  assignedTo?: string;
  metadata?: Record<string, any>;
  parentId?: string;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: any;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  startTime: Date;
  endTime: Date;
  duration: number;
  metadata?: Record<string, any>;
}
EOL

# Create Message entity
cat > src/entities/message.entity.ts << 'EOL'
// filepath: src/entities/message.entity.ts
import { BaseEntity } from './base.entity';

export interface Message extends BaseEntity {
  content: string;
  role: string;
  conversationId: string;
  userId?: string;
  metadata?: Record<string, any>;
  tokens?: number;
}

export interface Conversation extends BaseEntity {
  title?: string;
  userId: string;
  status: string;
  messages: Message[];
  metadata?: Record<string, any>;
  lastMessageAt: Date;
}
EOL

# Create Workflow entity
cat > src/entities/workflow.entity.ts << 'EOL'
// filepath: src/entities/workflow.entity.ts
import { BaseEntity } from './base.entity';

export interface WorkflowTemplate extends BaseEntity {
  name: string;
  description?: string;
  version: string;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];
  metadata?: Record<string, any>;
  status: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position: {
    x: number;
    y: number;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

export interface WorkflowExecution extends BaseEntity {
  templateId: string;
  name: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: Record<string, any>;
  currentNodeId?: string;
  executedNodes: Record<string, WorkflowNodeResult>;
  metadata?: Record<string, any>;
}

export interface WorkflowNodeResult {
  nodeId: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: Record<string, any>;
}
EOL

# Create File entity
cat > src/entities/file.entity.ts << 'EOL'
// filepath: src/entities/file.entity.ts
import { BaseEntity } from './base.entity';

export interface File extends BaseEntity {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy?: string;
  metadata?: Record<string, any>;
  hash?: string;
}

export interface FileUpload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  encoding: string;
  metadata?: Record<string, any>;
}
EOL

# Create Settings entity
cat > src/entities/settings.entity.ts << 'EOL'
// filepath: src/entities/settings.entity.ts
import { BaseEntity } from './base.entity';

export interface Settings extends BaseEntity {
  key: string;
  value: any;
  scope: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface UserSettings {
  userId: string;
  preferences: Record<string, any>;
  notifications: Record<string, boolean>;
  theme: string;
  language: string;
}

export interface SystemSettings {
  maintenance: boolean;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  apiKeys: Record<string, string>;
}
EOL

# Create Repository interfaces
mkdir -p src/repositories
cat > src/repositories/base.repository.ts << 'EOL'
// filepath: src/repositories/base.repository.ts
export interface FindOptions {
  where?: Record<string, any>;
  order?: Record<string, 'ASC' | 'DESC'>;
  limit?: number;
  offset?: number;
  relations?: string[];
}

export interface IRepository<T> {
  findAll(options?: FindOptions): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findOne(options?: FindOptions): Promise<T | null>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export interface ISoftDeleteRepository<T> extends IRepository<T> {
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  findDeleted(options?: FindOptions): Promise<T[]>;
}
EOL

# Create DTO interfaces
mkdir -p src/dto
cat > src/dto/base.dto.ts << 'EOL'
// filepath: src/dto/base.dto.ts
export interface BaseDTO {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ErrorDTO {
  statusCode: number;
  message: string;
  error?: string;
  details?: any;
  timestamp?: string;
}
EOL

# Create specific DTOs
cat > src/dto/user.dto.ts << 'EOL'
// filepath: src/dto/user.dto.ts
import { BaseDTO } from './base.dto';
import { UserRole, UserStatus } from '../entities/user.entity';

export interface CreateUserDTO {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  metadata?: Record<string, any>;
}

export interface UpdateUserDTO {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  metadata?: Record<string, any>;
}

export interface UserResponseDTO extends BaseDTO {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
}
EOL

echo "Fixing entity-related imports in existing files..."
find src -name "*.ts" -exec sed -i '' 's/import { User } from "\.\.\/types"/import { User } from "\.\.\/entities\/user\.entity"/g' {} \;
find src -name "*.ts" -exec sed -i '' 's/import { Task } from "\.\.\/types"/import { Task } from "\.\.\/entities\/task\.entity"/g' {} \;
find src -name "*.ts" -exec sed -i '' 's/import { Message } from "\.\.\/types"/import { Message } from "\.\.\/entities\/message\.entity"/g' {} \;

echo "Successfully fixed entity-related TypeScript issues."
