// Central barrel export for all utilities - improves import efficiency
// This preserves all existing functionality while improving developer experience
// Build cache bust: 2026-01-08T21:15:00 - Node.js module fixes

// Core utilities
export * from './cn';
export * from './constants';
export * from './date';
export * from './numbers';
export * from './paths';
export * from './TimeStamp';

// API and networking
export * from './api';
export * from './request';

// Authentication and security
export * from './auth';
export * from './encryption';
export * from './security';

// Data handling
// Note: './database' removed - uses Node.js-only modules (mysql2, ioredis, @nestjs/common)
export * from './storage';
export * from './validation';

// UI and user experience
export * from './animation';
export * from './notifications';
export * from './theme';
export * from './toast';

// File operations
export * from './directories';
export * from './files';

// Chat utilities
export * from './chat/index';
export * from './chat/clipboard';
export * from './chat/codeblock';
export * from './chat/highlight';
export * from './chat/image';
export * from './chat/markdown';
export * from './chat/streaming';

// Development and debugging
export * from './logger';
// Note: './logging' removed - it uses Node.js-only APIs (winston, fs, path) that crash browsers
// Use LoggingService from '../services/logging' for browser-compatible logging
export * from './errors';
export * from './monitoring';

// Advanced features
export * from './enhanced_communication';
export * from './mcp_integration';
export * from './workflow';
export * from './workflow-optimizer';
export * from './workflow-schema-validator';
export * from './workflow_agent';
export * from './workflow_manager';
export * from './workflowValidation';

// Graph and visualization
export * from './graph-adapters';

// Performance and optimization
export * from './testUtils';
// Note: './progress_tracker' removed - uses Node.js-only logging_config
export * from './performance-monitor';

// Resource management
export * from './resource_examples';
export * from './resource_manager';
export * from './schema_examples';
export * from './schema_migration';

// Specialized utilities
export * from './harmlessness';
export * from './message-utils';
export * from './messages';
export * from './organize_files';
export * from './output_formatter';
export * from './verification';
// Note: './redis_client' removed - uses Node.js-only ioredis
export * from './accessibility';
export * from './update_imports';

// Type utilities
export * from './types';
