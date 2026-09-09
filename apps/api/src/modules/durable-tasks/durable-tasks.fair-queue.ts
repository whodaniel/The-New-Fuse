/**
 * Redis fair queue for DurableTask runs across API replicas.
 *
 * Per-tenant lists + round-robin tenant cursor so one noisy tenant cannot
 * starve others. Soft-fails when Redis is unreachable (in-process drain still works).
 *
 * Keys:
 *   tnf:durable:tenants          SET of userIds with pending work
 *   tnf:durable:q:<userId>       LIST of runIds (FIFO)
 *   tnf:durable:rr               integer cursor for round-robin
 *   tnf:durable:inflight:<runId> short claim lock (PX)
 */
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface DurableQueueJob {
  userId: string;
  runId: string;
}

@Injectable()
export class DurableTasksFairQueue implements OnModuleDestroy {
  private readonly logger = new Logger(DurableTasksFairQueue.name);
  private redis: Redis | null = null;
  private initAttempted = false;
  private readonly prefix = process.env.TNF_DURABLE_REDIS_PREFIX || 'tnf:durable';

  private tenantsKey() {
    return `${this.prefix}:tenants`;
  }
  private rrKey() {
    return `${this.prefix}:rr`;
  }
  private queueKey(userId: string) {
    return `${this.prefix}:q:${userId}`;
  }
  private inflightKey(runId: string) {
    return `${this.prefix}:inflight:${runId}`;
  }

  enabled(): boolean {
    if (process.env.TNF_DURABLE_REDIS === '0' || process.env.TNF_DURABLE_REDIS === 'false') {
      return false;
    }
    return Boolean(process.env.REDIS_URL || process.env.TNF_DURABLE_REDIS === '1');
  }

  private ensureClient(): Redis | null {
    if (!this.enabled()) return null;
    if (this.redis) return this.redis;
    if (this.initAttempted) return this.redis;
    this.initAttempted = true;
    try {
      const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
      });
      this.redis.on('error', (err) => {
        this.logger.warn(`DurableTasks Redis: ${err.message}`);
      });
      void this.redis.connect().catch((err) => {
        this.logger.warn(
          `DurableTasks Redis connect failed — fair queue disabled (${
            err instanceof Error ? err.message : err
          })`
        );
        try {
          this.redis?.disconnect();
        } catch {
          /* ignore */
        }
        this.redis = null;
      });
      return this.redis;
    } catch (err) {
      this.logger.warn(
        `DurableTasks Redis init failed (${err instanceof Error ? err.message : err})`
      );
      this.redis = null;
      return null;
    }
  }

  async available(): Promise<boolean> {
    const client = this.ensureClient();
    if (!client) return false;
    try {
      if (client.status !== 'ready') {
        await client.connect().catch(() => undefined);
      }
      const pong = await client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async enqueue(userId: string, runId: string): Promise<boolean> {
    const client = this.ensureClient();
    if (!client) return false;
    try {
      if (client.status !== 'ready') await client.connect().catch(() => undefined);
      await client.rpush(this.queueKey(userId), runId);
      await client.sadd(this.tenantsKey(), userId);
      return true;
    } catch (err) {
      this.logger.warn(`enqueue failed: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  /**
   * Claim the next job using tenant round-robin fairness.
   * Sets a short inflight lock so two workers do not execute the same runId.
   */
  async claimNext(lockTtlMs = 60_000): Promise<DurableQueueJob | null> {
    const client = this.ensureClient();
    if (!client) return null;
    try {
      if (client.status !== 'ready') await client.connect().catch(() => undefined);
      const tenants = await client.smembers(this.tenantsKey());
      if (!tenants.length) return null;
      const start = Number((await client.get(this.rrKey())) || 0) % tenants.length;

      for (let i = 0; i < tenants.length; i++) {
        const idx = (start + i) % tenants.length;
        const userId = tenants[idx];
        const runId = await client.lpop(this.queueKey(userId));
        if (!runId) {
          await client.srem(this.tenantsKey(), userId);
          continue;
        }
        const locked = await client.set(this.inflightKey(runId), userId, 'PX', lockTtlMs, 'NX');
        if (locked !== 'OK') {
          // Another worker holds it — skip (do not requeue to avoid hot loops)
          await client.set(this.rrKey(), String(idx + 1));
          const remaining = await client.llen(this.queueKey(userId));
          if (remaining === 0) await client.srem(this.tenantsKey(), userId);
          continue;
        }
        await client.set(this.rrKey(), String(idx + 1));
        const remaining = await client.llen(this.queueKey(userId));
        if (remaining === 0) await client.srem(this.tenantsKey(), userId);
        return { userId, runId };
      }
      return null;
    } catch (err) {
      this.logger.warn(`claimNext failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async release(runId: string): Promise<void> {
    const client = this.ensureClient();
    if (!client) return;
    try {
      await client.del(this.inflightKey(runId));
    } catch {
      /* ignore */
    }
  }

  async requeue(userId: string, runId: string): Promise<void> {
    await this.release(runId);
    await this.enqueue(userId, runId);
  }

  async depth(userId?: string): Promise<number> {
    const client = this.ensureClient();
    if (!client) return 0;
    try {
      if (userId) return await client.llen(this.queueKey(userId));
      const tenants = await client.smembers(this.tenantsKey());
      let total = 0;
      for (const t of tenants) {
        total += await client.llen(this.queueKey(t));
      }
      return total;
    } catch {
      return 0;
    }
  }

  async stats(): Promise<{ available: boolean; tenants: number; depth: number }> {
    const ok = await this.available();
    if (!ok) return { available: false, tenants: 0, depth: 0 };
    const client = this.redis!;
    const tenants = await client.scard(this.tenantsKey());
    const depth = await this.depth();
    return { available: true, tenants, depth };
  }

  async onModuleDestroy() {
    if (this.redis) {
      try {
        this.redis.disconnect();
      } catch {
        /* ignore */
      }
      this.redis = null;
    }
  }
}
