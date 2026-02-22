/**
 * SyncOrchestrator Usage Examples
 * 
 * This file demonstrates how to use the SyncOrchestrator service
 * for multi-tenant synchronization across The New Fuse platform.
 */

import { SyncOrchestrator, AgentState } from './SyncOrchestrator';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { DrizzleService } from '@the-new-fuse/database';
import { PromptTemplateServiceImpl } from '@the-new-fuse/prompt-templating';

// Example: Setting up SyncOrchestrator in a NestJS module
export class SyncOrchestratorExamples {
  constructor(
    private readonly syncOrchestrator: SyncOrchestrator
  ) {}

  /**
   * Example 1: Syncing Agent State Changes
   * 
   * When an agent's status or configuration changes, sync it across
   * all instances and notify relevant users via WebSocket.
   */
  async syncAgentStatusChange(): Promise<void> {
    const agentState: AgentState = {
      id: 'agent-123',
      status: 'PROCESSING',
      metadata: {
        currentTask: 'analyzing-document',
        progress: 45,
        estimatedCompletion: new Date(Date.now() + 300000) // 5 minutes
      },
      lastUpdate: new Date()
    };

    try {
      await this.syncOrchestrator.syncAgentState('agent-123', agentState);
      console.log('Agent state synchronized successfully');
    } catch (error) {
      console.error('Failed to sync agent state:', error);
    }
  }

  /**
   * Example 2: Syncing Tenant-Specific Configuration
   * 
   * When a user updates their workspace configuration, sync it
   * across all their active sessions.
   */
  async syncTenantConfiguration(): Promise<void> {
    const tenantId = 'tenant-456';
    const configData = {
      id: 'workspace-config-1',
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: false,
        desktop: true
      },
      preferences: {
        autoSave: true,
        collaborativeMode: true,
        aiAssistance: 'enhanced'
      },
      updatedAt: new Date()
    };

