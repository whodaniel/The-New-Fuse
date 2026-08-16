/**
 * Orchestration Enhancements v2.1
 * Adds to the v2.0 orchestrator:
 *  1. Real execution via Redis (pushes to worker queues)
 *  2. Self-improvement feedback loop
 *  3. Comprehensive skill scanning for all 128 skills
 *  4. A2 REPORT_ONLY classifier re-exports
 */

export {
  REPORT_ONLY_GOAL_RE,
  REPORT_ONLY_MUTATE_EXPLICIT_RE,
  classifyOrchestrateIntent,
  extractReportOutputPath,
} from './orchestration-intent.js';

import fs from 'fs';
import { readFile, readdir } from 'fs/promises';
import { Redis } from 'ioredis';
import path from 'path';

// ============================================================================
// 1. REAL WORKER DISPATCHER
//    Pushes tasks to Redis queues that cron workers consume
// ============================================================================

export interface WorkerDispatch {
  id: string; // Unique task ID
  skillRef: string; // Which skill to invoke
  goal: string; // Original goal text
  payload: Record<string, any>;
  capability: string; // 'code' or 'infra' for routing
  createdAt: string;
  priority: number; // Lower = higher priority
  /** Tenant scope for federated broker dispatch (Phase: goal→broker rewire) */
  tenantId?: string;
  /** Workspace scope for federated broker dispatch */
  workspaceId?: string;
}

export class WorkerDispatcher {
  private redis: Redis;

