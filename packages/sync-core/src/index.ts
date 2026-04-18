// Core sync types and interfaces
export * from './types/index.js';

// Configuration
export * from './config/SyncRedisConfig.js';

// Database integration
// Temporarily disabled - Drizzle migration to Drizzle ORM pending
// export * from './database/SyncDatabaseService.js';

// Services
export * from './services/MasterClockService.js';
// Temporarily disabled - requires Drizzle-based SyncDatabaseService
// export * from './services/SyncOrchestrator.js';
// ConflictManager temporarily disabled - requires BaseErrorHandler refactoring
// export * from './services/ConflictManager.js';

// Watchers
// Temporarily disabled - requires Drizzle-based SyncDatabaseService
// export * from './watchers/EnhancedFileSystemWatcher.js';

// Messaging (Task 7 - Sync-aware messaging)
// Temporarily disabled - requires protocol types refactoring
// export * from './messaging/index.js';

// Handoff (Task 8 - Prompt handoff flywheel)
// Temporarily disabled - requires type fixes
// export * from './handoff/index.js';

// Dashboard (Task 6 - Real-time dashboard updates)
// Temporarily disabled due to Chakra UI v3 breaking changes
// export * from './dashboard/index.js';

// Tasks (Task 9 - Enhanced task management with real-time synchronization)
// Temporarily disabled - requires type fixes
// export * from './tasks/index.js';

// Monitoring (Task 10 - Sync-aware heartbeat monitoring with health tracking)
// Temporarily disabled - requires relay-core dependency and type fixes
// export * from './monitoring/index.js';

// CMS Integration (Task 11 - CMS integration with existing user and tenant systems)
// Temporarily disabled - requires EnhancedFileSystemWatcher.onFileChange method
// export * from './cms/index.js';

// Error Handling (Task 12 - Comprehensive error handling and monitoring integration)
// Temporarily disabled - requires Logger interface and BaseErrorHandler fixes
// export * from './error/index.js';

// Performance Optimization (Task 13 - Performance optimization and scalability features)
// Temporarily disabled - requires EnhancedFileSystemWatcher which uses Drizzle
// export * from './performance/index.js';

// This package provides the core infrastructure for multi-tenant synchronization
// integrating with existing Redis and database services
