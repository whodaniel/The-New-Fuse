/**
 * Jules CLI Skill - Types
 * Type definitions for Jules CLI integration
 */

/**
 * Jules session status
 */
export type JulesSessionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Jules session information
 */
export interface JulesSession {
  id: string;
  status: JulesSessionStatus;
  repository?: string;
  task: string;
  createdAt: Date;
  completedAt?: Date;
  patchUrl?: string;
  error?: string;
}

/**
 * Options for creating a new Jules session
 */
export interface CreateSessionOptions {
  /** The task/prompt to send to Jules */
  task: string;
  /** Repository in format "owner/repo" (defaults to current directory's repo) */
  repository?: string;
  /** Number of parallel sessions to create with the same task */
  parallel?: number;
  /** Custom workspace context to prepend to the task */
  workspaceContext?: string;
}

/**
 * Options for listing sessions
 */
export interface ListSessionsOptions {
  /** Maximum number of sessions to fetch */
  limit?: number;
  /** Filter by status */
  status?: JulesSessionStatus;
}

/**
 * Options for pulling session results
 */
export interface PullSessionOptions {
  /** Session ID to pull */
  sessionId: string;
  /** Whether to apply the patch to the local repository */
  apply?: boolean;
}

/**
 * Result of a Jules CLI command
 */
export interface JulesCommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Parsed session from list output
 */
export interface ParsedSession {
  id: string;
  status: string;
  repository: string;
  task: string;
  createdAt: string;
}

/**
 * Task template for Jules
 */
export interface JulesTaskTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this task does */
  description: string;
  /** Category (e.g., 'database', 'frontend', 'backend', 'security') */
  category: string;
  /** The task content/instructions */
  instruction: string;
  /** Optional workspace context */
  workspaceContext?: string;
  /** Estimated complexity (1-5) */
  complexity?: number;
  /** Tags for filtering */
  tags?: string[];
}

/**
 * Batch submission result
 */
export interface BatchSubmissionResult {
  totalTasks: number;
  submitted: number;
  failed: number;
  sessions: JulesSession[];
  errors: Array<{ task: string; error: string }>;
}