  constructor(redisOptions?: { host?: string; port?: number }) {
    this.redis = new Redis({
      host: redisOptions?.host || process.env.REDIS_HOST || '127.0.0.1',
      port: redisOptions?.port || parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  /** Push a task to a worker's direct queue */
  async dispatchToWorker(workerId: string, task: WorkerDispatch): Promise<void> {
    const queueKey = `tnf:direct:sub-director:${workerId}`;
    const payload = JSON.stringify(task);
    await this.redis.lpush(queueKey, payload);
    console.log(`Dispatched task ${task.id} to worker queue ${queueKey}`);
  }

  /** Route by capability to the right worker */
  async dispatchByCapability(task: WorkerDispatch): Promise<void> {
    const capabilityMap: Record<string, string> = {
      code: 'agent_hermes-codegen-worker_1782364000001',
      infra: 'agent_hermes-infra-worker_1782364000002',
    };

    const workerId = capabilityMap[task.capability];
    if (!workerId) {
      console.warn(`Unknown capability ${task.capability}; defaulting to codegen worker`);
      await this.dispatchToWorker(capabilityMap['code']!, task);
      return;
    }

    await this.dispatchToWorker(workerId, task);
  }

  /**
   * Dispatch a task through the federated broker queue
   * (`tnf:master:tasks:realtime`) instead of bypassing it with hardcoded
   * worker queues. The broker evaluates `itinerary.lane` + tenant scope +
   * federation gates, does live agent discovery, and routes to the right
   * worker via pub/sub. This closes the "goals don't reach the fleet" gap:
   * `tnf orchestrate <goal>` now flows through the same verified
   * broker → WorkerEnvelope chain as every other task.
   *
   * Falls back to `dispatchByCapability()` if the broker queue is unreachable
   * (Redis down, connection refused) so the orchestrator degrades gracefully
   * rather than hard-failing on infrastructure availability.
   */
  async dispatchToBroker(task: WorkerDispatch): Promise<boolean> {
    const brokerQueue = 'tnf:master:tasks:realtime';

    // Shape the task as a QueueTask matching the broker's expected schema
    // (see packages/relay-core/src/broker-agent.ts:19).
    const queueTask = {
      id: task.id,
      title: task.goal,
      description: `Orchestrated goal task: ${task.goal} (capability: ${task.capability}, skill: ${task.skillRef})`,
      priority: task.priority <= 1 ? 'critical' : task.priority <= 2 ? 'high' : 'normal',
      requiredCapabilities: [task.capability],
      // itinerary.lane is mandatory — the broker denies dispatch without it
      // ("Missing itinerary lane for dispatch governance", broker-agent.ts:983).
      itinerary: {
        lane: 'goal',
        source: 'tnf-orchestrate',
        skillRef: task.skillRef,
        capability: task.capability,
      },
      // Tenant scope: the broker extracts tenantId from metadata.scope or
      // top-level metadata.tenantId (broker-agent.ts:491-498).
      metadata: {
        scope: task.tenantId ? { tenantId: task.tenantId, tenant_id: task.tenantId } : {},
        workspaceId: task.workspaceId || process.env.TNF_WORKSPACE_ID || undefined,
        payload: task.payload,
        createdAt: task.createdAt,
        source: 'tnf-orchestrate',
      },
    };

    try {
      const payload = JSON.stringify(queueTask);
      await this.redis.lpush(brokerQueue, payload);
      console.log(
        `Dispatched task ${task.id} to broker queue ${brokerQueue} ` +
          `(lane: goal, tenant: ${task.tenantId || 'default'})`
      );
      return true;
    } catch (err: any) {
      console.warn(
        `Broker dispatch failed (${err?.message ?? err}); falling back to direct worker queue`
      );
      // Degrade to the hardcoded direct-dispatch path (the pre-rewire behavior)
      await this.dispatchByCapability(task);
      return false;
    }
  }

  /** Get queue depth for monitoring */
  async getQueueDepth(workerId: string): Promise<number> {
    const queueKey = `tnf:direct:sub-director:${workerId}`;
    return this.redis.llen(queueKey);
  }

  /** List all pending work across all workers */
  async listPending(): Promise<Record<string, number>> {
    const workers = [
      'agent_hermes-codegen-worker_1782364000001',
      'agent_hermes-infra-worker_1782364000002',
    ];
    const result: Record<string, number> = {};
    for (const w of workers) {
      result[w] = await this.getQueueDepth(w);
    }
    return result;
  }

  async disconnect() {
    await this.redis.disconnect();
  }
}

// ============================================================================
// 2. SELF-IMPROVEMENT FEEDBACK LOOP
//    Logs outcomes to .learnings/ for continuous improvement
// ============================================================================

export interface LearningEntry {
  timestamp: string;
  category: 'success' | 'failure' | 'correction' | 'best_practice' | 'knowledge_gap';
  goal: string;
  taskId: string;
  details: string;
  suggestedFix?: string;
}

const LEARNINGS_DIR = '.learnings';

export class SelfImprovementTracker {
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.ensureDir();
  }

  private ensureDir(): void {
    const dir = path.join(this.repoRoot, LEARNINGS_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /** Log an outcome for learning */
  async log(entry: LearningEntry): Promise<void> {
    const fileMap: Record<string, string> = {
      success: 'SUCCESSES.md',
      failure: 'ERRORS.md',
      correction: 'LEARNINGS.md',
      best_practice: 'LEARNINGS.md',
      knowledge_gap: 'LEARNINGS.md',
    };

    const file = fileMap[entry.category] || 'LEARNINGS.md';
    const filePath = path.join(this.repoRoot, LEARNINGS_DIR, file);

    const logLine = `## ${entry.timestamp}\n- **Goal**: ${entry.goal}\n- **Task**: ${entry.taskId}\n- **Category**: ${entry.category}\n- **Details**: ${entry.details}\n`;

    if (entry.suggestedFix) {
      fs.appendFileSync(filePath, `${logLine}- **Suggested Fix**: ${entry.suggestedFix}\n\n`);
    } else {
      fs.appendFileSync(filePath, `${logLine}\n`);
    }

    console.log(`[Self-Improvement] Logged ${entry.category} to .learnings/${file}`);
  }

  /** Log a successful task completion */
  async logSuccess(goal: string, taskId: string, details: string): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      category: 'success',
      goal,
      taskId,
      details,
    });
  }

  /** Log a task failure for later analysis */
  async logFailure(
    goal: string,
    taskId: string,
    details: string,
    suggestedFix?: string
  ): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      category: 'failure',
      goal,
      taskId,
      details,
      suggestedFix,
    });
  }

  /** Read all recent learnings */
  async getRecentLearnings(limit: number = 10): Promise<LearningEntry[]> {
    const entries: LearningEntry[] = [];
    for (const file of ['SUCCESSES.md', 'ERRORS.md', 'LEARNINGS.md']) {
      const filePath = path.join(this.repoRoot, LEARNINGS_DIR, file);
      if (fs.existsSync(filePath)) {
        // Parse markdown entries (simplified)
        const content = await readFile(filePath, 'utf-8');
        // Extract timestamps and basic info
        const timestamps = content.match(/## .+/g) || [];
        for (const ts of timestamps.slice(-Math.ceil(limit / 3))) {
          entries.push({
            timestamp: ts.replace('## ', ''),
            category: file === 'ERRORS.md' ? 'failure' : 'best_practice',
            goal: 'unknown',
            taskId: 'unknown',
            details: `From ${file}`,
          });
        }
      }
    }
    return entries.slice(-limit);
  }
}

