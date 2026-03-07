/**
 * Queue names for Bull job processing
 */
export enum QueueName {
  EMAIL = 'email',
  AGENT_EXECUTION = 'agent-execution',
  REPORT_GENERATION = 'report-generation',
  DATA_SYNC = 'data-sync',
  CLEANUP = 'cleanup',
}

/**
 * Job priority levels
 */
export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

/**
 * Job attempt settings
 */
export const JOB_ATTEMPTS = {
  EMAIL: 3,
  AGENT_EXECUTION: 2,
  REPORT_GENERATION: 3,
  DATA_SYNC: 5,
  CLEANUP: 2,
};

/**
 * Job backoff settings (in milliseconds)
 */
export const JOB_BACKOFF = {
  EMAIL: 5000, // 5 seconds
  AGENT_EXECUTION: 10000, // 10 seconds
  REPORT_GENERATION: 15000, // 15 seconds
  DATA_SYNC: 30000, // 30 seconds
  CLEANUP: 60000, // 1 minute
};
