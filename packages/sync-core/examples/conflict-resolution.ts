/**
 * Conflict Resolution Example
 *
 * Shows how to handle and resolve data conflicts when
 * multiple instances modify the same resource concurrently.
 */

import { Injectable } from '@nestjs/common';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator.js';
import { ConflictManager } from '../src/services/ConflictManager.js';

interface Document {
  id: string;
  title: string;
  content: string;
  version: number;
  lastModifiedBy: string;
  lastModifiedAt: Date;
}

@Injectable()
export class DocumentSyncService {
  constructor(
    private readonly syncOrchestrator: SyncOrchestrator,
    private readonly conflictManager: ConflictManager,
  ) {
    this.registerConflictResolvers();
  }

  /**
   * Register custom conflict resolution strategies
   */
  private registerConflictResolvers() {
    // Strategy 1: Latest wins (default)
    this.conflictManager.registerResolver(
      'document',
      'latest_wins',
      this.resolveByLatestTimestamp.bind(this)
    );

    // Strategy 2: Smart merge for documents
    this.conflictManager.registerResolver(
      'document',
      'smart_merge',
      this.smartMergeDocuments.bind(this)
    );

    // Strategy 3: Manual review queue
    this.conflictManager.registerResolver(
      'document',
      'manual',
      this.queueForManualReview.bind(this)
    );
  }

  /**
   * Update document with conflict detection
   */
  async updateDocument(
    documentId: string,
    updates: Partial<Document>,
    userId: string,
    tenantId: string
  ) {
    // Get current version
    const currentDoc = await this.getDocument(documentId);

    // Prepare new version
    const updatedDoc: Document = {
      ...currentDoc,
      ...updates,
      version: currentDoc.version + 1,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    };

    try {
      // Try to sync with version check
      await this.syncOrchestrator.syncTenantData(
        tenantId,
        'document',
        updatedDoc,
        {
          expectedVersion: currentDoc.version, // Conflict detection
        }
      );

      console.log(`Document ${documentId} updated successfully`);
      return updatedDoc;

    } catch (error) {
      if (error.code === 'VERSION_CONFLICT') {
        // Handle conflict
        return await this.handleConflict(
          documentId,
          currentDoc,
          updatedDoc,
          tenantId
        );
      }
      throw error;
    }
  }

  /**
   * Handle document conflict
   */
  private async handleConflict(
    documentId: string,
    localVersion: Document,
    remoteVersion: Document,
    tenantId: string
  ): Promise<Document> {
    console.log(`Conflict detected for document ${documentId}`);

    // Detect conflict type
    const conflictType = this.detectConflictType(localVersion, remoteVersion);

    let resolution: Document;

    switch (conflictType) {
      case 'SIMPLE_FIELD_CHANGE':
        // Use latest wins for simple changes
        resolution = await this.resolveByLatestTimestamp(
          localVersion,
          remoteVersion
        );
        break;

      case 'CONTENT_MODIFICATION':
        // Use smart merge for content changes
        resolution = await this.smartMergeDocuments(
          localVersion,
          remoteVersion
        );
        break;

      case 'COMPLEX_CONFLICT':
        // Queue for manual review
        resolution = await this.queueForManualReview(
          localVersion,
          remoteVersion
        );
        break;

      default:
        resolution = remoteVersion;
    }

    // Log conflict resolution
    await this.conflictManager.logConflict({
      resourceType: 'document',
      resourceId: documentId,
      tenantId,
      conflictType,
      localVersion,
      remoteVersion,
      resolution,
      resolvedAt: new Date(),
    });

    // Sync resolved version
    await this.syncOrchestrator.syncTenantData(
      tenantId,
      'document',
      resolution
    );

    return resolution;
  }

  /**
   * Detect conflict type
   */
  private detectConflictType(
    local: Document,
    remote: Document
  ): 'SIMPLE_FIELD_CHANGE' | 'CONTENT_MODIFICATION' | 'COMPLEX_CONFLICT' {
    // Both modified content
    if (local.content !== remote.content) {
      // Check if changes overlap
      const hasOverlap = this.checkContentOverlap(local.content, remote.content);
      return hasOverlap ? 'COMPLEX_CONFLICT' : 'CONTENT_MODIFICATION';
    }

    // Only metadata changed
    return 'SIMPLE_FIELD_CHANGE';
  }

