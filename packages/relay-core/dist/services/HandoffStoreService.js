"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoffStoreService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const handoff_protocol_js_1 = require("../protocol/handoff-protocol.js");
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const DEFAULT_MAX_INBOX_ITEMS = 2000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 100;
class HandoffStoreService {
    constructor(options = {}) {
        this.client = null;
        this.upstash = null;
        this.connected = false;
        this.keyPrefix = options.keyPrefix ?? 'tnf:handoff:v1';
        this.defaultTtlSeconds = options.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS;
        this.maxInboxItemsPerAgent = options.maxInboxItemsPerAgent ?? DEFAULT_MAX_INBOX_ITEMS;
        this.maxRetries = Math.max(options.maxRetries ?? DEFAULT_MAX_RETRIES, 0);
        this.retryBaseDelayMs = Math.max(options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS, 0);
        this.now = options.now ?? (() => new Date());
    }
    async connect() {
        if (this.connected) {
            return;
        }
        this.client = (0, infrastructure_1.createStandaloneRedisClient)({ lazyConnect: true });
        this.upstash = (0, infrastructure_1.createUpstashRestClient)();
        await (0, infrastructure_1.connectStandaloneRedisClient)(this.client).catch(() => { });
        this.connected = true;
    }
    async close() {
        if (!this.connected) {
            return;
        }
        if (this.client)
            await this.client.quit();
        this.upstash = null;
        this.connected = false;
    }
    async publish(input) {
        await this.connect();
        const now = this.now();
        const expiresAt = input.expiresAt ?? new Date(now.getTime() + this.defaultTtlSeconds * 1000).toISOString();
        const packet = handoff_protocol_js_1.HandoffPacket.parse({
            ...input,
            id: crypto_1.default.randomUUID(),
            version: '1.1',
            createdAt: now.toISOString(),
            expiresAt,
            status: 'pending',
        });
        const ttlSeconds = this.computeTtlSeconds(packet.expiresAt);
        const packetKey = this.packetKey(packet.id);
        await this.withRetry('publish handoff packet', async () => {
            if (this.upstash) {
                const pipeline = this.upstash.pipeline();
                pipeline.set(packetKey, JSON.stringify(packet), { ex: ttlSeconds });
                for (const agentId of packet.targets.agentIds) {
                    const inboxKey = this.agentInboxKey(agentId);
                    pipeline.lpush(inboxKey, packet.id);
                    pipeline.ltrim(inboxKey, 0, Math.max(this.maxInboxItemsPerAgent - 1, 0));
                    pipeline.expire(inboxKey, ttlSeconds);
                }
                if (packet.scope.sessionKey) {
                    const sessionKey = this.sessionIndexKey(packet.scope.sessionKey);
                    pipeline.lpush(sessionKey, packet.id);
                    pipeline.ltrim(sessionKey, 0, Math.max(this.maxInboxItemsPerAgent - 1, 0));
                    pipeline.expire(sessionKey, ttlSeconds);
                }
                await pipeline.exec();
                return;
            }
            if (this.client) {
                const multi = this.client.multi();
                multi.set(packetKey, JSON.stringify(packet), 'EX', ttlSeconds);
                for (const agentId of packet.targets.agentIds) {
                    const inboxKey = this.agentInboxKey(agentId);
                    multi.lpush(inboxKey, packet.id);
                    multi.ltrim(inboxKey, 0, Math.max(this.maxInboxItemsPerAgent - 1, 0));
                    multi.expire(inboxKey, ttlSeconds);
                }
                if (packet.scope.sessionKey) {
                    const sessionKey = this.sessionIndexKey(packet.scope.sessionKey);
                    multi.lpush(sessionKey, packet.id);
                    multi.ltrim(sessionKey, 0, Math.max(this.maxInboxItemsPerAgent - 1, 0));
                    multi.expire(sessionKey, ttlSeconds);
                }
                await multi.exec();
                return;
            }
            throw new Error('No handoff store backend is available');
        });
        return packet;
    }
    async getPacket(packetId) {
        await this.connect();
        let raw = null;
        raw = await this.withRetry('get handoff packet', async () => {
            if (this.upstash) {
                // @ts-ignore TS2347 Temporary fix for TypeScript 5.9 regression
                return await this.upstash.get(this.packetKey(packetId));
            }
            if (this.client) {
                return await this.client.get(this.packetKey(packetId));
            }
            throw new Error('No handoff store backend is available');
        });
        if (!raw) {
            return null;
        }
        return this.parsePacket(raw);
    }
    async listForAgent(agentId, options = {}) {
        await this.connect();
        const limit = Math.max(options.limit ?? 20, 1);
        const includeAcknowledged = options.includeAcknowledged ?? false;
        const result = [];
        const inboxKey = this.agentInboxKey(agentId);
        let candidateIds = [];
        candidateIds = await this.withRetry('list handoff inbox', async () => {
            if (this.upstash) {
                return await this.upstash.lrange(inboxKey, 0, limit * 10 - 1);
            }
            if (this.client) {
                return await this.client.lrange(inboxKey, 0, limit * 10 - 1);
            }
            throw new Error('No handoff store backend is available');
        });
        for (const packetId of candidateIds) {
            if (result.length >= limit) {
                break;
            }
            const packet = await this.getPacket(packetId);
            if (!packet) {
                continue;
            }
            if (this.isExpired(packet.expiresAt)) {
                continue;
            }
            const ack = await this.getAck(packet.id, agentId);
            if (!includeAcknowledged && ack) {
                continue;
            }
            result.push({ packet, ack });
        }
        return result;
    }
    async acknowledge(input) {
        await this.connect();
        const ack = handoff_protocol_js_1.HandoffAck.parse({
            ...input,
            ackedAt: this.now().toISOString(),
        });
        const packet = await this.getPacket(ack.packetId);
        if (!packet) {
            throw new Error(`Cannot acknowledge missing packet: ${ack.packetId}`);
        }
        if (!packet.targets.agentIds.includes(ack.agentId)) {
            throw new Error(`Agent ${ack.agentId} is not a target for packet ${ack.packetId}`);
        }
        const ackKey = this.ackKey(ack.packetId);
        const ttlSeconds = this.computeTtlSeconds(packet.expiresAt);
        await this.withRetry('acknowledge handoff packet', async () => {
            if (this.upstash) {
                await this.upstash.hset(ackKey, { [ack.agentId]: JSON.stringify(ack) });
                await this.upstash.expire(ackKey, ttlSeconds);
                return;
            }
            if (this.client) {
                await this.client.hset(ackKey, ack.agentId, JSON.stringify(ack));
                await this.client.expire(ackKey, ttlSeconds);
                return;
            }
            throw new Error('No handoff store backend is available');
        });
        return ack;
    }
    async listBySession(sessionKey, limit = 50) {
        await this.connect();
        const ids = await this.withRetry('list session handoffs', async () => {
            if (this.upstash) {
                return await this.upstash.lrange(this.sessionIndexKey(sessionKey), 0, Math.max(limit, 1) - 1);
            }
            if (this.client) {
                return await this.client.lrange(this.sessionIndexKey(sessionKey), 0, Math.max(limit, 1) - 1);
            }
            throw new Error('No handoff store backend is available');
        });
        const packets = [];
        for (const id of ids) {
            const packet = await this.getPacket(id);
            if (packet && !this.isExpired(packet.expiresAt)) {
                packets.push(packet);
            }
        }
        return packets;
    }
    async getAck(packetId, agentId) {
        let raw = null;
        const key = this.ackKey(packetId);
        raw = await this.withRetry('get handoff ack', async () => {
            // @ts-ignore TS2347 Temporary fix for TypeScript 5.9 regression
            if (this.upstash) {
                return await this.upstash.hget(key, agentId);
            }
            if (this.client) {
                return await this.client.hget(key, agentId);
            }
            throw new Error('No handoff store backend is available');
        });
        if (!raw) {
            return null;
        }
        const parsed = this.parseAck(raw);
        if (!parsed) {
            return null;
        }
        return {
            status: parsed.status,
            note: parsed.note,
            ackedAt: parsed.ackedAt,
        };
    }
    packetKey(packetId) {
        return `${this.keyPrefix}:packet:${packetId}`;
    }
    ackKey(packetId) {
        return `${this.keyPrefix}:ack:${packetId}`;
    }
    agentInboxKey(agentId) {
        return `${this.keyPrefix}:inbox:agent:${agentId}`;
    }
    sessionIndexKey(sessionKey) {
        return `${this.keyPrefix}:index:session:${sessionKey}`;
    }
    parsePacket(raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !('version' in parsed)) {
                parsed.version = '1.0';
            }
            return handoff_protocol_js_1.HandoffPacket.parse(parsed);
        }
        catch {
            return null;
        }
    }
    parseAck(raw) {
        try {
            const parsed = JSON.parse(raw);
            return handoff_protocol_js_1.HandoffAck.parse(parsed);
        }
        catch {
            return null;
        }
    }
    isExpired(expiresAt) {
        return new Date(expiresAt).getTime() <= this.now().getTime();
    }
    computeTtlSeconds(expiresAt) {
        const remainingSeconds = Math.ceil((new Date(expiresAt).getTime() - this.now().getTime()) / 1000);
        return Math.max(remainingSeconds, 1);
    }
    async withRetry(operation, fn) {
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt >= this.maxRetries) {
                    break;
                }
                await this.sleep(this.retryBaseDelayMs * 2 ** attempt);
            }
        }
        const message = lastError instanceof Error ? lastError.message : String(lastError);
        throw new Error(`Handoff store ${operation} failed after ${this.maxRetries + 1} attempt(s): ${message}`);
    }
    sleep(ms) {
        if (ms <= 0) {
            return Promise.resolve();
        }
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.HandoffStoreService = HandoffStoreService;
//# sourceMappingURL=HandoffStoreService.js.map