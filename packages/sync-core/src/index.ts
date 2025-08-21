// Core sync types and interfaces
export * from './types';

// Configuration
export * from './config/SyncRedisConfig';

// Database integration
export * from './database/SyncDatabaseService';

// Services
export * from './services/MasterClockService';
export * from './services/SyncOrchestrator';
export * from './services/ConflictManager';

// Watchers
export * from './watchers/EnhancedFileSystemWatcher';

// Messaging (Task 7 - Sync-aware messaging)
export * from './messaging';

// Handoff (Task 8 - Prompt handoff flywheel)
export * from './handoff';

// Dashboard (Task 6 - Real-time dashboard updates)
export * from './dashboard';

// Tasks (Task 9 - Enhanced task management with real-time synchronization)
export * from './tasks';

// Monitoring (Task 10 - Sync-aware heartbeat monitoring with health tracking)
export * from './monitoring';

// CMS Integration (Task 11 - CMS integration with existing user and tenant systems)
export * from './cms';

// Error Handling (Task 12 - Comprehensive error handling and monitoring integration)
export * from './error';

// Performance Optimization (Task 13 - Performance optimization and scalability features)
export * from './performance';

// This package provides the core infrastructure for multi-tenant synchronization
// integrating with existing Redis and database services