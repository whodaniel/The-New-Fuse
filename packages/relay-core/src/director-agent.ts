#!/usr/bin/env node
// @ts-ignore
import { createStandaloneRedisClient, createUpstashRestClient } from '@the-new-fuse/infrastructure';
import { Cluster, Redis } from 'ioredis';

type QueueTask = {
  id: string;
  title?: string;
  description?: string;
  priority?: string;
  itinerary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

type DirectorReviewEnvelope = {
  task: QueueTask;
  brokerId?: string;
  escalatedAt?: string;
  reason?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  sourceQueue?: string;
  [key: string]: unknown;
};

type DirectorDecision = 'approved' | 'rejected';

const CONFIG = {
  REDIS_URL:
    process.env.REDIS_URL ||
    process.env.RAILWAY_REDIS_URL ||
    process.env.LIVE_REDIS_URL ||
    process.env.REDIS_PRIVATE_URL ||
    process.env.REDIS_TLS_URL ||
    'redis://localhost:6379',
  LEDGER_API_BASE:
    process.env.LEDGER_API_BASE ||
    process.env.RAILWAY_API_URL ||
    process.env.LIVE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.TNF_API_BASE ||
    'http://localhost:3001',
  REVIEW_QUEUE: process.env.DIRECTOR_REVIEW_QUEUE || 'tnf:director:review:pending',
  DECISION_CHANNEL: process.env.DIRECTOR_DECISION_CHANNEL || 'tnf:director:decisions',
  BROKER_DECISION_CHANNEL: process.env.BROKER_DECISION_CHANNEL || 'tnf:broker:decisions',
  TASK_QUEUE_REALTIME: process.env.DIRECTOR_TASK_QUEUE_REALTIME || 'tnf:master:tasks:realtime',
  TASK_QUEUE_PLANNING: process.env.DIRECTOR_TASK_QUEUE_PLANNING || 'tnf:master:tasks:planning',
  COMPAT_TASK_QUEUE: process.env.DIRECTOR_COMPAT_TASK_QUEUE || 'tnf:master:tasks:pending',
  HEARTBEAT_CHANNEL: process.env.DIRECTOR_HEARTBEAT_CHANNEL || 'tnf:heartbeat',
  AGENT_REGISTRY_KEY: process.env.DIRECTOR_AGENT_REGISTRY_KEY || 'tnf:agent-registry',
  HEARTBEAT_INTERVAL_MS: parseInt(process.env.DIRECTOR_HEARTBEAT_INTERVAL_MS || '', 10) || 3000,
  QUEUE_BLOCK_TIMEOUT_SEC: parseInt(process.env.DIRECTOR_QUEUE_BLOCK_TIMEOUT_SEC || '', 10) || 5,
  AUTO_POLICY: String(process.env.DIRECTOR_AUTO_POLICY || 'risk-aware').toLowerCase(),
  APPROVE_HIGH_RISK: (process.env.DIRECTOR_APPROVE_HIGH_RISK || 'false') === 'true',
  APPROVE_CRITICAL_RISK: (process.env.DIRECTOR_APPROVE_CRITICAL_RISK || 'false') === 'true',
};

class DirectorAgent {
  private redis: Redis | Cluster | null = null;
  private redisBlocking: Redis | Cluster | null = null;
  private upstash: any = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private running = false;
  private readonly directorId = process.env.DIRECTOR_ID || `DIRECTOR-${Date.now()}`;

  constructor() {
    // Use unified standalone utilities
    this.redis = createStandaloneRedisClient({ lazyConnect: true });
    this.redisBlocking = createStandaloneRedisClient({ lazyConnect: true });
    this.upstash = createUpstashRestClient();

    if (this.redis instanceof Redis) {
      this.redis.on('error', (err: any) =>
        console.error('[Director] Redis error:', err?.message || err)
      );
    }
    if (this.redisBlocking instanceof Redis) {
      this.redisBlocking.on('error', (err: any) =>
        console.error('[Director] Redis blocking error:', err?.message || err)
      );
    }
  }

  async start(): Promise<void> {
    if (this.redis instanceof Redis) await this.redis.connect();
    if (this.redisBlocking instanceof Redis) await this.redisBlocking.connect();
    this.running = true;

    await this.registerDirector();
    this.startHeartbeat();

    console.log(`[Director] Online as ${this.directorId}`);
    console.log(`[Director] Consuming review queue: ${CONFIG.REVIEW_QUEUE}`);
    await this.consumeLoop();
  }

  private async registerDirector(): Promise<void> {
    const now = new Date().toISOString();
    const record = {
      id: this.directorId,
      name: 'TNF Runtime Director',
      role: 'director',
      platform: 'director-agent',
      status: 'active',
      isOnline: true,
      capabilities: ['policy-governance', 'risk-review', 'escalation-resolution'],
      registeredAt: now,
      lastSeen: now,
    };

    if (this.upstash) {
      await this.upstash.hset(CONFIG.AGENT_REGISTRY_KEY, {
        [this.directorId]: JSON.stringify(record),
      });
    } else if (this.redis) {
      await this.redis.hset(CONFIG.AGENT_REGISTRY_KEY, this.directorId, JSON.stringify(record));
    }
  }

  private startHeartbeat(): void {
    const sendHeartbeat = async () => {
      const nowIso = new Date().toISOString();
      try {
        const payload = JSON.stringify({
          type: 'heartbeat',
          source: this.directorId,
          role: 'director',
          timestamp: nowIso,
        });

        if (this.upstash) {
          await this.upstash.publish(CONFIG.HEARTBEAT_CHANNEL, payload);
        } else if (this.redis) {
          await this.redis.publish(CONFIG.HEARTBEAT_CHANNEL, payload);
        }
      } catch (error) {
        console.warn('[Director] Heartbeat failed:', (error as Error).message);
      }
    };

    this.heartbeatInterval = setInterval(sendHeartbeat, CONFIG.HEARTBEAT_INTERVAL_MS);
    void sendHeartbeat();
  }

  private async consumeLoop(): Promise<void> {
    while (this.running) {
      try {
        if (!this.redisBlocking) break;

        // brpop is only available on TCP client (ioredis)
        const result = (await (this.redisBlocking as any).brpop(
          CONFIG.REVIEW_QUEUE,
          CONFIG.QUEUE_BLOCK_TIMEOUT_SEC
        )) as [string, string] | null;

        if (!result || result.length < 2) continue;
        const envelope = this.safeParseReview(result[1]);
        if (!envelope?.task?.id) continue;
        await this.resolveReview(envelope);
      } catch (error) {
        console.error('[Director] Consume loop error:', (error as Error).message);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  private safeParseReview(raw: string): DirectorReviewEnvelope | null {
    try {
      return JSON.parse(raw) as DirectorReviewEnvelope;
    } catch {
      console.warn('[Director] Skipping malformed review payload');
      return null;
    }
  }

  private normalizeRiskLevel(value: unknown): 'low' | 'medium' | 'high' | 'critical' {
    const risk = String(value || 'medium').toLowerCase();
    if (risk === 'critical') return 'critical';
    if (risk === 'high') return 'high';
    if (risk === 'low') return 'low';
    return 'medium';
  }

  private chooseDecision(review: DirectorReviewEnvelope): {
    decision: DirectorDecision;
    rationale: string;
  } {
    const metadata = (review.task.metadata || {}) as Record<string, unknown>;
    const explicit = String(metadata.directorDecision || '').toLowerCase();
    if (explicit === 'approved' || explicit === 'rejected') {
      return {
        decision: explicit,
        rationale: 'Explicit metadata decision applied',
      };
    }

    const risk = this.normalizeRiskLevel(review.riskLevel);
    if (CONFIG.AUTO_POLICY === 'approve') {
      return { decision: 'approved', rationale: 'Director auto-policy=approve' };
    }
    if (CONFIG.AUTO_POLICY === 'deny' || CONFIG.AUTO_POLICY === 'reject') {
      return { decision: 'rejected', rationale: 'Director auto-policy=deny' };
    }

    if (risk === 'critical' && !CONFIG.APPROVE_CRITICAL_RISK) {
      return { decision: 'rejected', rationale: 'Critical risk requires manual intervention' };
    }
    if (risk === 'high' && !CONFIG.APPROVE_HIGH_RISK) {
      return { decision: 'rejected', rationale: 'High risk rejected by risk-aware policy' };
    }
    return { decision: 'approved', rationale: 'Risk-aware policy approved task' };
  }

  private targetQueueForTask(task: QueueTask): string {
    const lane = String((task.itinerary as any)?.lane || '').toLowerCase();
    if (
      lane === 'realtime_broker_routing' ||
      lane === 'relay_federation' ||
      lane === 'redis_sync' ||
      lane === 'tauri_sync' ||
      lane === 'directive'
    ) {
      return CONFIG.TASK_QUEUE_REALTIME;
    }
    return CONFIG.TASK_QUEUE_PLANNING;
  }

  private async resolveReview(review: DirectorReviewEnvelope): Promise<void> {
    const task = review.task;
    const { decision, rationale } = this.chooseDecision(review);
    const riskLevel = this.normalizeRiskLevel(review.riskLevel);
    const reviewedAt = new Date().toISOString();
    const targetQueue = this.targetQueueForTask(task);

    if (decision === 'approved') {
      if (this.upstash) {
        await this.upstash.lpush(targetQueue, JSON.stringify(task));
        await this.upstash.lpush(CONFIG.COMPAT_TASK_QUEUE, JSON.stringify(task));
      } else if (this.redis) {
        await this.redis.lpush(targetQueue, JSON.stringify(task));
        await this.redis.lpush(CONFIG.COMPAT_TASK_QUEUE, JSON.stringify(task));
      }
    }

    const event = {
      directorId: this.directorId,
      brokerId: review.brokerId || null,
      taskId: task.id,
      decision,
      reason: review.reason || 'policy_escalation',
      rationale,
      riskLevel,
      reviewedAt,
      requeueTarget: decision === 'approved' ? targetQueue : null,
      sourceQueue: review.sourceQueue || CONFIG.REVIEW_QUEUE,
      itinerary: task.itinerary || {},
    };

    const eventPayload = JSON.stringify(event);
    if (this.upstash) {
      await this.upstash.publish(CONFIG.DECISION_CHANNEL, eventPayload);
      await this.upstash.publish(CONFIG.BROKER_DECISION_CHANNEL, eventPayload);
    } else if (this.redis) {
      await this.redis.publish(CONFIG.DECISION_CHANNEL, eventPayload);
      await this.redis.publish(CONFIG.BROKER_DECISION_CHANNEL, eventPayload);
    }

    const status = decision === 'approved' ? 'queued' : 'rejected';
    await this.persistDecision(task, status, event);
    console.log(`[Director] ${decision.toUpperCase()} ${task.id} (${rationale})`);
  }

  private async persistDecision(
    task: QueueTask,
    status: 'queued' | 'rejected',
    event: Record<string, unknown>
  ): Promise<void> {
    const base = CONFIG.LEDGER_API_BASE.replace(/\/$/, '');
    const patchUrl = `${base}/api/unified-ledger/records/${encodeURIComponent(task.id)}`;
    const ingestUrl = `${base}/api/unified-ledger/ingest/orchestration`;

    try {
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status,
          itinerary: task.itinerary || undefined,
          metadata: {
            actor: this.directorId,
            directorDecision: event,
          },
        }),
      });
      if (patchRes.ok) return;
    } catch {
      // fall through to ingest fallback
    }

    try {
      await fetch(ingestUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'TASK_DISPATCH',
          action: 'director_review_resolution',
          task,
          status,
          directorDecision: event,
          directorId: this.directorId,
        }),
      });
    } catch (error) {
      console.warn('[Director] Failed to persist decision:', (error as Error).message);
    }
  }

  async shutdown(): Promise<void> {
    this.running = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.redisBlocking) await this.redisBlocking.quit();
    if (this.redis) await this.redis.quit();
    this.upstash = null;
  }
}

const director = new DirectorAgent();

process.on('SIGINT', async () => {
  await director.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await director.shutdown();
  process.exit(0);
});

void director.start().catch(async (error) => {
  console.error('[Director] Fatal startup error:', (error as Error).message);
  await director.shutdown();
  process.exit(1);
});
