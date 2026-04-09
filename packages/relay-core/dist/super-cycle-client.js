#!/usr/bin/env node
"use strict";
/**
 * Super-Cycle Client
 *
 * Publishes scheduled process lifecycle events into TNF ingress so the
 * master clock can treat cron/automation loops as first-class participants.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const ioredis_1 = __importDefault(require("ioredis"));
const DEFAULTS = {
    redisUrl: process.env.REDIS_URL ||
        process.env.RAILWAY_REDIS_URL ||
        process.env.LIVE_REDIS_URL ||
        process.env.REDIS_PRIVATE_URL ||
        process.env.REDIS_TLS_URL ||
        'redis://localhost:6379',
    ingress: process.env.TNF_INGRESS_CHANNEL || 'tnf:bus:ingress',
    selfPromptKey: process.env.TNF_SELF_PROMPT_KEY || 'tnf:master:self-prompts',
    processId: process.env.SUPER_CYCLE_PROCESS_ID || '',
    processName: process.env.SUPER_CYCLE_PROCESS_NAME || '',
    owner: process.env.SUPER_CYCLE_OWNER || process.env.USER || 'unknown',
    kind: process.env.SUPER_CYCLE_KIND || 'scheduled-job',
    status: process.env.SUPER_CYCLE_STATUS || 'running',
};
function parseArgs(argv) {
    const getValue = (flag) => {
        const idx = argv.indexOf(flag);
        if (idx === -1 || idx === argv.length - 1)
            return '';
        return argv[idx + 1];
    };
    const action = (getValue('--action') || 'heartbeat');
    const processId = getValue('--process-id') || DEFAULTS.processId;
    const name = getValue('--name') || DEFAULTS.processName || processId;
    const status = getValue('--status') || DEFAULTS.status;
    const kind = getValue('--kind') || DEFAULTS.kind;
    const owner = getValue('--owner') || DEFAULTS.owner;
    const lastResult = getValue('--result') || undefined;
    const lastRunAt = parseTimestampMs(getValue('--last-run-at')) || undefined;
    const nextExpectedAt = parseTimestampMs(getValue('--next-expected-at')) || undefined;
    const intendedIntervalMs = parsePositiveNumber(getValue('--interval-ms')) ||
        toMilliseconds(parsePositiveNumber(getValue('--interval-seconds'))) ||
        parsePositiveNumber(process.env.SUPER_CYCLE_INTENDED_INTERVAL_MS || '') ||
        toMilliseconds(parsePositiveNumber(process.env.SUPER_CYCLE_INTERVAL_SECONDS || '')) ||
        undefined;
    const metadataRaw = getValue('--metadata');
    let metadata = {};
    if (metadataRaw) {
        try {
            metadata = JSON.parse(metadataRaw);
        }
        catch (error) {
            throw new Error(`Invalid --metadata JSON: ${error.message}`);
        }
    }
    if (action !== 'status' && action !== 'self-prompts' && !processId) {
        throw new Error('Missing process identifier. Use --process-id or SUPER_CYCLE_PROCESS_ID.');
    }
    return {
        action,
        processId,
        name,
        status,
        kind,
        owner,
        lastResult,
        lastRunAt,
        nextExpectedAt,
        intendedIntervalMs,
        metadata,
    };
}
function mapActionToType(action) {
    switch (action) {
        case 'register':
            return 'SUPER_CYCLE_REGISTER';
        case 'unregister':
            return 'SUPER_CYCLE_UNREGISTER';
        case 'heartbeat':
            return 'SUPER_CYCLE_HEARTBEAT';
        default:
            return 'SUPER_CYCLE_STATUS';
    }
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    // Use unified standalone utilities
    const redis = (0, infrastructure_1.createStandaloneRedisClient)({ lazyConnect: true });
    const upstash = (0, infrastructure_1.createUpstashRestClient)();
    if (redis instanceof ioredis_1.default) {
        redis.on('error', (err) => {
            console.error(`[super-cycle] redis error: ${err?.message || String(err)}`);
        });
        await redis.connect().catch(() => { });
    }
    try {
        if (args.action === 'status') {
            let raw = null;
            if (upstash) {
                // @ts-ignore TS2347 Temporary fix for TypeScript 5.9 regression
                raw = await upstash.hget('tnf:master:state', 'superCycle');
            }
            else if (redis) {
                raw = await redis.hget('tnf:master:state', 'superCycle');
            }
            if (!raw) {
                console.log('[super-cycle] no super-cycle state found');
                return;
            }
            console.log(raw);
            return;
        }
        if (args.action === 'self-prompts') {
            const limit = Math.max(parseInt(process.env.SELF_PROMPT_STATUS_LIMIT || '20', 10), 1);
            let rows = [];
            if (upstash) {
                rows = await upstash.lrange(DEFAULTS.selfPromptKey, 0, limit - 1);
            }
            else if (redis) {
                rows = await redis.lrange(DEFAULTS.selfPromptKey, 0, limit - 1);
            }
            if (!rows.length) {
                console.log(`[super-cycle] no self-prompts found in ${DEFAULTS.selfPromptKey}`);
                return;
            }
            console.log(JSON.stringify(rows.map((row) => JSON.parse(row)), null, 2));
            return;
        }
        const now = Date.now();
        const lastRunAt = args.lastRunAt || now;
        const metadataCadenceMs = readCadenceMs(args.metadata);
        const intendedIntervalMs = args.intendedIntervalMs || metadataCadenceMs;
        const intervalSource = args.intendedIntervalMs
            ? 'producer'
            : metadataCadenceMs
                ? 'metadata'
                : 'inferred';
        const nextExpectedAt = args.nextExpectedAt || (intendedIntervalMs ? lastRunAt + intendedIntervalMs : undefined);
        const metadata = intendedIntervalMs && !args.metadata.intendedIntervalMs
            ? { ...args.metadata, intendedIntervalMs }
            : args.metadata;
        const event = {
            type: mapActionToType(args.action),
            source: `super-cycle-client:${args.processId}`,
            timestamp: now,
            payload: {
                processId: args.processId,
                name: args.name,
                kind: args.kind,
                owner: args.owner,
                status: args.status,
                lastRunAt,
                intendedIntervalMs,
                intervalSource,
                intervalExact: Boolean(intendedIntervalMs),
                nextExpectedAt,
                lastResult: args.lastResult,
                metadata,
            },
        };
        if (upstash) {
            await upstash.publish(DEFAULTS.ingress, JSON.stringify(event));
        }
        else if (redis) {
            await redis.publish(DEFAULTS.ingress, JSON.stringify(event));
        }
        console.log(`[super-cycle] sent ${event.type} for ${args.processId}`);
    }
    finally {
        if (redis instanceof ioredis_1.default)
            await redis.quit();
    }
}
function parsePositiveNumber(value) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0)
        return parsed;
    return undefined;
}
function parseTimestampMs(value) {
    if (!value)
        return undefined;
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0)
        return numeric;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed) && parsed > 0)
        return parsed;
    return undefined;
}
function toMilliseconds(seconds) {
    if (!seconds || !Number.isFinite(seconds) || seconds <= 0)
        return undefined;
    return seconds * 1000;
}
function readCadenceMs(metadata) {
    const intervalMs = Number(metadata.intendedIntervalMs ||
        metadata.expectedIntervalMs ||
        metadata.intervalMs ||
        metadata.heartbeatIntervalMs ||
        0);
    if (Number.isFinite(intervalMs) && intervalMs > 0)
        return intervalMs;
    const intervalSeconds = Number(metadata.intendedIntervalSeconds ||
        metadata.intervalSeconds ||
        metadata.heartbeatIntervalSeconds ||
        metadata.cadenceSeconds ||
        0);
    if (Number.isFinite(intervalSeconds) && intervalSeconds > 0)
        return intervalSeconds * 1000;
    return undefined;
}
main().catch((error) => {
    const message = error?.message || String(error);
    console.error(`[super-cycle] failed: ${message}`);
    if (message.toLowerCase().includes('aggregateerror') ||
        message.toLowerCase().includes('connect')) {
        console.error(`[super-cycle] hint: ensure Redis is reachable (REDIS_URL=${DEFAULTS.redisUrl}) and retry.`);
    }
    process.exit(1);
});
//# sourceMappingURL=super-cycle-client.js.map