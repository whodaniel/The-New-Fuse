export interface SyncStateData {
  id: string;
  resourceType: string;
  resourceId: string;
  tenantId?: string;
  version: number;
  checksum: string;
  lastSync: Date;
  syncedBy: string;
  metadata?: Record<string, any>;
}

export interface SyncConflictData {
  id: string;
  resourceType: string;
  resourceId: string;
  tenantId?: string;
  conflictType: 'version' | 'checksum' | 'concurrent';
  localVersion: any;
  remoteVersion: any;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: any;
  createdAt: Date;
}

export interface FileChangeEvent {
  type: 'create' | 'update' | 'delete';
  filePath: string;
  tenantId?: string;
  timestamp: Date;
  checksum: string;
  metadata?: Record<string, any>;
}

export interface ClockSyncData {
  instanceId: string;
  timestamp: Date;
  drift: number;
  lastSync: Date;
}

export interface SyncOperation {
  id: string;
  type: 'sync' | 'conflict_resolution' | 'file_change';
  resourceType: string;
  resourceId: string;
  tenantId?: string;
  data: any;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledAt?: Date;
}

export interface TenantSyncContext {
  tenantId: string;
  userId?: string;
  permissions: string[];
  isolationLevel: 'strict' | 'controlled' | 'shared';
}

export interface SyncMetrics {
  operations: {
    sync: number;
    conflicts: number;
    fileChanges: number;
    clockSync: number;
  };
  performance: {
    avgSyncLatency: number;
    maxSyncLatency: number;
    conflictRate: number;
    successRate: number;
  };
  resources: {
    activeTenants: number;
    watchedFiles: number;
    syncedResources: number;
    pendingOperations: number;
  };
}

export interface SyncHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  clockSync: {
    status: 'synced' | 'drift' | 'failed';
    maxDrift: number;
    instances: number;
  };
  fileWatchers: {
    status: 'active' | 'partial' | 'failed';
    watchedPaths: number;
    failedWatchers: number;
  };
  conflicts: {
    pending: number;
    resolved: number;
    failed: number;
  };
  lastCheck: Date;
}

export type SyncResourceType =
  | 'agent'
  | 'template'
  | 'config'
  | 'task'
  | 'workflow'
  | 'user'
  | 'file'
  | 'personal_content'
  | 'content_shared'
  | 'project_collaboration'
  | 'content_sharing_revoked'
  | 'project_collaboration_removed'
  | 'collaboration_permissions_updated'
  | 'personal_content_deleted'
  | 'privacy_boundary'
  | 'content_isolated'
  | 'project_configuration'
  | 'configuration_file'
  | 'enhanced_handoff_template'
  | 'handoff_session'
  | 'handoff_context'
  | 'handoff_template'
  | 'handoff_metrics'
  | 'agent_capability'
  | 'template_integration';

export type ConflictResolutionStrategy = 'latest_wins' | 'manual' | 'merge' | 'rollback';

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  resolvedData: any;
  metadata?: Record<string, any>;
}
