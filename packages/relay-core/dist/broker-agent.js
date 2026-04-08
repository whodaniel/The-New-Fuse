#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const path = __importStar(require("node:path"));
// @ts-ignore
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const ioredis_1 = require("ioredis");
const tnf_envelope_1 = require("./protocol/tnf-envelope");
const CONFIG = {
    REDIS_URL: process.env.REDIS_URL ||
        process.env.RAILWAY_REDIS_URL ||
        process.env.LIVE_REDIS_URL ||
        process.env.REDIS_PRIVATE_URL ||
        process.env.REDIS_TLS_URL ||
        'redis://localhost:6379',
    LEDGER_API_BASE: process.env.LEDGER_API_BASE ||
        process.env.RAILWAY_API_URL ||
        process.env.LIVE_API_BASE_URL ||
        process.env.API_BASE_URL ||
        process.env.TNF_API_BASE ||
        'http://localhost:3001',
    TASK_QUEUE_KEY: process.env.BROKER_TASK_QUEUE_KEY || 'tnf:master:tasks:realtime',
    DECISION_CHANNEL: process.env.BROKER_DECISION_CHANNEL || 'tnf:broker:decisions',
    INGRESS_CHANNEL: process.env.BROKER_INGRESS_CHANNEL || 'tnf:bus:ingress',
    EGRESS_PREFIX: process.env.BROKER_EGRESS_PREFIX || 'tnf:bus:egress',
    HEARTBEAT_CHANNEL: process.env.BROKER_HEARTBEAT_CHANNEL || 'tnf:heartbeat',
    AGENT_REGISTRY_KEY: process.env.BROKER_AGENT_REGISTRY_KEY || 'tnf:agent-registry',
    DIRECTOR_REVIEW_QUEUE: process.env.BROKER_DIRECTOR_REVIEW_QUEUE || 'tnf:director:review:pending',
    GATE_METRICS_HASH: process.env.BROKER_GATE_METRICS_HASH || 'tnf:broker:federation-gate:metrics',
    POLICY_MODE: process.env.BROKER_POLICY_MODE || 'strict',
    FEDERATION_GATE_MODE: process.env.BROKER_FEDERATION_GATE_MODE || process.env.TNF_GATE_POLICY_MODE || 'warn',
    GATE_POLICY_ENDPOINT: process.env.BROKER_GATE_POLICY_ENDPOINT || process.env.TNF_GATE_POLICY_ENDPOINT || '',
    GATE_POLICY_TOKEN: process.env.BROKER_GATE_POLICY_TOKEN || process.env.TNF_GATE_POLICY_TOKEN || '',
    ALLOW_CRITICAL_WITHOUT_DIRECTOR: (process.env.BROKER_ALLOW_CRITICAL_WITHOUT_DIRECTOR || 'false') === 'true',
    HEARTBEAT_INTERVAL_MS: parseInt(process.env.BROKER_HEARTBEAT_INTERVAL_MS || '', 10) || 3000,
    QUEUE_BLOCK_TIMEOUT_SEC: parseInt(process.env.BROKER_QUEUE_BLOCK_TIMEOUT_SEC || '', 10) || 5,
    TWIP_INVENTORY_SNAPSHOT_PATH: path.resolve(process.env.BROKER_TWIP_INVENTORY_SNAPSHOT_PATH ||
        process.env.TWIP_INVENTORY_SNAPSHOT_PATH ||
        path.join(process.cwd(), 'data', 'protocols', 'twip-inventory.snapshot.json')),
    TWIP_SNAPSHOT_CACHE_MS: parseInt(process.env.BROKER_TWIP_SNAPSHOT_CACHE_MS || '', 10) || 15000,
    MAX_TWIP_CONTEXT_AGE_MS: parseInt(process.env.BROKER_MAX_TWIP_CONTEXT_AGE_MS || '', 10) || 900000,
    REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND: (process.env.BROKER_REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND || 'false') === 'true',
    CONTEXT_RISK_ESCALATION_LEVEL: String(process.env.BROKER_CONTEXT_RISK_ESCALATION_LEVEL || 'high').toLowerCase(),
};
const REQUIRED_FEDERATION_GATES = [
    'TENANT_SCOPE_GATE',
    'TRACE_CONTINUITY_GATE',
    'TERMINAL_BINDING_GATE',
    'HIGH_RISK_RUNTIME_GATE',
    'CHANNEL_MEMBERSHIP_GATE',
];
class BrokerAgent {
    redis = null;
    redisBlocking = null;
    upstash = null;
    heartbeatInterval = null;
    running = false;
    brokerId = process.env.BROKER_ID || `BROKER-${Date.now()}`;
    twipSnapshotCache = null;
    constructor() {
        // Use unified standalone utilities
        this.redis = (0, infrastructure_1.createStandaloneRedisClient)({ lazyConnect: true });
        this.redisBlocking = (0, infrastructure_1.createStandaloneRedisClient)({ lazyConnect: true });
        this.upstash = (0, infrastructure_1.createUpstashRestClient)();
        if (this.redis instanceof ioredis_1.Redis) {
            this.redis.on('error', (err) => console.error('[Broker] Redis error:', err?.message || err));
        }
        if (this.redisBlocking instanceof ioredis_1.Redis) {
            this.redisBlocking.on('error', (err) => console.error('[Broker] Redis blocking error:', err?.message || err));
        }
    }
    async start() {
        if (this.redis instanceof ioredis_1.Redis)
            await this.redis.connect();
        if (this.redisBlocking instanceof ioredis_1.Redis)
            await this.redisBlocking.connect();
        this.running = true;
        await this.registerBroker();
        this.startHeartbeat();
        console.log(`[Broker] Online as ${this.brokerId}`);
        console.log(`[Broker] Consuming queue: ${CONFIG.TASK_QUEUE_KEY}`);
        await this.consumeLoop();
    }
    async registerBroker() {
        const now = new Date().toISOString();
        const record = {
            id: this.brokerId,
            name: 'TNF Runtime Broker',
            role: 'broker',
            platform: 'broker-agent',
            status: 'active',
            isOnline: true,
            capabilities: ['task-routing', 'priority-dispatch', 'realtime-broker-routing'],
            registeredAt: now,
            lastSeen: now,
        };
        if (this.upstash) {
            await this.upstash.hset(CONFIG.AGENT_REGISTRY_KEY, { [this.brokerId]: JSON.stringify(record) });
        }
        else if (this.redis) {
            await this.redis.hset(CONFIG.AGENT_REGISTRY_KEY, this.brokerId, JSON.stringify(record));
        }
    }
    startHeartbeat() {
        const sendHeartbeat = async () => {
            const nowIso = new Date().toISOString();
            const heartbeat = {
                type: 'heartbeat',
                source: this.brokerId,
                role: 'broker',
                timestamp: nowIso,
            };
            try {
                if (this.upstash) {
                    await this.upstash.publish(CONFIG.HEARTBEAT_CHANNEL, JSON.stringify(heartbeat));
                    const existing = await this.upstash.hget(CONFIG.AGENT_REGISTRY_KEY, this.brokerId);
                    const parsed = existing ? JSON.parse(existing) : {};
                    await this.upstash.hset(CONFIG.AGENT_REGISTRY_KEY, {
                        [this.brokerId]: JSON.stringify({
                            ...parsed,
                            id: this.brokerId,
                            role: 'broker',
                            status: 'active',
                            isOnline: true,
                            lastSeen: nowIso,
                        }),
                    });
                }
                else if (this.redis) {
                    await this.redis.publish(CONFIG.HEARTBEAT_CHANNEL, JSON.stringify(heartbeat));
                    const existing = await this.redis.hget(CONFIG.AGENT_REGISTRY_KEY, this.brokerId);
                    const parsed = existing ? JSON.parse(existing) : {};
                    await this.redis.hset(CONFIG.AGENT_REGISTRY_KEY, this.brokerId, JSON.stringify({
                        ...parsed,
                        id: this.brokerId,
                        role: 'broker',
                        status: 'active',
                        isOnline: true,
                        lastSeen: nowIso,
                    }));
                }
            }
            catch (error) {
                console.warn('[Broker] Heartbeat failed:', error.message);
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
                const result = (await this.redisBlocking.brpop(CONFIG.TASK_QUEUE_KEY, CONFIG.QUEUE_BLOCK_TIMEOUT_SEC));
                if (!result || result.length < 2) {
                    continue;
                }
                const task = this.safeParseTask(result[1]);
                if (!task?.id) {
                    continue;
                }
                await this.dispatchTask(task);
            }
            catch (error) {
                console.error('[Broker] Consume loop error:', error.message);
                await new Promise((r) => setTimeout(r, 1000));
            }
        }
    }
    safeParseTask(raw) {
        try {
            return JSON.parse(raw);
        }
        catch {
            console.warn('[Broker] Skipping malformed queue payload');
            return null;
        }
    }
    normalizePriority(priority) {
        const p = String(priority || 'medium').toLowerCase();
        if (p === 'urgent' || p === 'critical' || p === 'p0')
            return 'critical';
        if (p === 'high' || p === 'p1')
            return 'high';
        if (p === 'low' || p === 'p3')
            return 'low';
        return 'normal';
    }
    isStrictPolicyMode() {
        return String(CONFIG.POLICY_MODE || 'strict').toLowerCase() !== 'permissive';
    }
    getFederationGateMode() {
        const mode = String(CONFIG.FEDERATION_GATE_MODE || 'warn').toLowerCase();
        if (mode === 'off' || mode === 'warn' || mode === 'enforce')
            return mode;
        return 'warn';
    }
    getTaskGateDecisions(task) {
        const direct = Array.isArray(task.gateDecisions)
            ? task.gateDecisions
            : Array.isArray(task.gate_decisions)
                ? task.gate_decisions
                : null;
        if (direct)
            return direct;
        const metadata = (task.metadata || {});
        const fromMetadata = Array.isArray(metadata.gateDecisions)
            ? metadata.gateDecisions
            : Array.isArray(metadata.gate_decisions)
                ? metadata.gate_decisions
                : [];
        return fromMetadata;
    }
    getTaskCumulativeId(task) {
        if (task.cumulativeId && typeof task.cumulativeId === 'object') {
            return task.cumulativeId;
        }
        if (task.cumulative_id && typeof task.cumulative_id === 'object') {
            return task.cumulative_id;
        }
        const metadata = (task.metadata || {});
        if (metadata.cumulativeId && typeof metadata.cumulativeId === 'object') {
            return metadata.cumulativeId;
        }
        if (metadata.cumulative_id && typeof metadata.cumulative_id === 'object') {
            return metadata.cumulative_id;
        }
        return null;
    }
    getScopeTenant(task) {
        const scope = task.scope;
        const fromScope = String(scope?.tenantId || scope?.tenant_id || '').trim();
        if (fromScope)
            return fromScope;
        const metadata = (task.metadata || {});
        const fromMetadata = String(metadata.tenantId || metadata.tenant_id || '').trim();
        if (fromMetadata)
            return fromMetadata;
        return null;
    }
    isTerminalBoundTask(task) {
        const tags = Array.isArray(task.tags)
            ? task.tags.map((tag) => String(tag).toLowerCase())
            : [];
        return (tags.includes('terminal-bound') ||
            Boolean(task.twipRef) ||
            Boolean(task.metadata?.twipRef));
    }
    getTaskTwid(task, cumulativeId) {
        const raw = task.twipRef?.twid ||
            task.metadata?.twipRef?.twid ||
            cumulativeId?.lineage?.twid ||
            null;
        const twid = String(raw || '').trim();
        return twid || null;
    }
    toRiskScore(level) {
        switch (level) {
            case 'critical':
                return 4;
            case 'high':
                return 3;
            case 'medium':
                return 2;
            case 'low':
                return 1;
            default:
                return 0;
        }
    }
    normalizeRiskLevel(value) {
        if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') {
            return value;
        }
        return 'none';
    }
    getContextRiskEscalationLevel() {
        return this.normalizeRiskLevel(CONFIG.CONTEXT_RISK_ESCALATION_LEVEL);
    }
    extractContextPreview(text) {
        return text
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(-2)
            .join(' | ')
            .slice(0, 220);
    }
    evaluateContextRisk(terminal) {
        const commands = Array.isArray(terminal.active_commands)
            ? terminal.active_commands.map((entry) => String(entry || ''))
            : [];
        const excerpt = terminal.context_excerpt || null;
        const text = String(excerpt?.text || '');
        const normalizedText = text.toLowerCase();
        const reasons = [];
        let score = 0;
        const add = (nextScore, reason) => {
            score = Math.max(score, nextScore);
            reasons.push(reason);
        };
        if (commands.some((line) => line.includes('--dangerously-bypass-approvals-and-sandbox'))) {
            add(4, 'approval bypass flag detected in active command');
        }
        if (commands.some((line) => /mcp-remote/i.test(line))) {
            add(2, 'remote MCP usage detected');
        }
        if (/(^|\s)sudo\s/.test(normalizedText)) {
            add(3, 'sudo command detected in terminal context');
        }
        if (normalizedText.includes('rm -rf') || normalizedText.includes('mkfs')) {
            add(4, 'destructive shell pattern detected in terminal context');
        }
        if (normalizedText.includes('export ') &&
            /(token|secret|password|api[_-]?key|authorization)/i.test(normalizedText)) {
            add(3, 'sensitive env export pattern detected in terminal context');
        }
        const riskLevel = score >= 4
            ? 'critical'
            : score === 3
                ? 'high'
                : score === 2
                    ? 'medium'
                    : score === 1
                        ? 'low'
                        : 'none';
        return {
            riskLevel,
            reasons,
            preview: text ? this.extractContextPreview(text) : null,
            redactionCount: Number(excerpt?.redaction_count || 0),
            source: String(excerpt?.source || 'unavailable'),
            capturedAt: excerpt?.captured_at ? String(excerpt.captured_at) : null,
        };
    }
    async getTwipIdentityByTwid(twid) {
        const now = Date.now();
        if (this.twipSnapshotCache &&
            now - this.twipSnapshotCache.loadedAt <= Math.max(1000, CONFIG.TWIP_SNAPSHOT_CACHE_MS)) {
            return this.twipSnapshotCache.byTwid.get(twid) || null;
        }
        try {
            const raw = await (0, promises_1.readFile)(CONFIG.TWIP_INVENTORY_SNAPSHOT_PATH, 'utf8');
            const parsed = JSON.parse(raw);
            const identities = Array.isArray(parsed?.terminals) ? parsed.terminals : [];
            const byTwid = new Map();
            for (const identity of identities) {
                const key = String(identity?.twid || '').trim();
                if (!key)
                    continue;
                byTwid.set(key, identity);
            }
            this.twipSnapshotCache = {
                loadedAt: now,
                byTwid,
            };
            return byTwid.get(twid) || null;
        }
        catch (error) {
            console.warn('[Broker] TWIP context lookup unavailable:', error.message);
            this.twipSnapshotCache = {
                loadedAt: now,
                byTwid: new Map(),
            };
            return null;
        }
    }
    async resolveTwipContextSignal(task, cumulativeId) {
        const terminalBound = this.isTerminalBoundTask(task);
        const twid = this.getTaskTwid(task, cumulativeId);
        if (!terminalBound) {
            return {
                terminalBound: false,
                twid,
                available: false,
                stale: false,
                ageMs: null,
                source: 'not-terminal-bound',
                riskLevel: 'none',
                reasons: [],
                redactionCount: 0,
                capturedAt: null,
                preview: null,
            };
        }
        if (!twid) {
            return {
                terminalBound: true,
                twid: null,
                available: false,
                stale: false,
                ageMs: null,
                source: 'missing-twid',
                riskLevel: 'none',
                reasons: ['missing twid'],
                redactionCount: 0,
                capturedAt: null,
                preview: null,
            };
        }
        const identity = await this.getTwipIdentityByTwid(twid);
        if (!identity) {
            return {
                terminalBound: true,
                twid,
                available: false,
                stale: false,
                ageMs: null,
                source: 'snapshot-miss',
                riskLevel: 'none',
                reasons: ['twip identity not found in inventory snapshot'],
                redactionCount: 0,
                capturedAt: null,
                preview: null,
            };
        }
        const assessment = this.evaluateContextRisk(identity);
        const capturedAtMs = assessment.capturedAt ? Date.parse(assessment.capturedAt) : Number.NaN;
        const ageMs = Number.isFinite(capturedAtMs) ? Math.max(0, Date.now() - capturedAtMs) : null;
        const stale = ageMs !== null && ageMs > Math.max(1000, CONFIG.MAX_TWIP_CONTEXT_AGE_MS);
        return {
            terminalBound: true,
            twid,
            available: true,
            stale,
            ageMs,
            source: assessment.source,
            riskLevel: assessment.riskLevel,
            reasons: assessment.reasons,
            redactionCount: assessment.redactionCount,
            capturedAt: assessment.capturedAt,
            preview: assessment.preview,
        };
    }
    localFederationGateCheck(task, contextSignal) {
        const reasons = [];
        const gateDecisions = this.getTaskGateDecisions(task);
        const gateByName = new Map(gateDecisions
            .filter((entry) => entry && typeof entry.gate === 'string')
            .map((entry) => [entry.gate, entry]));
        for (const gateName of REQUIRED_FEDERATION_GATES) {
            const gate = gateByName.get(gateName);
            if (!gate) {
                reasons.push(`missing required gate: ${gateName}`);
                continue;
            }
            if (gate.decision !== 'allow') {
                reasons.push(`required gate ${gateName} is not allow`);
            }
        }
        const cumulativeId = this.getTaskCumulativeId(task);
        const scopeTenant = this.getScopeTenant(task);
        const cumulativeTenant = String(cumulativeId?.scope?.tenant_id || '').trim() || null;
        if (!scopeTenant)
            reasons.push('missing scope tenant');
        if (!cumulativeTenant)
            reasons.push('missing cumulative tenant');
        if (scopeTenant && cumulativeTenant && scopeTenant !== cumulativeTenant) {
            reasons.push('tenant mismatch between scope tenant and cumulative tenant');
        }
        const terminalBound = contextSignal.terminalBound;
        const twid = contextSignal.twid;
        if (terminalBound && !twid) {
            reasons.push('terminal-bound task missing twid');
        }
        if (terminalBound && twid) {
            if (!contextSignal.available && CONFIG.REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND) {
                reasons.push('twip context signal unavailable for terminal-bound task');
            }
            if (contextSignal.available) {
                if (contextSignal.stale) {
                    const maxAgeSec = Math.round(Math.max(1000, CONFIG.MAX_TWIP_CONTEXT_AGE_MS) / 1000);
                    const ageSec = Math.round((contextSignal.ageMs || 0) / 1000);
                    reasons.push(`twip context stale (${ageSec}s old, max ${maxAgeSec}s)`);
                }
                const threshold = this.getContextRiskEscalationLevel();
                if (this.toRiskScore(contextSignal.riskLevel) > 0 &&
                    this.toRiskScore(contextSignal.riskLevel) >= this.toRiskScore(threshold)) {
                    const detail = contextSignal.reasons.length > 0
                        ? contextSignal.reasons.join('; ')
                        : 'high risk context patterns detected';
                    reasons.push(`twip context risk ${contextSignal.riskLevel}: ${detail}`);
                }
            }
        }
        return {
            ok: reasons.length === 0,
            reasons,
            tenantId: scopeTenant || cumulativeTenant,
        };
    }
    async externalFederationGateCheck(task, contextSignal) {
        const endpoint = String(CONFIG.GATE_POLICY_ENDPOINT || '').trim();
        const mode = this.getFederationGateMode();
        if (!endpoint) {
            if (mode === 'enforce') {
                return {
                    ok: false,
                    reasons: ['external gate endpoint missing while BROKER_FEDERATION_GATE_MODE=enforce'],
                };
            }
            return { ok: true, reasons: ['external gate endpoint not configured'] };
        }
        const url = `${endpoint.replace(/\/+$/, '')}/gates/federation/evaluate`;
        const gateDecisions = this.getTaskGateDecisions(task);
        const cumulativeId = this.getTaskCumulativeId(task);
        const tenantId = this.getScopeTenant(task) || String(cumulativeId?.scope?.tenant_id || '').trim();
        const tags = Array.isArray(task.tags)
            ? task.tags.map((tag) => String(tag))
            : [];
        const tagsWithContext = [
            ...tags,
            `twip-context-risk:${contextSignal.riskLevel}`,
            `twip-context-available:${contextSignal.available ? 'true' : 'false'}`,
            `twip-context-stale:${contextSignal.stale ? 'true' : 'false'}`,
        ];
        const twipRef = task.twipRef || task.metadata?.twipRef || null;
        const payload = {
            request: {
                scope: { tenantId, tenant_id: tenantId },
                cumulativeId,
                cumulative_id: cumulativeId,
                gateDecisions,
                gate_decisions: gateDecisions,
                tags: tagsWithContext,
                payload: {
                    twipRef,
                    twip_ref: twipRef,
                    twip_context_signal: {
                        terminal_bound: contextSignal.terminalBound,
                        twid: contextSignal.twid,
                        available: contextSignal.available,
                        stale: contextSignal.stale,
                        age_ms: contextSignal.ageMs,
                        source: contextSignal.source,
                        risk_level: contextSignal.riskLevel,
                        reasons: contextSignal.reasons,
                        redaction_count: contextSignal.redactionCount,
                        captured_at: contextSignal.capturedAt,
                        preview: contextSignal.preview,
                    },
                },
            },
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    ...(CONFIG.GATE_POLICY_TOKEN ? { 'x-auth-token': CONFIG.GATE_POLICY_TOKEN } : {}),
                },
                body: JSON.stringify(payload),
            });
            const body = (await response.json().catch(() => null));
            if (response.status >= 500) {
                return {
                    ok: true,
                    reasons: [
                        `external gate worker unavailable (HTTP ${response.status}); local fallback used`,
                    ],
                    fallbackUsed: true,
                };
            }
            if (response.ok && body === null) {
                return {
                    ok: true,
                    reasons: [
                        `external gate worker returned invalid JSON (HTTP ${response.status}); local fallback used`,
                    ],
                    fallbackUsed: true,
                };
            }
            const reasons = Array.isArray(body?.reasons)
                ? body.reasons.map((entry) => String(entry))
                : [];
            if (!response.ok && reasons.length === 0) {
                reasons.push(`external gate returned HTTP ${response.status}`);
            }
            return { ok: response.ok && body?.ok === true, reasons };
        }
        catch (error) {
            return {
                ok: true,
                reasons: [`external gate check failed: ${error.message}; local fallback used`],
                fallbackUsed: true,
            };
        }
    }
    async evaluatePolicy(task, targetAgentId) {
        const lane = String(task.itinerary?.lane || '').toLowerCase();
        const priority = this.normalizePriority(task.priority);
        const metadata = (task.metadata || {});
        const cumulativeId = this.getTaskCumulativeId(task);
        const contextSignal = await this.resolveTwipContextSignal(task, cumulativeId);
        const requiresDirectorApproval = metadata.requiresDirectorApproval === true ||
            metadata.policyGate === 'director_approval_required';
        const hasTarget = !!targetAgentId;
        const gateMode = this.getFederationGateMode();
        if (gateMode !== 'off') {
            const localGate = this.localFederationGateCheck(task, contextSignal);
            if (!localGate.ok) {
                const reason = `Local federation gate check failed: ${localGate.reasons.join('; ')}`;
                await this.recordFederationGateTelemetry(task, 'local', gateMode, localGate.reasons, contextSignal);
                if (gateMode === 'enforce') {
                    return {
                        decision: 'escalate',
                        reason,
                        riskLevel: 'high',
                    };
                }
                console.warn(`[Broker] WARN ${task.id}: ${reason}`);
            }
            else {
                await this.recordFederationGateTelemetry(task, 'local', gateMode, [], contextSignal);
            }
            const externalGate = await this.externalFederationGateCheck(task, contextSignal);
            if (!externalGate.ok) {
                const detail = externalGate.reasons.length > 0 ? externalGate.reasons.join('; ') : 'no reason';
                const reason = `External federation gate check failed: ${detail}`;
                await this.recordFederationGateTelemetry(task, 'external', gateMode, externalGate.reasons, contextSignal);
                if (gateMode === 'enforce') {
                    return {
                        decision: 'escalate',
                        reason,
                        riskLevel: 'high',
                    };
                }
                console.warn(`[Broker] WARN ${task.id}: ${reason}`);
            }
            else {
                await this.recordFederationGateTelemetry(task, 'external', gateMode, externalGate.reasons, contextSignal, externalGate.fallbackUsed ? 'warn' : undefined);
                if (externalGate.fallbackUsed && externalGate.reasons.length > 0) {
                    console.warn(`[Broker] WARN ${task.id}: ${externalGate.reasons.join('; ')}`);
                }
            }
        }
        if (!lane) {
            return {
                decision: 'escalate',
                reason: 'Missing itinerary lane for dispatch governance',
                riskLevel: 'high',
            };
        }
        if (!hasTarget && this.isStrictPolicyMode()) {
            return {
                decision: 'escalate',
                reason: 'No target worker available in strict policy mode',
                riskLevel: 'high',
            };
        }
        if (requiresDirectorApproval) {
            return {
                decision: 'escalate',
                reason: 'Task explicitly requires Director approval',
                riskLevel: priority === 'critical' ? 'critical' : 'high',
            };
        }
        if (priority === 'critical' && !CONFIG.ALLOW_CRITICAL_WITHOUT_DIRECTOR) {
            return {
                decision: 'escalate',
                reason: 'Critical task requires Director review',
                riskLevel: 'critical',
            };
        }
        if (lane === 'suggestion_vote' ||
            lane === 'changelog_suggestion' ||
            lane === 'kanban_delivery') {
            return {
                decision: 'deny',
                reason: `Lane '${lane}' is non-realtime and cannot be broker-dispatched`,
                riskLevel: 'medium',
            };
        }
        return {
            decision: 'allow',
            reason: 'Policy checks passed',
            riskLevel: priority === 'critical' ? 'high' : 'low',
        };
    }
    isWorkerAgent(agent) {
        const role = String(agent.role || '').toLowerCase();
        const status = String(agent.status || '').toLowerCase();
        if (agent.isOnline === false)
            return false;
        if (!['active', 'idle', 'ready', 'online'].includes(status))
            return false;
        return !['broker', 'orchestrator', 'director'].includes(role);
    }
    getAgentId(agent) {
        return String(agent.id || agent.agentId || '');
    }
    getCapabilityList(agent) {
        if (!Array.isArray(agent.capabilities))
            return [];
        return agent.capabilities.map((cap) => String(cap).toLowerCase());
    }
    async selectTargetAgent(task) {
        let registry = {};
        if (this.upstash) {
            registry = (await this.upstash.hgetall(CONFIG.AGENT_REGISTRY_KEY)) || {};
        }
        else if (this.redis) {
            registry = await this.redis.hgetall(CONFIG.AGENT_REGISTRY_KEY);
        }
        const agents = Object.values(registry)
            .map((raw) => {
            try {
                return JSON.parse(raw);
            }
            catch {
                return null;
            }
        })
            .filter((agent) => !!agent)
            .filter((agent) => this.isWorkerAgent(agent));
        if (agents.length === 0)
            return null;
        const requestedAssignee = String(task.assignee || '').trim();
        if (requestedAssignee) {
            const exact = agents.find((agent) => this.getAgentId(agent) === requestedAssignee);
            if (exact)
                return this.getAgentId(exact);
        }
        const requiredCapabilities = Array.isArray(task.requiredCapabilities)
            ? task.requiredCapabilities.map((cap) => String(cap).toLowerCase())
            : [];
        if (requiredCapabilities.length > 0) {
            const capable = agents.find((agent) => requiredCapabilities.every((cap) => this.getCapabilityList(agent).includes(cap)));
            if (capable)
                return this.getAgentId(capable);
        }
        const sorted = [...agents].sort((a, b) => {
            const ta = Date.parse(String(a.lastSeen || 0)) || 0;
            const tb = Date.parse(String(b.lastSeen || 0)) || 0;
            return ta - tb;
        });
        return this.getAgentId(sorted[0]) || null;
    }
    async publishPolicyDecision(task, policy, targetAgentId) {
        const payload = JSON.stringify({
            brokerId: this.brokerId,
            taskId: task.id,
            policyDecision: policy.decision,
            policyReason: policy.reason,
            riskLevel: policy.riskLevel,
            targetAgentId,
            decidedAt: new Date().toISOString(),
            itinerary: task.itinerary || {},
        });
        if (this.upstash) {
            await this.upstash.publish(CONFIG.DECISION_CHANNEL, payload);
        }
        else if (this.redis) {
            await this.redis.publish(CONFIG.DECISION_CHANNEL, payload);
        }
    }
    async escalateToDirector(task, policy) {
        const payload = JSON.stringify({
            task,
            brokerId: this.brokerId,
            escalatedAt: new Date().toISOString(),
            reason: policy.reason,
            riskLevel: policy.riskLevel,
            sourceQueue: CONFIG.TASK_QUEUE_KEY,
        });
        if (this.upstash) {
            await this.upstash.lpush(CONFIG.DIRECTOR_REVIEW_QUEUE, payload);
        }
        else if (this.redis) {
            await this.redis.lpush(CONFIG.DIRECTOR_REVIEW_QUEUE, payload);
        }
    }
    async dispatchTask(task) {
        const targetAgentId = await this.selectTargetAgent(task);
        const priority = this.normalizePriority(task.priority);
        const channelId = String(task.itinerary?.lane || 'realtime_broker_routing');
        const policy = await this.evaluatePolicy(task, targetAgentId);
        await this.publishPolicyDecision(task, policy, targetAgentId);
        if (policy.decision === 'deny') {
            await this.persistDecision(task, null, policy, 'rejected');
            console.warn(`[Broker] Denied ${task.id}: ${policy.reason}`);
            return;
        }
        if (policy.decision === 'escalate') {
            await this.escalateToDirector(task, policy);
            await this.persistDecision(task, null, policy, 'under_review');
            console.warn(`[Broker] Escalated ${task.id} to Director: ${policy.reason}`);
            return;
        }
        const envelope = (0, tnf_envelope_1.createTNFEnvelope)('task', { agentId: this.brokerId, role: 'coordinator', platform: 'broker-agent' }, targetAgentId ? { agentId: targetAgentId, role: 'worker' } : { broadcast: true }, {
            action: 'execute_task',
            taskId: task.id,
            task,
            priority,
        }, {
            channelId,
            sessionId: this.brokerId,
        });
        if (targetAgentId) {
            const channel = `${CONFIG.EGRESS_PREFIX}:${targetAgentId}`;
            const payload = JSON.stringify(envelope);
            if (this.upstash) {
                await this.upstash.publish(channel, payload);
            }
            else if (this.redis) {
                await this.redis.publish(channel, payload);
            }
        }
        else {
            const payload = JSON.stringify(envelope);
            if (this.upstash) {
                await this.upstash.publish(CONFIG.INGRESS_CHANNEL, payload);
            }
            else if (this.redis) {
                await this.redis.publish(CONFIG.INGRESS_CHANNEL, payload);
            }
        }
        await this.persistDecision(task, targetAgentId, policy, 'queued');
        console.log(`[Broker] Dispatched ${task.id} -> ${targetAgentId || 'broadcast'} (${String(task.title || '')})`);
    }
    async persistDecision(task, targetAgentId, policy, status) {
        const base = CONFIG.LEDGER_API_BASE.replace(/\/$/, '');
        const patchUrl = `${base}/api/unified-ledger/records/${encodeURIComponent(task.id)}`;
        const ingestUrl = process.env.LEDGER_INTERNAL_INGEST_URL ||
            process.env.LEDGER_INGEST_URL ||
            `${base}/api/unified-ledger/internal/ingest/orchestration`;
        const internalSecret = process.env.TNF_INTERNAL_INGEST_SECRET || process.env.UNIFIED_LEDGER_INTERNAL_SECRET;
        const ingestHeaders = { 'content-type': 'application/json' };
        if (internalSecret) {
            ingestHeaders['x-tnf-internal-secret'] = internalSecret;
        }
        const patchPayload = {
            status,
            itinerary: task.itinerary || undefined,
            metadata: {
                actor: this.brokerId,
                brokerDecision: {
                    brokerId: this.brokerId,
                    targetAgentId,
                    dispatchedAt: new Date().toISOString(),
                    policyDecision: policy.decision,
                    policyReason: policy.reason,
                    riskLevel: policy.riskLevel,
                },
            },
        };
        try {
            const patchRes = await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(patchPayload),
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
                headers: ingestHeaders,
                body: JSON.stringify({
                    type: 'TASK_DISPATCH',
                    action: status === 'queued' ? 'broker_dispatch' : 'broker_policy_gate',
                    task: {
                        ...task,
                        targetAgents: targetAgentId ? [targetAgentId] : [],
                    },
                    brokerId: this.brokerId,
                    status,
                    policyDecision: policy.decision,
                    policyReason: policy.reason,
                    riskLevel: policy.riskLevel,
                }),
            });
        }
        catch (error) {
            console.warn('[Broker] Failed to persist dispatch:', error.message);
        }
    }
    async recordFederationGateTelemetry(task, stage, mode, reasons, contextSignal, outcomeOverride) {
        if (mode === 'off')
            return;
        const outcome = outcomeOverride || (reasons.length === 0 ? 'allow' : mode === 'enforce' ? 'deny' : 'warn');
        const tenantId = this.getScopeTenant(task) || 'unknown';
        const timestamp = new Date().toISOString();
        const keys = new Set([
            'total',
            `mode:${mode}`,
            `stage:${stage}`,
            `outcome:${outcome}`,
            `stage:${stage}:outcome:${outcome}`,
            `tenant:${tenantId}`,
            `twip_context_available:${contextSignal.available ? 'true' : 'false'}`,
            `twip_context_stale:${contextSignal.stale ? 'true' : 'false'}`,
            `twip_context_risk:${contextSignal.riskLevel}`,
        ]);
        for (const reason of reasons) {
            const reasonKey = this.toGateReasonKey(reason);
            if (reasonKey)
                keys.add(`reason:${reasonKey}`);
        }
        try {
            if (this.upstash) {
                const pipeline = this.upstash.pipeline();
                for (const key of keys) {
                    pipeline.hincrby(CONFIG.GATE_METRICS_HASH, key, 1);
                }
                await pipeline.exec();
                await this.upstash.publish(CONFIG.DECISION_CHANNEL, JSON.stringify({
                    type: 'federation_gate_telemetry',
                    brokerId: this.brokerId,
                    taskId: task.id,
                    tenantId,
                    stage,
                    mode,
                    outcome,
                    reasons,
                    twipContextSignal: {
                        terminalBound: contextSignal.terminalBound,
                        twid: contextSignal.twid,
                        available: contextSignal.available,
                        stale: contextSignal.stale,
                        ageMs: contextSignal.ageMs,
                        source: contextSignal.source,
                        riskLevel: contextSignal.riskLevel,
                        reasons: contextSignal.reasons,
                        redactionCount: contextSignal.redactionCount,
                        capturedAt: contextSignal.capturedAt,
                        preview: contextSignal.preview,
                    },
                    at: timestamp,
                    metricsHash: CONFIG.GATE_METRICS_HASH,
                }));
            }
            else if (this.redis) {
                const tx = this.redis.multi();
                for (const key of keys) {
                    tx.hincrby(CONFIG.GATE_METRICS_HASH, key, 1);
                }
                await tx.exec();
                await this.redis.publish(CONFIG.DECISION_CHANNEL, JSON.stringify({
                    type: 'federation_gate_telemetry',
                    brokerId: this.brokerId,
                    taskId: task.id,
                    tenantId,
                    stage,
                    mode,
                    outcome,
                    reasons,
                    twipContextSignal: {
                        terminalBound: contextSignal.terminalBound,
                        twid: contextSignal.twid,
                        available: contextSignal.available,
                        stale: contextSignal.stale,
                        ageMs: contextSignal.ageMs,
                        source: contextSignal.source,
                        riskLevel: contextSignal.riskLevel,
                        reasons: contextSignal.reasons,
                        redactionCount: contextSignal.redactionCount,
                        capturedAt: contextSignal.capturedAt,
                        preview: contextSignal.preview,
                    },
                    at: timestamp,
                    metricsHash: CONFIG.GATE_METRICS_HASH,
                }));
            }
        }
        catch (error) {
            console.warn('[Broker] Failed to record federation gate telemetry:', error.message);
        }
    }
    toGateReasonKey(reason) {
        const text = String(reason || '').trim();
        if (!text)
            return 'unknown';
        const missingMatch = text.match(/missing required gate:\s*([A-Z_]+)/i);
        if (missingMatch?.[1])
            return `missing_${missingMatch[1].toLowerCase()}`;
        const denyMatch = text.match(/required gate\s+([A-Z_]+)\s+is not allow/i);
        if (denyMatch?.[1])
            return `deny_${denyMatch[1].toLowerCase()}`;
        const normalized = text.toLowerCase();
        if (normalized.includes('tenant mismatch'))
            return 'tenant_mismatch';
        if (normalized.includes('missing scope tenant'))
            return 'missing_scope_tenant';
        if (normalized.includes('missing cumulative tenant'))
            return 'missing_cumulative_tenant';
        if (normalized.includes('missing twid'))
            return 'missing_twid';
        if (normalized.includes('external gate worker unavailable')) {
            return 'external_worker_unavailable';
        }
        if (normalized.includes('external gate worker returned invalid json')) {
            return 'external_worker_invalid_json';
        }
        if (normalized.includes('external gate check failed'))
            return 'external_worker_request_failed';
        if (normalized.includes('external gate returned http'))
            return 'external_worker_http_error';
        if (normalized.includes('twip context signal unavailable'))
            return 'twip_context_unavailable';
        if (normalized.includes('twip context stale'))
            return 'twip_context_stale';
        if (normalized.includes('twip context risk critical'))
            return 'twip_context_risk_critical';
        if (normalized.includes('twip context risk high'))
            return 'twip_context_risk_high';
        if (normalized.includes('twip context risk medium'))
            return 'twip_context_risk_medium';
        if (normalized.includes('twip context risk low'))
            return 'twip_context_risk_low';
        if (normalized.includes('endpoint missing') || normalized.includes('endpoint not configured')) {
            return 'endpoint_missing';
        }
        if (normalized.includes('external gate check failed'))
            return 'external_gate_check_failed';
        if (normalized.includes('external gate check'))
            return 'external_gate_issue';
        return 'other';
    }
    async shutdown() {
        this.running = false;
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        try {
            const nowIso = new Date().toISOString();
            if (this.upstash) {
                const existing = await this.upstash.hget(CONFIG.AGENT_REGISTRY_KEY, this.brokerId);
                const parsed = existing ? JSON.parse(existing) : {};
                await this.upstash.hset(CONFIG.AGENT_REGISTRY_KEY, {
                    [this.brokerId]: JSON.stringify({
                        ...parsed,
                        id: this.brokerId,
                        role: 'broker',
                        status: 'offline',
                        isOnline: false,
                        lastSeen: nowIso,
                    }),
                });
            }
            else if (this.redis) {
                const existing = await this.redis.hget(CONFIG.AGENT_REGISTRY_KEY, this.brokerId);
                const parsed = existing ? JSON.parse(existing) : {};
                await this.redis.hset(CONFIG.AGENT_REGISTRY_KEY, this.brokerId, JSON.stringify({
                    ...parsed,
                    id: this.brokerId,
                    role: 'broker',
                    status: 'offline',
                    isOnline: false,
                    lastSeen: nowIso,
                }));
            }
        }
        catch {
            // best effort
        }
        if (this.redisBlocking)
            await this.redisBlocking.quit();
        if (this.redis)
            await this.redis.quit();
        this.upstash = null;
    }
}
const broker = new BrokerAgent();
process.on('SIGINT', async () => {
    await broker.shutdown();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await broker.shutdown();
    process.exit(0);
});
void broker.start().catch(async (error) => {
    console.error('[Broker] Fatal startup error:', error.message);
    await broker.shutdown();
    process.exit(1);
});
//# sourceMappingURL=broker-agent.js.map