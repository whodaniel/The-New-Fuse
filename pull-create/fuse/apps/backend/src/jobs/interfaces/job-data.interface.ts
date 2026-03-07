/**
 * Base interface for all job data
 */
export interface BaseJobData {
  userId?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

/**
 * Email job data
 */
export interface EmailJobData extends BaseJobData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, any>;
  from?: string;
}

/**
 * Welcome email job data
 */
export interface WelcomeEmailJobData extends BaseJobData {
  userId: string;
  email: string;
  name: string;
}

/**
 * Notification email job data
 */
export interface NotificationEmailJobData extends BaseJobData {
  userId: string;
  email: string;
  notificationType: string;
  data: Record<string, any>;
}

/**
 * Agent execution job data
 */
export interface AgentExecutionJobData extends BaseJobData {
  agentId: string;
  userId: string;
  task: string;
  parameters?: Record<string, any>;
  timeout?: number;
  priority?: number;
}

/**
 * Report generation job data
 */
export interface ReportGenerationJobData extends BaseJobData {
  reportType: string;
  userId: string;
  parameters: Record<string, any>;
  format?: 'pdf' | 'csv' | 'xlsx' | 'json';
  emailOnComplete?: boolean;
  email?: string;
}

/**
 * Data synchronization job data
 */
export interface DataSyncJobData extends BaseJobData {
  source: string;
  destination: string;
  syncType: 'full' | 'incremental';
  entityType?: string;
  filters?: Record<string, any>;
}

/**
 * Cleanup job data
 */
export interface CleanupJobData extends BaseJobData {
  cleanupType: 'old_sessions' | 'temp_files' | 'expired_tokens' | 'old_logs';
  olderThan?: number; // Days
  batchSize?: number;
}
