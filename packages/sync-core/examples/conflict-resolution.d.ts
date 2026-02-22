/**
 * Conflict Resolution Example
 *
 * Shows how to handle and resolve data conflicts when
 * multiple instances modify the same resource concurrently.
 */
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';
import { ConflictManager } from '../src/services/ConflictManager';
interface Document {
    id: string;
    title: string;
    content: string;
    version: number;
    lastModifiedBy: string;
    lastModifiedAt: Date;
}
export declare class DocumentSyncService {
    private readonly syncOrchestrator;
    private readonly conflictManager;
    constructor(syncOrchestrator: SyncOrchestrator, conflictManager: ConflictManager);
    /**
     * Register custom conflict resolution strategies
     */
    private registerConflictResolvers;
    /**
     * Update document with conflict detection
     */
    updateDocument(documentId: string, updates: Partial<Document>, userId: string, tenantId: string): Promise<Document>;
    /**
     * Handle document conflict
     */
    private handleConflict;
    /**
     * Detect conflict type
     */
    private detectConflictType;
    /**
     * Strategy 1: Resolve by latest timestamp
     */
    private resolveByLatestTimestamp;
    /**
     * Strategy 2: Smart merge documents
     */
    private smartMergeDocuments;
    /**
     * Strategy 3: Queue for manual review
     */
    private queueForManualReview;
    /**
     * Merge document content using diff algorithm
     */
    private mergeContent;
    /**
     * Check if content changes overlap
     */
    private checkContentOverlap;
    /**
     * Notify admins of conflict requiring review
     */
    private notifyAdmins;
    /**
     * Get document from database
     */
    private getDocument;
    /**
     * Get conflict statistics
     */
    getConflictStats(tenantId: string): Promise<{
        totalConflicts: number;
        conflictRate: number;
        pendingReviews: {
            id: string;
            createdAt: Date;
            tenantId: string | null;
            conflictType: string;
            localVersion: import("@the-new-fuse/database/generated/drizzle/runtime/library").JsonValue;
            remoteVersion: import("@the-new-fuse/database/generated/drizzle/runtime/library").JsonValue;
            resourceType: string;
            resourceId: string;
            resolvedAt: Date | null;
            resolvedBy: string | null;
            resolution: import("@the-new-fuse/database/generated/drizzle/runtime/library").JsonValue | null;
        }[];
    }>;
}
export {};
//# sourceMappingURL=conflict-resolution.d.ts.map