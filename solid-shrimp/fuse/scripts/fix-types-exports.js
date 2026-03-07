#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Create directory if it doesn't exist
const typesDir = path.join(process.cwd(), 'packages', 'types', 'src');
if (!fs.existsSync(typesDir)) {
  
  fs.mkdirSync(typesDir, { recursive: true });
}

// Create missing type definitions
const missingTypes = [
  {
    name: 'Agent',
    content: `export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: string;
  capabilities: string[];
  status: string;
  accuracy?: number;
  collaborators?: string[];
  metadata?: Record<string, any>;
}

export interface CreateAgentDto {
  name: string;
  description?: string;
  type: string;
  capabilities: string[];
  metadata?: Record<string, any>;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  type?: string;
  capabilities?: string[];
  status?: string;
  metadata?: Record<string, any>;
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRAINING = 'training',
  ERROR = 'error'
}
`
  },
  {
    name: 'Auth',
    content: `export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  metadata?: Record<string, any>;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}
`
  },
  {
    name: 'Task',
    content: `export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskType {
  ROUTINE = 'routine',
  ONETIME = 'onetime',
  RECURRING = 'recurring',
  DEPENDENT = 'dependent',
  BACKGROUND = 'background',
  GENERIC = 'generic'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  dueDate?: Date;
  assigneeId?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
  progress?: number;
}
`
  }
];

// Write missing type files
missingTypes.forEach(type => {
  const filePath = path.join(typesDir, `${type.name.toLowerCase()}.ts`);
  
  fs.writeFileSync(filePath, type.content);
});

// Update index.ts to export all types
const indexPath = path.join(typesDir, 'index.ts');
let indexContent = '';

// Add imports and exports for each type file
missingTypes.forEach(type => {
  indexContent += `export * from './${type.name.toLowerCase()}';
`;
});

fs.writeFileSync(indexPath, indexContent);

// Create a barrel file at the package root
const barrelPath = path.join(process.cwd(), 'packages', 'types', 'index.ts');

fs.writeFileSync(barrelPath, `export * from './src.js';
`);

// Create a minimal package.json if it doesn't exist
const packageJsonPath = path.join(process.cwd(), 'packages', 'types', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  
  const packageJson = {
    "name": "@the-new-fuse/types",
    "version": "1.0.0",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
      "build": "tsc",
      "clean": "rimraf dist"
    },
    "dependencies": {},
    "devDependencies": {
      "typescript": "^4.9.5",
      "rimraf": "^3.0.2"
    }
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

// Create a minimal tsconfig.json if it doesn't exist
const tsconfigPath = path.join(process.cwd(), 'packages', 'types', 'tsconfig.json');
if (!fs.existsSync(tsconfigPath)) {
  
  const tsconfig = {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "outDir": "./dist",
      "rootDir": "./",
      "composite": true,
      "declaration": true
    },
    "include": ["src/**/*", "index.ts"],
    "exclude": ["node_modules", "dist"]
  };
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
}

// Create a build script
const buildScriptPath = path.join(process.cwd(), 'packages', 'types', 'build.sh');

fs.writeFileSync(buildScriptPath, `#!/bin/bash

set -e

echo "Building @the-new-fuse/types package..."

# Install dependencies
yarn install

# Build the package
yarn build

echo "@the-new-fuse/types package built successfully!"
`);
fs.chmodSync(buildScriptPath, '755');

