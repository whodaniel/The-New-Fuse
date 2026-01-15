// Core sync types and interfaces
export * from './types';

// Configuration
export * from './config/SyncRedisConfig';

// Database integration
// Temporarily disabled - Prisma migration to Drizzle ORM pending
// export * from './database/SyncDatabaseService';

// Services
export * from './services/MasterClockService';
// Temporarily disabled - requires Prisma-based SyncDatabaseService
// export * from './services/SyncOrchestrator';
// ConflictManager temporarily disabled - requires BaseErrorHandler refactoring
// export * from './services/ConflictManager';

// Watchers
// Temporarily disabled - requires Prisma-based SyncDatabaseService
// export * from './watchers/EnhancedFileSystemWatcher';

// Messaging (Task 7 - Sync-aware messaging)
// Temporarily disabled - requires protocol types refactoring
// export * from './messaging';

// Handoff (Task 8 - Prompt handoff flywheel)
// Temporarily disabled - requires type fixes
// export * from './handoff';

// Dashboard (Task 6 - Real-time dashboard updates)
// Temporarily disabled due to Chakra UI v3 breaking changes
// export * from './dashboard';

// Tasks (Task 9 - Enhanced task management with real-time synchronization)
// Temporarily disabled - requires type fixes
// export * from './tasks';

// Monitoring (Task 10 - Sync-aware heartbeat monitoring with health tracking)
// Temporarily disabled - requires relay-core dependency and type fixes
// export * from './monitoring';

// CMS Integration (Task 11 - CMS integration with existing user and tenant systems)
// Temporarily disabled - requires EnhancedFileSystemWatcher.onFileChange method
// export * from './cms';

// Error Handling (Task 12 - Comprehensive error handling and monitoring integration)
// Temporarily disabled - requires Logger interface and BaseErrorHandler fixes
// export * from './error';

// Performance Optimization (Task 13 - Performance optimization and scalability features)
// Temporarily disabled - requires EnhancedFileSystemWatcher which uses Prisma
// export * from './performance';

// This package provides the core infrastructure for multi-tenant synchronization
// integrating with existing Redis and database services
