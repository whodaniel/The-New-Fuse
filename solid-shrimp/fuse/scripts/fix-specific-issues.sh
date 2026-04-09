#!/bin/bash

set -e

echo "Applying specific fixes to key issues..."

# Create a file for enums
mkdir -p src/config
cat > src/config/enums.ts << 'EOL'
// filepath: src/config/enums.ts

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress'
}

export enum TaskType {
  ROUTINE = 'routine',
  ONETIME = 'onetime',
  RECURRING = 'recurring',
  DEPENDENT = 'dependent',
  BACKGROUND = 'background',
  USER_INITIATED = 'user_initiated',
  SYSTEM = 'system'
}

export enum MetricUnit {
  COUNT = 'count',
  BYTES = 'bytes',
  SECONDS = 'seconds',
  MILLISECONDS = 'milliseconds',
  PERCENTAGE = 'percentage',
  NONE = 'none'
}

export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS = 'business',
  SYSTEM = 'system'
}

export enum AssetCategory {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  MODEL = 'model',
  COMPONENT = 'component'
}
EOL

# Create utility functions for working with unknown types and errors
mkdir -p src/utils
cat > src/utils/type-helpers.ts << 'EOL'
// filepath: src/utils/type-helpers.ts

/**
 * Helper functions for TypeScript type issues
 */

/**
 * Safely cast unknown to Record<string, unknown>
 */
export function safeObjectCast(input: unknown): Record<string, unknown> {
  if (typeof input === 'object' && input !== null) {
    return input as Record<string, unknown>;
  }
  return {};
}

/**
 * Handle error objects safely
 */
export function formatError(error: unknown): Record<string, unknown> {
  const errorObj: Record<string, unknown> = {};
  
  if (error instanceof Error) {
    errorObj.message = error.message;
    errorObj.name = error.name;
    errorObj.stack = error.stack;
  } else if (typeof error === 'string') {
    errorObj.message = error;
  } else if (typeof error === 'object' && error !== null) {
    Object.assign(errorObj, error);
  } else {
    errorObj.message = "Unknown error";
  }
  
  return errorObj;
}

/**
 * Safely convert string or null to string
 */
export function safeString(input: string | null | undefined): string {
  return input ?? '';
}

/**
 * Safely handle unknown errors
 */
export function handleUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error);
  }
  return "Unknown error";
}

/**
 * Type guard for checking if an object has a specific property
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
EOL

echo "Successfully applied specific fixes!"
