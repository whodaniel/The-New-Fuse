import crypto from 'crypto';

// @ts-ignore
import { createStandaloneRedisClient, createUpstashRestClient } from '@the-new-fuse/infrastructure';
import Redis, { Cluster } from 'ioredis';

import {
  HandoffAck,
  HandoffAckInput,
  HandoffPacket,
  HandoffPacketInput,
  type HandoffAck as HandoffAckType,
  type HandoffPacket as HandoffPacketType,
  type HandoffStatus,
} from '../protocol/handoff-protocol.js';

interface HandoffStoreOptions {
  redisUrl?: string;
  keyPrefix?: string;
  defaultTtlSeconds?: number;
  maxInboxItemsPerAgent?: number;
  now?: () => Date;
}

interface ListForAgentOptions {
  limit?: number;
  includeAcknowledged?: boolean;
}

interface AgentHandoffView {
  packet: HandoffPacketType;
  ack: {
    status: HandoffStatus;
    note?: string;
    ackedAt: string;
  } | null;
}

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const DEFAULT_MAX_INBOX_ITEMS = 2000;

export class HandoffStoreService {
  private client: Redis | Cluster | null = null;
  private upstash: any = null;
  private readonly keyPrefix: string;
  private readonly defaultTtlSeconds: number;
  private readonly maxInboxItemsPerAgent: number;
  private readonly now: () => Date;
  private connected = false;

  constructor(options: HandoffStoreOptions = {}) {
    this.keyPrefix = options.keyPrefix ?? 'tnf:handoff:v1';
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS;
    this.maxInboxItemsPerAgent = options.maxInboxItemsPerAgent ?? DEFAULT_MAX_INBOX_ITEMS;
    this.now = options.now ?? (() => new Date());
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.client = createStandaloneRedisClient({ lazyConnect: true } as any);
    this.upstash = createUpstashRestClient();

    if (this.client instanceof Redis) {
      await this.client.connect().catch(() => {});
    }

    this.connected = true;
  }

  async close(): Promise<void> {
    if (!this.connected) {
      return;
    }
    if (this.client) await this.client.quit();
    this.upstash = null;
    this.connected = false;
  }

  async publish(input: HandoffPacketInput): Promise<HandoffPacketType> {
    await this.connect();

    const now = this.now();
    const expiresAt =
      input.expiresAt ?? new Date(now.getTime() + this.defaultTtlSeconds * 1000).toISOString();

    const packet = HandoffPacket.parse({
      ...input,
      id: crypto.randomUUID(),
      version: '1.1',
      createdAt: now.toISOString(),
      expiresAt,
      status: 'pending',
    });

    const ttlSeconds = this.computeTtlSeconds(packet.expiresAt);
    const packetKey = this.packetKey(packet.id);

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
    } else if (this.client) {
      const multi = (this.client as any).multi();
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
    }

    return packet;
  }

  async getPacket(packetId: string): Promise<HandoffPacketType | null> {
    await this.connect();

    let raw: string | null = null;
    if (this.upstash) {
      raw = await this.upstash.get<string>(this.packetKey(packetId));
    } else if (this.client) {
      raw = await this.client.get(this.packetKey(packetId));
    }

    if (!raw) {
      return null;
    }

    return this.parsePacket(raw);
  }

  async listForAgent(
    agentId: string,
    options: ListForAgentOptions = {}
  ): Promise<AgentHandoffView[]> {
    await this.connect();

    const limit = Math.max(options.limit ?? 20, 1);
    const includeAcknowledged = options.includeAcknowledged ?? false;
    const result: AgentHandoffView[] = [];

    const inboxKey = this.agentInboxKey(agentId);
    let candidateIds: string[] = [];

    if (this.upstash) {
      candidateIds = await this.upstash.lrange(inboxKey, 0, limit * 10 - 1);
    } else if (this.client) {
      candidateIds = await this.client.lrange(inboxKey, 0, limit * 10 - 1);
    }

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

  async acknowledge(input: HandoffAckInput): Promise<HandoffAckType> {
    await this.connect();

    const ack = HandoffAck.parse({
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

    if (this.upstash) {
      await this.upstash.hset(ackKey, { [ack.agentId]: JSON.stringify(ack) });
      await this.upstash.expire(ackKey, ttlSeconds);
    } else if (this.client) {
      await this.client.hset(ackKey, ack.agentId, JSON.stringify(ack));
      await this.client.expire(ackKey, ttlSeconds);
    }

    return ack;
  }

  async listBySession(sessionKey: string, limit = 50): Promise<HandoffPacketType[]> {
    await this.connect();

    const key = this.sessionIndexKey(sessionKey);
    let ids: string[] = [];

    if (this.upstash) {
      ids = await this.upstash.lrange(key, 0, Math.max(limit, 1) - 1);
    } else if (this.client) {
      ids = await this.client.lrange(key, 0, Math.max(limit, 1) - 1);
    }

    const packets: HandoffPacketType[] = [];

    for (const id of ids) {
      const packet = await this.getPacket(id);
      if (packet && !this.isExpired(packet.expiresAt)) {
        packets.push(packet);
      }
    }

    return packets;
  }

  private async getAck(
    packetId: string,
    agentId: string
  ): Promise<{
    status: HandoffStatus;
    note?: string;
    ackedAt: string;
  } | null> {
    let raw: string | null = null;
    const key = this.ackKey(packetId);

    if (this.upstash) {
      raw = await this.upstash.hget<string>(key, agentId);
    } else if (this.client) {
      raw = await this.client.hget(key, agentId);
    }

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

  private packetKey(packetId: string): string {
    return `${this.keyPrefix}:packet:${packetId}`;
  }

  private ackKey(packetId: string): string {
    return `${this.keyPrefix}:ack:${packetId}`;
  }

  private agentInboxKey(agentId: string): string {
    return `${this.keyPrefix}:inbox:agent:${agentId}`;
  }

  private sessionIndexKey(sessionKey: string): string {
    return `${this.keyPrefix}:index:session:${sessionKey}`;
  }

  private parsePacket(raw: string): HandoffPacketType | null {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !('version' in parsed)) {
        parsed.version = '1.0';
      }
      return HandoffPacket.parse(parsed);
    } catch {
      return null;
    }
  }

  private parseAck(raw: string): HandoffAckType | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      return HandoffAck.parse(parsed);
    } catch {
      return null;
    }
  }

  private isExpired(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() <= this.now().getTime();
  }

  private computeTtlSeconds(expiresAt: string): number {
    const remainingSeconds = Math.ceil(
      (new Date(expiresAt).getTime() - this.now().getTime()) / 1000
    );
    return Math.max(remainingSeconds, 1);
  }
}
