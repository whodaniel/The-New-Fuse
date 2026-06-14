// packages/relay-core/src/services/task-scheduler.service.ts

// Assume CONFIG and log are passed or imported
function log(level: string, category: string, message: string, data: any = {}) {
  console.log(`[${level.toUpperCase()}] [${category}] ${message}`, data);
}

// Minimal CONFIG required for this service
const CONFIG = {
  TASK_POLL_INTERVAL_MS: 15000,
  TASK_QUEUE_COOLDOWN_MS: 120000,
  TASK_QUEUE_BATCH_SIZE: 5,
  LEDGER_API_BASE: 'http://localhost:3001',
  REDIS_KEYS: {
    TASKS: 'tnf:master:tasks:pending',
    TASKS_REALTIME: 'tnf:master:tasks:realtime',
    TASKS_PLANNING: 'tnf:master:tasks:planning',
    SUGGESTIONS: 'tnf:master:suggestions:votes',
    CHANGELOG: 'tnf:master:changelog:suggestions',
    KANBAN: 'tnf:master:kanban:delivery',
    LOGS: 'tnf:master:logs',
  },
};

export class TaskSchedulerService {
  private config: typeof CONFIG;
  private logger: (level: string, category: string, message: string, data?: any) => void;
  private redisClient: any; // Will be RedisClientManager
  private emitActivityEvent: (
    eventType: string,
    content: string,
    metadata: Record<string, unknown>
  ) => Promise<void>;

  private taskPollingInterval: NodeJS.Timeout | null = null;
  private recentQueuedTasks: Map<string, number>;
  private taskPollFailureCount: number = 0;

  constructor(
    config: typeof CONFIG,
    logger: (level: string, category: string, message: string, data?: any) => void,
    redisClient: any, // RedisClientManager instance
    emitActivityEvent: (
      eventType: string,
      content: string,
      metadata: Record<string, unknown>
    ) => Promise<void>
  ) {
    this.config = config;
    this.logger = logger;
    this.redisClient = redisClient;
    this.emitActivityEvent = emitActivityEvent;
    this.recentQueuedTasks = new Map();
  }

  startTaskPolling() {
    if (
      (!this.redisClient.rawRedisClient && !this.redisClient.rawUpstashClient) ||
      this.taskPollingInterval
    ) {
      return;
    }

    this.logger(
      'info',
      'TASK-POLL',
      `Starting vote-aware task polling (every ${this.config.TASK_POLL_INTERVAL_MS}ms)`
    );

    const run = () => {
      void this.pollAndQueueTasks().catch((error: any) => {
        this.taskPollFailureCount += 1;
        if (this.taskPollFailureCount <= 3 || this.taskPollFailureCount % 10 === 0) {
          this.logger(
            'warn',
            'TASK-POLL',
            `Task polling failed (${this.taskPollFailureCount}): ${error.message || String(error)}`
          );
        }
      });
    };

    this.taskPollingInterval = setInterval(run, this.config.TASK_POLL_INTERVAL_MS);
    run();
  }

  stopTaskPolling() {
    if (this.taskPollingInterval) {
      clearInterval(this.taskPollingInterval);
      this.taskPollingInterval = null;
      this.logger('info', 'TASK-POLL', 'Task polling stopped.');
    }
  }

  pruneTasks(now: number, maxAgeMs: number): number {
    let pruned = 0;
    for (const [taskId, timestamp] of this.recentQueuedTasks.entries()) {
      if (now - timestamp > maxAgeMs) {
        this.recentQueuedTasks.delete(taskId);
        pruned++;
      }
    }
    return pruned;
  }

  private taskPriorityWeight(priority: string): number {
    const normalized = String(priority || 'medium').toLowerCase();
    if (normalized === 'p0' || normalized === 'urgent') return 500;
    if (normalized === 'critical') return 400;
    if (normalized === 'p1' || normalized === 'high') return 300;
    if (normalized === 'p3' || normalized === 'low') return 100;
    if (normalized === 'normal' || normalized === 'p2') return 200;
    return 200;
  }

  private itineraryLaneWeight(lane: string): number {
    const normalized = String(lane || '').toLowerCase();
    if (normalized === 'realtime_broker_routing') return 350;
    if (
      normalized === 'relay_federation' ||
      normalized === 'redis_sync' ||
      normalized === 'tauri_sync'
    )
      return 300;
    if (normalized === 'directive') return 250;
    if (normalized === 'kanban_delivery') return 150;
    if (normalized === 'changelog_suggestion') return 120;
    if (normalized === 'suggestion_vote') return 80;
    return 100;
  }

  private horizonWeight(horizon: string): number {
    const normalized = String(horizon || '').toLowerCase();
    if (normalized === 'realtime') return 200;
    if (normalized === 'short_term') return 120;
    if (normalized === 'medium_term') return 60;
    if (normalized === 'long_term') return 20;
    return 40;
  }

  private isRealtimeDispatchCandidate(task: any): boolean {
    const lane = String(task?.itinerary?.lane || '').toLowerCase();
    return [
      'realtime_broker_routing',
      'relay_federation',
      'redis_sync',
      'tauri_sync',
      'directive',
    ].includes(lane);
  }

