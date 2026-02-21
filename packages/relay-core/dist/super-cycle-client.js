#!/usr/bin/env node
"use strict";
/**
 * Super-Cycle Client
 *
 * Publishes scheduled process lifecycle events into TNF ingress so the
 * master clock can treat cron/automation loops as first-class participants.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
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
    const redis = (0, redis_1.createClient)({
        url: DEFAULTS.redisUrl,
        socket: {
            connectTimeout: 3000,
            reconnectStrategy: () => false,
        },
    });
    redis.on('error', (err) => {
        console.error(`[super-cycle] redis error: ${err?.message || String(err)}`);
    });
    await redis.connect();
    try {
        if (args.action === 'status') {
            const raw = await redis.hGet('tnf:master:state', 'superCycle');
            if (!raw) {
                console.log('[super-cycle] no super-cycle state found');
                return;
            }
            console.log(raw);
            return;
        }
        if (args.action === 'self-prompts') {
            const limit = Math.max(parseInt(process.env.SELF_PROMPT_STATUS_LIMIT || '20', 10), 1);
            const rows = await redis.lRange(DEFAULTS.selfPromptKey, 0, limit - 1);
            if (!rows.length) {
                console.log(`[super-cycle] no self-prompts found in ${DEFAULTS.selfPromptKey}`);
                return;
            }
            console.log(JSON.stringify(rows.map((row) => JSON.parse(row)), null, 2));
            return;
        }
        const now = Date.now();
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
                lastRunAt: now,
                lastResult: args.lastResult,
                metadata: args.metadata,
            },
        };
        await redis.publish(DEFAULTS.ingress, JSON.stringify(event));
        console.log(`[super-cycle] sent ${event.type} for ${args.processId}`);
    }
    finally {
        await redis.quit();
    }
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