// ============================================================================
// 3. COMPREHENSIVE SKILL SCANNER
//    Maps all 128 skills to goal discovery patterns
// ============================================================================

export interface SkillPattern {
  skillName: string;
  triggers: string[];
  confidence: number;
}

export class ComprehensiveSkillScanner {
  private skillsPath: string;
  private patterns: SkillPattern[] = [];

  constructor(repoRoot: string) {
    this.skillsPath = path.join(repoRoot, '.agent', 'skills');
  }

  /** Scan ALL skills and extract trigger patterns */
  async scanAll(): Promise<SkillPattern[]> {
    const patterns: SkillPattern[] = [];
    try {
      const entries = await readdir(this.skillsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pattern = await this.extractPattern(entry.name);
          if (pattern) {
            patterns.push(pattern);
          }
        }
      }
    } catch (err) {
      // Skills directory may not exist
    }
    this.patterns = patterns;
    return patterns;
  }

  private async extractPattern(dirName: string): Promise<SkillPattern | null> {
    try {
      const skillPath = path.join(this.skillsPath, dirName, 'SKILL.md');
      const content = await readFile(skillPath, 'utf-8');
      const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
      if (!match) return null;

      const frontmatter = match[1];
      const body = match[2];

      const name = frontmatter.match(/name:\s*(.+)/)?.[1]?.trim() || dirName;
      const description = frontmatter.match(/description:\s*(.+)/)?.[1]?.trim() || '';

      // Extract meaningful trigger words from description + body
      const fullText = (description + ' ' + body).toLowerCase();
      const words = fullText.match(/\b[a-z]{5,}\b/g) || [];

      // Filter to most meaningful words
      const stopWords = new Set([
        'skill',
        'agent',
        'using',
        'when',
        'create',
        'build',
        'use',
        'this',
      ]);
      const triggers = [...new Set(words.filter((w) => !stopWords.has(w)))].slice(0, 8);

      // Calculate confidence based on description quality
      const confidence = description.length > 30 ? 0.9 : 0.6;

      return { skillName: name, triggers, confidence };
    } catch {
      return null;
    }
  }

  /** Find best matching skills for a natural language goal */
  matchGoal(goal: string): SkillPattern[] {
    const q = goal.toLowerCase();
    const scored = this.patterns
      .map((p) => {
        const score = p.triggers.filter((t) => q.includes(t.toLowerCase())).length;
        return { ...p, score };
      })
      .filter((p) => p.score > 0);

    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /** Get count of discovered skills */
  get count(): number {
    return this.patterns.length;
  }
}