  private targetQueueForTask(task: any): string {
    const lane = String(task?.itinerary?.lane || '').toLowerCase();
    if (lane === 'suggestion_vote') return this.config.REDIS_KEYS.SUGGESTIONS;
    if (lane === 'changelog_suggestion') return this.config.REDIS_KEYS.CHANGELOG;
    if (lane === 'kanban_delivery') return this.config.REDIS_KEYS.KANBAN;
    if (this.isRealtimeDispatchCandidate(task)) return this.config.REDIS_KEYS.TASKS_REALTIME;
    return this.config.REDIS_KEYS.TASKS_PLANNING;
  }

  private taskDispatchScore(task: any): number {
    const up = Number(task?.votes?.up || 0);
    const down = Number(task?.votes?.down || 0);
    const netVotes = up - down;
    const priority = this.taskPriorityWeight(task?.priority || 'medium');
    const laneWeight = this.itineraryLaneWeight(task?.itinerary?.lane || '');
    const horizonWeight = this.horizonWeight(task?.itinerary?.horizon || '');
    const createdAt = Date.parse(String(task?.createdAt || task?.updatedAt || Date.now()));
    const ageMinutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
    const freshnessBonus = Math.max(0, 120 - ageMinutes); // fades over ~2 hours
    return priority + laneWeight + horizonWeight + netVotes * 25 + up * 5 + freshnessBonus;
  }

  private async fetchLedgerTasks(): Promise<any[]> {
    const base = this.config.LEDGER_API_BASE.replace(/\/$/, '');
    const urls = [
      `${base}/api/unified-ledger/records?kind=task`,
      `${base}/unified-ledger/records?kind=task`,
    ];

    let lastError: string | null = null;
    for (const url of urls) {
      try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
          lastError = `HTTP ${response.status} (${url})`;
          if (response.status === 401 || response.status === 404) {
            continue;
          }
          continue;
        }
        const rows = (await response.json()) as any[];
        return Array.isArray(rows) ? rows : [];
      } catch (error) {
        lastError = `${(error as Error).message || String(error)} (${url})`;
      }
    }

    if (lastError && /\bHTTP (401|404)\b/.test(lastError)) {
      return [];
    }

    throw new Error(`Ledger poll failed: ${lastError || 'unknown error'}`);
  }

  private async pollAndQueueTasks(): Promise<void> {
    if (!this.redisClient.rawRedisClient && !this.redisClient.rawUpstashClient) return;

    const rows = await this.fetchLedgerTasks();
    this.taskPollFailureCount = 0;
    const actionable = (Array.isArray(rows) ? rows : []).filter((task) => {
      const status = String(task?.status || '').toLowerCase();
      return (
        ['submitted', 'queued', 'under_review', 'in_progress'].includes(status) &&
        this.isRealtimeDispatchCandidate(task)
      );
    });

    const ranked = actionable
      .map((task) => ({ task, score: this.taskDispatchScore(task) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.TASK_QUEUE_BATCH_SIZE);

    // No direct metrics update here, MasterClock orchestrates.
    // this.metrics.taskPolls += 1;
    await this.emitActivityEvent('task_poll_ranked', `Ranked ${ranked.length} tasks for dispatch`, {
      pollCount: this.taskPollFailureCount, // Using failure count as placeholder, MasterClock will have actual metrics
      candidateCount: actionable.length,
      top: ranked.map((r) => ({
        id: r.task?.id,
        title: r.task?.title,
        score: r.score,
        votes: r.task?.votes || { up: 0, down: 0 },
        priority: r.task?.priority || 'medium',
        itinerary: r.task?.itinerary || {},
      })),
    });

    const now = Date.now();
    for (const rankedTask of ranked) {
      const task = rankedTask.task || {};
      const taskId = String(task.id || '');
      if (!taskId) continue;

      const lastQueuedAt = this.recentQueuedTasks.get(taskId) || 0;
      if (now - lastQueuedAt < this.config.TASK_QUEUE_COOLDOWN_MS) {
        continue;
      }

      const queueItem = {
        id: taskId,
        title: String(task.title || `Task ${taskId}`),
        description: String(task.description || ''),
        priority: String(task.priority || 'medium'),
        status: String(task.status || 'queued'),
        votes: task.votes || { up: 0, down: 0 },
        score: rankedTask.score,
        source: 'unified-ledger-poll',
        itinerary: task.itinerary || {
          lane: 'realtime_broker_routing',
          horizon: 'realtime',
          coordinationMode: 'brokered',
          signalSources: ['redis'],
          sequencingKey: taskId,
          clockSource: 'master-clock',
        },
        createdAt: task.createdAt || new Date().toISOString(),
      };

      const targetQueue = this.targetQueueForTask(task);
      await this.redisClient.lpush(targetQueue, JSON.stringify(queueItem));
      // Backward compatibility for existing consumers.
      await this.redisClient.lpush(this.config.REDIS_KEYS.TASKS, JSON.stringify(queueItem));
      await this.redisClient.ltrim(this.config.REDIS_KEYS.TASKS, 0, 99);
      this.recentQueuedTasks.set(taskId, now);
      // No direct metrics update here, MasterClock orchestrates.
      // this.metrics.tasksQueued += 1;

      await this.emitActivityEvent(
        'task_queued_from_votes',
        `Queued task ${taskId} (${queueItem.title}) with score ${rankedTask.score}`,
        {
          taskId,
          score: rankedTask.score,
          votes: queueItem.votes,
          priority: queueItem.priority,
          targetQueue,
          lane: queueItem.itinerary?.lane,
          tasksQueued: this.taskPollFailureCount, // Using failure count as placeholder
        }
      );
    }
  }
}