    try {
      await this.syncOrchestrator.syncTenantData(
        tenantId,
        'config',
        configData
      );
      console.log('Tenant configuration synchronized');
    } catch (error) {
      console.error('Failed to sync tenant configuration:', error);
    }
  }

  /**
   * Example 3: Syncing Global Prompt Templates
   * 
   * When system-wide prompt templates are updated, sync them
   * across all tenants and instances.
   */
  async syncGlobalPromptTemplates(): Promise<void> {
    const templates = [
      {
        id: 'template-1',
        name: 'Code Review Assistant',
        description: 'Template for AI-assisted code reviews',
        content: `You are a senior software engineer reviewing code.

# Task
Review the following code for:
- Code quality and best practices
- Security vulnerabilities
- Performance issues
- Maintainability concerns

# Code to Review
{{code_content}}

# Context
{{context_information}}

# Output Format
Provide structured feedback with:
1. Overall assessment
2. Specific issues found
3. Recommendations for improvement`,
        variables: {
          code_content: '',
          context_information: ''
        },
        category: 'Development',
        tags: ['code-review', 'development', 'quality'],
        isPublic: true,
        updatedAt: new Date()
      },
      {
        id: 'template-2',
        name: 'Document Summarizer',
        description: 'Template for document summarization',
        content: `You are an expert at creating concise, accurate summaries.

# Task
Create a comprehensive summary of the following document:

{{document_content}}

# Requirements
- Maximum {{max_length}} words
- Include key points and main conclusions
- Maintain factual accuracy
- Use clear, professional language

# Focus Areas
{{focus_areas}}`,
        variables: {
          document_content: '',
          max_length: '500',
          focus_areas: 'Key findings, recommendations, conclusions'
        },
        category: 'Content',
        tags: ['summarization', 'content', 'analysis'],
        isPublic: true,
        updatedAt: new Date()
      }
    ];

    try {
      await this.syncOrchestrator.syncPromptTemplates(templates);
      console.log('Global prompt templates synchronized');
    } catch (error) {
      console.error('Failed to sync prompt templates:', error);
    }
  }

  /**
   * Example 4: Syncing Task Updates
   * 
   * When tasks are created, updated, or completed, sync the changes
   * across all relevant users and systems.
   */
  async syncTaskUpdates(): Promise<void> {
    const taskData = {
      id: 'task-789',
      title: 'Implement user authentication',
      description: 'Add JWT-based authentication to the API',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignedTo: 'user-123',
      projectId: 'project-456',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      progress: 60,
      metadata: {
        estimatedHours: 16,
        actualHours: 10,
        blockers: [],
        dependencies: ['task-788']
      },
      updatedAt: new Date()
    };

    try {
      // Sync to the assignee's tenant
      await this.syncOrchestrator.syncTenantData(
        'user-123', // tenant ID (user ID in this case)
        'task',
        taskData
      );
      console.log('Task updates synchronized');
    } catch (error) {
      console.error('Failed to sync task updates:', error);
    }
  }

  /**
   * Example 5: Syncing Workflow State Changes
   * 
   * When workflows are executed or their state changes, sync the
   * updates across all monitoring systems.
   */
  async syncWorkflowStateChanges(): Promise<void> {
    const workflowData = {
      id: 'workflow-101',
      name: 'Document Processing Pipeline',
      status: 'RUNNING',
      currentStep: 'text-extraction',
      totalSteps: 5,
      progress: 40,
      startedAt: new Date(Date.now() - 120000), // 2 minutes ago
      estimatedCompletion: new Date(Date.now() + 180000), // 3 minutes from now
      metadata: {
        inputDocument: 'document-456.pdf',
        processingNodes: ['node-1', 'node-3'],
        resourceUsage: {
          cpu: 45,
          memory: 512,
          storage: 1024
        }
      },
      updatedAt: new Date()
    };

    try {
      await this.syncOrchestrator.syncGlobalData('workflow', workflowData);
      console.log('Workflow state synchronized');
    } catch (error) {
      console.error('Failed to sync workflow state:', error);
    }
  }

  /**
   * Example 6: Handling Sync Conflicts
   * 
   * Demonstrate how to handle and resolve synchronization conflicts
   * when multiple instances modify the same resource simultaneously.
   */
  async handleSyncConflicts(): Promise<void> {
    // This would typically be called automatically by the sync system
    // when conflicts are detected, but can also be triggered manually
    
    const conflict = {
      id: 'conflict-123',
      resourceType: 'agent',
      resourceId: 'agent-456',
      tenantId: 'tenant-789',
      conflictType: 'concurrent' as const,
      localVersion: {
        status: 'IDLE',
        lastUpdate: '2024-01-15T10:30:00Z',
        metadata: { currentTask: null }
      },
      remoteVersion: {
        status: 'PROCESSING',
        lastUpdate: '2024-01-15T10:30:05Z',
        metadata: { currentTask: 'document-analysis' }
      },
      createdAt: new Date()
    };

    try {
      const resolution = await this.syncOrchestrator.resolveConflict(conflict);
      
      if (resolution.strategy === 'manual') {
        console.log('Conflict queued for manual resolution');
        // Notify administrators or relevant users
      } else {
        console.log(`Conflict resolved using ${resolution.strategy} strategy`);
        console.log('Resolved data:', resolution.resolvedData);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }

  /**
   * Example 7: Monitoring Sync Operations
   * 
   * Demonstrate how to monitor sync operations and system health.
   */
  async monitorSyncOperations(): Promise<void> {
    try {
      // Get current metrics
      const metrics = this.syncOrchestrator.getMetrics();
      console.log('Sync Metrics:', {
        totalSyncOperations: metrics.operations.sync,
        conflictsResolved: metrics.operations.conflicts,
        averageLatency: `${metrics.performance.avgSyncLatency}ms`,
        successRate: `${metrics.performance.successRate}%`,
        activeTenants: metrics.resources.activeTenants,
        pendingOperations: metrics.resources.pendingOperations
      });

      // Get active tenants
      const activeTenants = this.syncOrchestrator.getActiveTenants();
      console.log('Active Tenants:', activeTenants);

      // Get active operations
      const activeOperations = await this.syncOrchestrator.getActiveOperations();
      console.log('Active Operations:', activeOperations.length);

      // Get specific tenant context
      if (activeTenants.length > 0) {
        const tenantContext = await this.syncOrchestrator.getTenantContext(activeTenants[0]);
        console.log('Sample Tenant Context:', tenantContext);
      }
    } catch (error) {
      console.error('Failed to get sync monitoring data:', error);
    }
  }

  /**
   * Example 8: Bulk Synchronization
   * 
   * Demonstrate how to perform bulk synchronization operations
   * efficiently.
   */
  async performBulkSync(): Promise<void> {
    const tenantId = 'tenant-bulk-123';
    
    // Bulk sync multiple agents
    const agents = [
      { id: 'agent-1', status: 'ACTIVE', metadata: { type: 'chat' } },
      { id: 'agent-2', status: 'IDLE', metadata: { type: 'analysis' } },
      { id: 'agent-3', status: 'PROCESSING', metadata: { type: 'generation' } }
    ];

    try {
      // Sync agents in parallel
      const syncPromises = agents.map(agent =>
        this.syncOrchestrator.syncTenantData(tenantId, 'agent', agent)
      );

      await Promise.all(syncPromises);
      console.log(`Bulk synchronized ${agents.length} agents`);
    } catch (error) {
      console.error('Failed to perform bulk sync:', error);
    }
  }

  /**
   * Example 9: Cross-Tenant Data Sharing
   * 
   * Demonstrate controlled cross-tenant data sharing while
   * maintaining security and isolation.
   */
  async shareCrossTenantData(): Promise<void> {
    // Share a public template across multiple tenants
    const sharedTemplate = {
      id: 'shared-template-1',
      name: 'Public API Documentation Generator',
      description: 'Generate API documentation from code',
      content: `Generate comprehensive API documentation for the following code:

{{api_code}}

Include:
- Endpoint descriptions
- Parameter details
- Response formats
- Example requests/responses
- Error codes`,
      variables: {
        api_code: ''
      },
      category: 'Documentation',
      tags: ['api', 'documentation', 'public'],
      isPublic: true,
      sharedWith: ['tenant-1', 'tenant-2', 'tenant-3'],
      updatedAt: new Date()
    };

    try {
      // Sync as global data (available to all tenants)
      await this.syncOrchestrator.syncGlobalData('template', sharedTemplate);
      console.log('Cross-tenant template shared successfully');
    } catch (error) {
      console.error('Failed to share cross-tenant data:', error);
    }
  }

  /**
   * Example 10: Real-time Collaboration Sync
   * 
   * Demonstrate real-time collaboration features with immediate
   * synchronization across all participants.
   */
  async syncCollaborativeSession(): Promise<void> {
    const sessionData = {
      id: 'collab-session-1',
      type: 'document-editing',
      participants: ['user-1', 'user-2', 'user-3'],
      document: {
        id: 'doc-123',
        title: 'Project Requirements',
        content: 'Updated content with collaborative changes...',
        version: 15,
        lastModifiedBy: 'user-2',
        lastModified: new Date()
      },
      cursors: {
        'user-1': { line: 10, column: 25 },
        'user-2': { line: 15, column: 8 },
        'user-3': { line: 22, column: 12 }
      },
      selections: {
        'user-1': { start: { line: 10, column: 20 }, end: { line: 10, column: 35 } }
      },
      metadata: {
        sessionStarted: new Date(Date.now() - 1800000), // 30 minutes ago
        activeUsers: 3,
        totalChanges: 47
      }
    };

    try {
      // Sync to all participant tenants
      for (const participantId of sessionData.participants) {
        await this.syncOrchestrator.syncTenantData(
          participantId,
          'config', // Using config type for session data
          sessionData
        );
      }
      console.log('Collaborative session synchronized to all participants');
    } catch (error) {
      console.error('Failed to sync collaborative session:', error);
    }
  }
}

/**
 * Integration Example: Using SyncOrchestrator in a Service
 */
export class DocumentService {
  constructor(
    private readonly syncOrchestrator: SyncOrchestrator
  ) {}

  async updateDocument(documentId: string, userId: string, changes: any): Promise<void> {
    // Update document in database
    // ... database update logic ...

    // Sync changes to all relevant users
    const documentData = {
      id: documentId,
      ...changes,
      lastModifiedBy: userId,
      lastModified: new Date()
    };

    // Sync to the user's tenant
    await this.syncOrchestrator.syncTenantData(userId, 'file', documentData);

    // If document is shared, sync to collaborators
    if (changes.collaborators) {
      for (const collaboratorId of changes.collaborators) {
        await this.syncOrchestrator.syncTenantData(
          collaboratorId,
          'file',
          documentData
        );
      }
    }
  }
}

/**
 * Error Handling Example
 */
export class SyncErrorHandler {
  constructor(
    private readonly syncOrchestrator: SyncOrchestrator
  ) {}

  async handleSyncWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Sync attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Sync failed after ${maxRetries} attempts: ${lastError.message}`);
  }
}