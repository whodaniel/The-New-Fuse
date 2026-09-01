/**
 * Jules CLI Skill - Core Client
 * Programmatic interface to the Jules CLI
 */

import { execa, ExecaError } from 'execa';
import {
  BatchSubmissionResult,
  CreateSessionOptions,
  JulesCommandResult,
  JulesSession,
  JulesTaskTemplate,
  ListSessionsOptions,
  PullSessionOptions,
} from './types.js';

/**
 * Jules CLI Client
 * Provides a programmatic interface to interact with Google's Jules CLI
 */
export class JulesClient {
  private readonly cwd: string;

  constructor(options?: { cwd?: string }) {
    this.cwd = options?.cwd ?? process.cwd();
  }

  /**
   * Execute a Jules CLI command
   */
  private async execute(args: string[], input?: string): Promise<JulesCommandResult> {
    try {
      const result = await execa('jules', args, {
        cwd: this.cwd,
        input,
        timeout: 60000, // 1 minute timeout
      });

      return {
        success: true,
        stdout: String(result.stdout),
        stderr: String(result.stderr),
        exitCode: result.exitCode ?? 0,
      };
    } catch (error) {
      const execaError = error as ExecaError;
      return {
        success: false,
        stdout: String(execaError.stdout ?? ''),
        stderr: String(execaError.stderr ?? execaError.message),
        exitCode: execaError.exitCode ?? 1,
      };
    }
  }

  /**
   * Check if Jules CLI is available
   */
  async isAvailable(): Promise<boolean> {
    const result = await this.execute(['version']);
    return result.success;
  }

  /**
   * Get Jules CLI version
   */
  async getVersion(): Promise<string | null> {
    const result = await this.execute(['version']);
    return result.success ? result.stdout.trim() : null;
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    // Try to list sessions - will fail if not logged in
    const result = await this.execute(['remote', 'list', '--session']);
    return result.success;
  }

  /**
   * Create a new Jules session (submit a task)
   */
  async createSession(options: CreateSessionOptions): Promise<JulesSession> {
    const args = ['new'];

    if (options.repository) {
      args.push('--repo', options.repository);
    }

    if (options.parallel && options.parallel > 1) {
      args.push('--parallel', options.parallel.toString());
    }

    // Build the complete task with optional workspace context
    let fullTask = options.task;
    if (options.workspaceContext) {
      fullTask = `<workspace_context>\n${options.workspaceContext}\n</workspace_context>\n\n${options.task}`;
    }

    args.push(fullTask);

    const result = await this.execute(args);

    if (!result.success) {
      throw new Error(`Failed to create Jules session: ${result.stderr}`);
    }

    // Parse session ID from output (format varies)
    const sessionId = this.parseSessionIdFromOutput(result.stdout);

    return {
      id: sessionId,
      status: 'pending',
      repository: options.repository,
      task: options.task,
      createdAt: new Date(),
    };
  }

  /**
   * Create multiple sessions in parallel
   */
  async createSessions(tasks: CreateSessionOptions[]): Promise<BatchSubmissionResult> {
    const results: BatchSubmissionResult = {
      totalTasks: tasks.length,
      submitted: 0,
      failed: 0,
      sessions: [],
      errors: [],
    };

    // Submit in parallel with concurrency limit
    const concurrency = 4;
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const promises = batch.map(async (task) => {
        try {
          const session = await this.createSession(task);
          results.submitted++;
          results.sessions.push(session);
        } catch (error) {
          results.failed++;
          results.errors.push({
            task: task.task.substring(0, 100),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * List remote sessions
   */
  async listSessions(options?: ListSessionsOptions): Promise<JulesSession[]> {
    const args = ['remote', 'list', '--session'];

    const result = await this.execute(args);

    if (!result.success) {
      throw new Error(`Failed to list sessions: ${result.stderr}`);
    }

    return this.parseSessionList(result.stdout, options?.limit);
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<JulesSession | null> {
    const sessions = await this.listSessions();
    return sessions.find((s) => s.id === sessionId) ?? null;
  }

  /**
   * Pull session results
   */
  async pullSession(options: PullSessionOptions): Promise<JulesCommandResult> {
    const args = ['remote', 'pull', '--session', options.sessionId];

    if (options.apply) {
      args.push('--apply');
    }

    return this.execute(args);
  }

  /**
   * Teleport to a session (clone + checkout + apply patch)
   */
  async teleport(sessionId: string): Promise<JulesCommandResult> {
    return this.execute(['teleport', sessionId]);
  }

  /**
   * List available repositories
   */
  async listRepositories(): Promise<string[]> {
    const result = await this.execute(['remote', 'list', '--repo']);

    if (!result.success) {
      return [];
    }

    // Parse repository list from output
    return result.stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.trim());
  }

  /**
   * Submit a task from a template
   */
  async submitTemplate(
    template: JulesTaskTemplate,
    options?: { repository?: string }
  ): Promise<JulesSession> {
    const fullTask = this.buildTaskFromTemplate(template);
    return this.createSession({
      task: fullTask,
      repository: options?.repository,
      workspaceContext: template.workspaceContext,
    });
  }

  /**
   * Build a task string from a template
   */
  private buildTaskFromTemplate(template: JulesTaskTemplate): string {
    return `<instruction>You are an expert software engineer. You are working on a WIP branch. Please run \`git status\` and \`git diff\` to understand the changes and the current state of the code. Analyze the workspace context and complete the mission brief.</instruction>
${template.workspaceContext ? `<workspace_context>\n${template.workspaceContext}\n</workspace_context>` : ''}
<mission_brief>
## Task: ${template.name}

${template.instruction}
</mission_brief>`;
  }

  /**
   * Parse session ID from jules new output
   */
  private parseSessionIdFromOutput(output: string): string {
    // Try to find session ID in various formats
    const patterns = [/session[:\s]+(\d+)/i, /id[:\s]+(\d+)/i, /created[:\s]+(\d+)/i, /(\d{6,})/];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Generate a temporary ID if we can't parse one
    return `temp-${Date.now()}`;
  }

  /**
   * Parse session list from CLI output
   */
  private parseSessionList(output: string, limit?: number): JulesSession[] {
    const sessions: JulesSession[] = [];
    const lines = output.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      // Parse each line - format may vary
      const session = this.parseSessionLine(line);
      if (session) {
        sessions.push(session);
        if (limit && sessions.length >= limit) {
          break;
        }
      }
    }

    return sessions;
  }

  /**
   * Parse a single session line
   */
  private parseSessionLine(line: string): JulesSession | null {
    // Try to extract session info from line
    // Format varies but typically includes: ID, status, repo, task
    const parts = line.split(/\s{2,}|\t/);

    if (parts.length >= 2) {
      return {
        id: parts[0]?.trim() || 'unknown',
        status: this.parseStatus(parts[1] || ''),
        repository: parts[2]?.trim(),
        task: parts.slice(3).join(' ').trim() || 'No description',
        createdAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Parse status string to enum
   */
  private parseStatus(
    status: string
  ): 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' {
    const normalized = status.toLowerCase().trim();
    if (normalized.includes('complete') || normalized.includes('done')) {
      return 'completed';
    }
    if (normalized.includes('run') || normalized.includes('progress')) {
      return 'running';
    }
    if (normalized.includes('fail') || normalized.includes('error')) {
      return 'failed';
    }
    if (normalized.includes('cancel')) {
      return 'cancelled';
    }
    return 'pending';
  }
}

// Export singleton instance
export const julesClient = new JulesClient();
