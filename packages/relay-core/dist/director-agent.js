#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const ioredis_1 = require("ioredis");
const CONFIG = {
    REDIS_URL: process.env.REDIS_URL ||
        process.env.RAILWAY_REDIS_URL ||
        process.env.LIVE_REDIS_URL ||
        process.env.REDIS_PRIVATE_URL ||
        process.env.REDIS_TLS_URL ||
        'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
    LEDGER_API_BASE: process.env.LEDGER_API_BASE ||
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
    redis = null;
    redisBlocking = null;
    upstash = null;
    heartbeatInterval = null;
    running = false;
    directorId = process.env.DIRECTOR_ID || `DIRECTOR-${Date.now()}`;
    constructor() {
        // Use unified standalone utilities
        this.redis = (0, infrastructure_1.createStandaloneRedisClient)({ lazyConnect: true });
        this.redisBlocking = (0, infrastructure_1.createStandaloneRedisClient)({ lazyConnect: true });
        this.upstash = (0, infrastructure_1.createUpstashRestClient)();
        if (this.redis instanceof ioredis_1.Redis) {
            this.redis.on('error', (err) => console.error('[Director] Redis error:', err?.message || err));
        }
        if (this.redisBlocking instanceof ioredis_1.Redis) {
            this.redisBlocking.on('error', (err) => console.error('[Director] Redis blocking error:', err?.message || err));
        }
    }
    async start() {
        if (this.redis instanceof ioredis_1.Redis)
            await this.redis.connect();
        if (this.redisBlocking instanceof ioredis_1.Redis)
            await this.redisBlocking.connect();
        this.running = true;
        await this.registerDirector();
        this.startHeartbeat();
        console.log(`[Director] Online as ${this.directorId}`);
        console.log(`[Director] Consuming review queue: ${CONFIG.REVIEW_QUEUE}`);
        await this.consumeLoop();
    }
    async registerDirector() {
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
        }
        else if (this.redis) {
            await this.redis.hset(CONFIG.AGENT_REGISTRY_KEY, this.directorId, JSON.stringify(record));
        }
    }
    startHeartbeat() {
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
                }
                else if (this.redis) {
                    await this.redis.publish(CONFIG.HEARTBEAT_CHANNEL, payload);
                }
            }
            catch (error) {
                console.warn('[Director] Heartbeat failed:', error.message);
            }
        };
        this.heartbeatInterval = setInterval(sendHeartbeat, CONFIG.HEARTBEAT_INTERVAL_MS);
        void sendHeartbeat();
    }
    async consumeLoop() {
        while (this.running) {
            try {
                if (!this.redisBlocking)
                    break;
                // brpop is only available on TCP client (ioredis)
                const result = (await this.redisBlocking.brpop(CONFIG.REVIEW_QUEUE, CONFIG.QUEUE_BLOCK_TIMEOUT_SEC));
                if (!result || result.length < 2)
                    continue;
                const envelope = this.safeParseReview(result[1]);
                if (!envelope?.task?.id)
                    continue;
                await this.resolveReview(envelope);
            }
            catch (error) {
                console.error('[Director] Consume loop error:', error.message);
                await new Promise((r) => setTimeout(r, 1000));
            }
        }
    }
    safeParseReview(raw) {
        try {
            return JSON.parse(raw);
        }
        catch {
            console.warn('[Director] Skipping malformed review payload');
            return null;
        }
    }
    normalizeRiskLevel(value) {
        const risk = String(value || 'medium').toLowerCase();
        if (risk === 'critical')
            return 'critical';
        if (risk === 'high')
            return 'high';
        if (risk === 'low')
            return 'low';
        return 'medium';
    }
    chooseDecision(review) {
        const metadata = (review.task.metadata || {});
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
    targetQueueForTask(task) {
        const lane = String(task.itinerary?.lane || '').toLowerCase();
        if (lane === 'realtime_broker_routing' ||
            lane === 'relay_federation' ||
            lane === 'redis_sync' ||
            lane === 'tauri_sync' ||
            lane === 'directive') {
            return CONFIG.TASK_QUEUE_REALTIME;
        }
        return CONFIG.TASK_QUEUE_PLANNING;
    }
    async resolveReview(review) {
        const task = review.task;
        const { decision, rationale } = this.chooseDecision(review);
        const riskLevel = this.normalizeRiskLevel(review.riskLevel);
        const reviewedAt = new Date().toISOString();
        const targetQueue = this.targetQueueForTask(task);
        if (decision === 'approved') {
            if (this.upstash) {
                await this.upstash.lpush(targetQueue, JSON.stringify(task));
                await this.upstash.lpush(CONFIG.COMPAT_TASK_QUEUE, JSON.stringify(task));
            }
            else if (this.redis) {
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
        }
        else if (this.redis) {
            await this.redis.publish(CONFIG.DECISION_CHANNEL, eventPayload);
            await this.redis.publish(CONFIG.BROKER_DECISION_CHANNEL, eventPayload);
        }
        const status = decision === 'approved' ? 'queued' : 'rejected';
        await this.persistDecision(task, status, event);
        console.log(`[Director] ${decision.toUpperCase()} ${task.id} (${rationale})`);
    }
    async persistDecision(task, status, event) {
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
            if (patchRes.ok)
                return;
        }
        catch {
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
        }
        catch (error) {
            console.warn('[Director] Failed to persist decision:', error.message);
        }
    }
    async shutdown() {
        this.running = false;
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.redisBlocking)
            await this.redisBlocking.quit();
        if (this.redis)
            await this.redis.quit();
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
    console.error('[Director] Fatal startup error:', error.message);
    await director.shutdown();
    process.exit(1);
});
//# sourceMappingURL=director-agent.js.map