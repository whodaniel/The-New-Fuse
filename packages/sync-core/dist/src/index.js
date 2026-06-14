"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Core sync types and interfaces
__exportStar(require("./types"), exports);
// Configuration
__exportStar(require("./config/SyncRedisConfig"), exports);
// Database integration
// Temporarily disabled - Drizzle migration to Drizzle ORM pending
// export * from './database/SyncDatabaseService';
// Services
__exportStar(require("./services/AgentFlightRecorder"), exports);
__exportStar(require("./services/MasterClockService"), exports);
__exportStar(require("./services/WorkspaceMirrorService"), exports);
// Temporarily disabled - requires Drizzle-based SyncDatabaseService
// export * from './services/SyncOrchestrator';
// ConflictManager temporarily disabled - requires BaseErrorHandler refactoring
// export * from './services/ConflictManager';
// Watchers
// Temporarily disabled - requires Drizzle-based SyncDatabaseService
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
// Temporarily disabled - requires EnhancedFileSystemWatcher which uses Drizzle
// export * from './performance';
// This package provides the core infrastructure for multi-tenant synchronization
// integrating with existing Redis and database services
//# sourceMappingURL=index.js.map