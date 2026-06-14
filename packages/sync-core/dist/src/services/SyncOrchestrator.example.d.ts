/**
 * SyncOrchestrator Usage Examples
 *
 * This file demonstrates how to use the SyncOrchestrator service
 * for multi-tenant synchronization across The New Fuse platform.
 */
import { SyncOrchestrator } from './SyncOrchestrator';
export declare class SyncOrchestratorExamples {
    private readonly syncOrchestrator;
    constructor(syncOrchestrator: SyncOrchestrator);
    /**
     * Example 1: Syncing Agent State Changes
     *
     * When an agent's status or configuration changes, sync it across
     * all instances and notify relevant users via WebSocket.
     */
    syncAgentStatusChange(): Promise<void>;
    /**
     * Example 2: Syncing Tenant-Specific Configuration
     *
     * When a user updates their workspace configuration, sync it
     * across all their active sessions.
     */
    syncTenantConfiguration(): Promise<void>;
    /**
     * Example 3: Syncing Global Prompt Templates
     *
     * When system-wide prompt templates are updated, sync them
     * across all tenants and instances.
     */
    syncGlobalPromptTemplates(): Promise<void>;
    /**
     * Example 4: Syncing Task Updates
     *
     * When tasks are created, updated, or completed, sync the changes
     * across all relevant users and systems.
     */
    syncTaskUpdates(): Promise<void>;
    /**
     * Example 5: Syncing Workflow State Changes
     *
     * When workflows are executed or their state changes, sync the
     * updates across all monitoring systems.
     */
    syncWorkflowStateChanges(): Promise<void>;
    /**
     * Example 6: Handling Sync Conflicts
     *
     * Demonstrate how to handle and resolve synchronization conflicts
     * when multiple instances modify the same resource simultaneously.
     */
    handleSyncConflicts(): Promise<void>;
    /**
     * Example 7: Monitoring Sync Operations
     *
     * Demonstrate how to monitor sync operations and system health.
     */
    monitorSyncOperations(): Promise<void>;
    /**
     * Example 8: Bulk Synchronization
     *
     * Demonstrate how to perform bulk synchronization operations
     * efficiently.
     */
    performBulkSync(): Promise<void>;
    /**
     * Example 9: Cross-Tenant Data Sharing
     *
     * Demonstrate controlled cross-tenant data sharing while
     * maintaining security and isolation.
     */
    shareCrossTenantData(): Promise<void>;
    /**
     * Example 10: Real-time Collaboration Sync
     *
     * Demonstrate real-time collaboration features with immediate
     * synchronization across all participants.
     */
    syncCollaborativeSession(): Promise<void>;
}
/**
 * Integration Example: Using SyncOrchestrator in a Service
 */
export declare class DocumentService {
    private readonly syncOrchestrator;
    constructor(syncOrchestrator: SyncOrchestrator);
    updateDocument(documentId: string, userId: string, changes: any): Promise<void>;
}
/**
 * Error Handling Example
 */
export declare class SyncErrorHandler {
    private readonly syncOrchestrator;
    constructor(syncOrchestrator: SyncOrchestrator);
    handleSyncWithRetry<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>;
}
//# sourceMappingURL=SyncOrchestrator.example.d.ts.map