  /**
   * Strategy 1: Resolve by latest timestamp
   */
  private async resolveByLatestTimestamp(
    local: Document,
    remote: Document
  ): Promise<Document> {
    console.log('Resolving conflict using latest timestamp');

    return local.lastModifiedAt > remote.lastModifiedAt ? local : remote;
  }

  /**
   * Strategy 2: Smart merge documents
   */
  private async smartMergeDocuments(
    local: Document,
    remote: Document
  ): Promise<Document> {
    console.log('Resolving conflict using smart merge');

    // Merge non-conflicting fields
    const merged: Document = {
      ...remote,
      version: Math.max(local.version, remote.version) + 1,
      lastModifiedAt: new Date(),
    };

    // Merge content if possible
    if (local.content !== remote.content) {
      merged.content = this.mergeContent(local.content, remote.content);
    }

    // Keep latest metadata
    if (local.lastModifiedAt > remote.lastModifiedAt) {
      merged.title = local.title;
      merged.lastModifiedBy = local.lastModifiedBy;
    }

    return merged;
  }

  /**
   * Strategy 3: Queue for manual review
   */
  private async queueForManualReview(
    local: Document,
    remote: Document
  ): Promise<Document> {
    console.log('Complex conflict - queuing for manual review');

    // Create conflict record
    await this.conflictManager.createConflictRecord({
      resourceType: 'document',
      resourceId: local.id,
      localVersion: local,
      remoteVersion: remote,
      status: 'PENDING_REVIEW',
      createdAt: new Date(),
    });

    // Notify admins
    await this.notifyAdmins(local.id, local, remote);

    // Return remote version temporarily (can be overridden after review)
    return remote;
  }

  /**
   * Merge document content using diff algorithm
   */
  private mergeContent(local: string, remote: string): string {
    // Simple line-based merge (in production, use proper diff library)
    const localLines = local.split('\n');
    const remoteLines = remote.split('\n');

    const merged: string[] = [];
    const maxLength = Math.max(localLines.length, remoteLines.length);

    for (let i = 0; i < maxLength; i++) {
      const localLine = localLines[i];
      const remoteLine = remoteLines[i];

      if (localLine === remoteLine) {
        merged.push(localLine);
      } else if (localLine && remoteLine) {
        // Both changed - mark conflict
        merged.push(`<<<<<<< LOCAL`);
        merged.push(localLine);
        merged.push(`=======`);
        merged.push(remoteLine);
        merged.push(`>>>>>>> REMOTE`);
      } else {
        // Only one side has content
        merged.push(localLine || remoteLine);
      }
    }

    return merged.join('\n');
  }

  /**
   * Check if content changes overlap
   */
  private checkContentOverlap(local: string, remote: string): boolean {
    // Simple check - in production use proper diff analysis
    const localWords = new Set(local.split(/\s+/));
    const remoteWords = new Set(remote.split(/\s+/));

    let overlap = 0;
    localWords.forEach(word => {
      if (remoteWords.has(word)) overlap++;
    });

    const overlapPercentage = overlap / Math.max(localWords.size, remoteWords.size);
    return overlapPercentage < 0.7; // Less than 70% overlap = complex conflict
  }

  /**
   * Notify admins of conflict requiring review
   */
  private async notifyAdmins(
    documentId: string,
    local: Document,
    remote: Document
  ) {
    // Send notification through notification service
    console.log(`Notifying admins of conflict for document ${documentId}`);

    // Implementation would use NotificationService
    // await this.notificationService.send({
    //   type: 'CONFLICT_REVIEW_REQUIRED',
    //   documentId,
    //   localVersion: local,
    //   remoteVersion: remote,
    // });
  }

  /**
   * Get document from database
   */
  private async getDocument(id: string): Promise<Document> {
    // Placeholder - implement with your database
    return null as any;
  }

  /**
   * Get conflict statistics
   */
  async getConflictStats(tenantId: string) {
    const metrics = this.syncOrchestrator.getMetrics();

    return {
      totalConflicts: metrics.operations.conflicts,
      conflictRate: metrics.performance.conflictRate,
      pendingReviews: await this.conflictManager.getPendingConflicts(tenantId),
    };
  }
}
