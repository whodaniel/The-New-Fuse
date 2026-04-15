import crypto from 'crypto';

import { createClient, type RedisClientType } from 'redis';

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
  private readonly client: RedisClientType;
  private readonly keyPrefix: string;
  private readonly defaultTtlSeconds: number;
  private readonly maxInboxItemsPerAgent: number;
  private readonly now: () => Date;
  private connected = false;

  constructor(options: HandoffStoreOptions = {}) {
    this.client = createClient(options.redisUrl ? { url: options.redisUrl } : undefined);
    this.keyPrefix = options.keyPrefix ?? 'tnf:handoff:v1';
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS;
    this.maxInboxItemsPerAgent = options.maxInboxItemsPerAgent ?? DEFAULT_MAX_INBOX_ITEMS;
    this.now = options.now ?? (() => new Date());
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    await this.client.connect();
    this.connected = true;
  }

  async close(): Promise<void> {
    if (!this.connected) {
      return;
    }
    await this.client.quit();
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
      version: '1.0',
      createdAt: now.toISOString(),
      expiresAt,
      status: 'pending',
    });

    const ttlSeconds = this.computeTtlSeconds(packet.expiresAt);
    const multi = this.client.multi();

    const packetKey = this.packetKey(packet.id);
    multi.set(packetKey, JSON.stringify(packet));
    multi.expire(packetKey, ttlSeconds);

    for (const agentId of packet.targets.agentIds) {
      const inboxKey = this.agentInboxKey(agentId);
      multi.lPush(inboxKey, packet.id);
      multi.lTrim(inboxKey, 0, Math.max(this.maxInboxItemsPerAgent - 1, 0));
      multi.expire(inboxKey, ttlSeconds);
    }

    if (packet.scope.sessionKey) {
      const sessionKey = this.sessionIndexKey(packet.scope.sessionKey);
      multi.lPush(sessionKey, packet.id);
      multi.lTrim(sessionKey, 0, Math.max(this.maxInboxItemsPerAgent - 1, 0));
      multi.expire(sessionKey, ttlSeconds);
    }

    await multi.exec();
    return packet;
  }

  async getPacket(packetId: string): Promise<HandoffPacketType | null> {
    await this.connect();

    const raw = await this.client.get(this.packetKey(packetId));
    if (!raw) {
      return null;
    }

    return this.parsePacket(raw);
  }

  async listForAgent(agentId: string, options: ListForAgentOptions = {}): Promise<AgentHandoffView[]> {
    await this.connect();

    const limit = Math.max(options.limit ?? 20, 1);
    const includeAcknowledged = options.includeAcknowledged ?? false;
    const result: AgentHandoffView[] = [];

    // Overscan to account for expired/invalid/acked packets while returning `limit` results.
    const candidateIds = await this.client.lRange(this.agentInboxKey(agentId), 0, limit * 10 - 1);

    for (const packetId of candidateIds) {
      if (result.length >= limit) {
        break;
      }

      const rawPacket = await this.client.get(this.packetKey(packetId));
      if (!rawPacket) {
        continue;
      }

      const packet = this.parsePacket(rawPacket);
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
      throw new Error(
        `Agent ${ack.agentId} is not a target for packet ${ack.packetId}`
      );
    }

    const ackKey = this.ackKey(ack.packetId);
    await this.client.hSet(ackKey, ack.agentId, JSON.stringify(ack));
    await this.client.expire(ackKey, this.computeTtlSeconds(packet.expiresAt));

    return ack;
  }

  async listBySession(sessionKey: string, limit = 50): Promise<HandoffPacketType[]> {
    await this.connect();

    const ids = await this.client.lRange(this.sessionIndexKey(sessionKey), 0, Math.max(limit, 1) - 1);
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
    const raw = await this.client.hGet(this.ackKey(packetId), agentId);
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
      const parsed: unknown = JSON.parse(raw);
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
    const remainingSeconds = Math.ceil((new Date(expiresAt).getTime() - this.now().getTime()) / 1000);
    return Math.max(remainingSeconds, 1);
  }
}
