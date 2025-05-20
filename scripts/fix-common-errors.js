#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Read error report if available
let errorReport = { errorsByFile: {} };
if (fs.existsSync('typescript-errors-direct.json')) {
  errorReport = JSON.parse(fs.readFileSync('typescript-errors-direct.json', 'utf8'));
}

// Fix container references
function fixContainerIssues() {

  // Find files with container issues
  const containerFiles = Object.entries(errorReport.errorsByFile)
    .filter(([_, info]) => 
      info.errors.some(err => 
        err.includes("Cannot find name 'container'") || 
        err.includes("Property does not exist on type")
      )
    )
    .map(([file]) => file);
  
  containerFiles.forEach(filePath => {
    try {

      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Add container import if missing
      let updated = content;
      if (content.includes("container.get(TYPES") && !content.includes("import { container }")) {
        updated = `import { container } from '../di/container.js';\n${updated}`;
      }
      
      // Fix TYPES properties
      updated = updated.replace(/TYPES\.Config/g, 'TYPES.ConfigService')
                       .replace(/TYPES\.Logger/g, 'TYPES.LoggingService')
                       .replace(/TYPES\.Cache/g, 'TYPES.CacheService')
                       .replace(/TYPES\.Time/g, 'TYPES.TimeService');
      
      if (content !== updated) {
        fs.writeFileSync(filePath, updated);
        
      }
    } catch (err) {
      
    }
  });
}

// Create missing directories
function createMissingDirectories() {
  // Important directories for packages
  const dirs = [
    'packages/types/src',
    'packages/core/src',
    'packages/core/src/di',
    'packages/core/src/config',
    'packages/core/src/logging',
    'packages/core/src/time',
    'packages/core/src/cache',
    'packages/core/src/errors',
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
}

// Create missing type definitions
function createMissingTypes() {
  const typesDir = path.join(process.cwd(), 'packages/types/src');
  
  // Create index.ts if it doesn't exist
  const indexPath = path.join(typesDir, 'index.ts');
  if (!fs.existsSync(indexPath)) {
    
    fs.writeFileSync(indexPath, `export * from './user.js';
export * from './error.js';

// Basic type definitions
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export interface CustomError {
  code: string;
  message: string;
  details?: Record<string, any>;
  severity: ErrorSeverity;
  stack?: string;
}
`);
  }
  
  // Create user.ts if it doesn't exist
  const userPath = path.join(typesDir, 'user.ts');
  if (!fs.existsSync(userPath)) {
    
    fs.writeFileSync(userPath, `export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  roles?: string[];
  permissions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  token?: string;
}

export interface AuthUser extends Omit<User, 'password'> {}
`);
  }
}

// Create basic DI container
function createDIContainer() {
  const containerPath = path.join(process.cwd(), 'packages/core/src/di/container.ts');
  const typesPath = path.join(process.cwd(), 'packages/core/src/di/types.ts');
  
  if (!fs.existsSync(containerPath)) {
    
    fs.writeFileSync(containerPath, `import { Container } from 'inversify';
import TYPES from './types.js';

const container = new Container();

export { container };
`);
  }
  
  if (!fs.existsSync(typesPath)) {
    
    fs.writeFileSync(typesPath, `const TYPES = {
  ConfigService: Symbol.for('ConfigService'),
  LoggingService: Symbol.for('LoggingService'),
  CacheService: Symbol.for('CacheService'),
  TimeService: Symbol.for('TimeService'),
  ErrorHandler: Symbol.for('ErrorHandler'),
  
  // Aliases for backward compatibility
  Config: Symbol.for('ConfigService'),
  Logger: Symbol.for('LoggingService'),
  Cache: Symbol.for('CacheService'),
  Time: Symbol.for('TimeService')
};

export default TYPES;
`);
  }
}

// Execute fixes
createMissingDirectories();
createMissingTypes();
createDIContainer();
fixContainerIssues();

