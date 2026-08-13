/**
 * Handoff packet lifecycle: verify → soft-retire → archive → purge.
 *
 * See docs/protocols/HANDOFF_PACKET_LIFECYCLE.md
 *
 * Role and platform are orthogonal — this operates on packet/inbox keys only.
 */

export type RedisLifecycleClient = {
  keys(pattern: string): Promise<string[]>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: Array<string | number>): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  lrem(key: string, count: number, value: string): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<unknown>;
  expire(key: string, seconds: number): Promise<unknown>;
  hgetall(key: string): Promise<Record<string, string>>;
};

export type HandoffVerificationReceipt = {
  packetId: string;
  verifiedAt: string;
  verifiedBy: string;
  result: 'pass' | 'fail';
  evidenceRefs: string[];
  note?: string;
};

export type LifecycleDisposition =
  | 'active'
  | 'dangling'
  | 'expired'
  | 'verified_in_grace'
  | 'archive_ready'
  | 'incomplete_terminal';

export type SweepHandoffLifecycleOptions = {
  keyPrefix?: string;
  /** Max inbox keys to scan this pass. */
  maxInboxes?: number;
  /** Max packet ids to inspect across all inboxes. */
  maxPackets?: number;
  /** Soft-retire only; skip archive deletes. */
  softRetireOnly?: boolean;
  /** Grace after verifiedAt before archive (ms). Default 24h. */
  archiveGraceMs?: number;
  /** TTL for archive:packet keys (seconds). Default 90d. */
  archiveTtlSeconds?: number;
  /** Cap length of archive:index. */
  maxArchiveIndex?: number;
  now?: () => Date;
  dryRun?: boolean;
};

export type SweepHandoffLifecycleResult = {
  inboxesScanned: number;
  packetsInspected: number;
  danglingRemoved: number;
  expiredRemoved: number;
  softRetired: number;
  archived: number;
  skipped: number;
  dispositions: Record<LifecycleDisposition, number>;
  dryRun: boolean;
};

const DEFAULT_PREFIX = 'tnf:handoff:v1';
const DEFAULT_MAX_INBOXES = 200;
const DEFAULT_MAX_PACKETS = 2000;
const DEFAULT_ARCHIVE_GRACE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_ARCHIVE_TTL_SECONDS = 90 * 24 * 60 * 60;
const DEFAULT_MAX_ARCHIVE_INDEX = 5000;
const TERMINAL_ACK = new Set(['completed', 'rejected']);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function packetKey(packetId: string, keyPrefix = DEFAULT_PREFIX): string {
  return `${keyPrefix}:packet:${packetId}`;
}

export function ackKey(packetId: string, keyPrefix = DEFAULT_PREFIX): string {
  return `${keyPrefix}:ack:${packetId}`;
}

export function verifyKey(packetId: string, keyPrefix = DEFAULT_PREFIX): string {
  return `${keyPrefix}:verify:${packetId}`;
}

export function archivePacketKey(packetId: string, keyPrefix = DEFAULT_PREFIX): string {
  return `${keyPrefix}:archive:packet:${packetId}`;
}

export function archiveIndexKey(keyPrefix = DEFAULT_PREFIX): string {
  return `${keyPrefix}:archive:index`;
}

export function agentInboxKeys(agentId: string, keyPrefix = DEFAULT_PREFIX): string[] {
  return [`${keyPrefix}:inbox:${agentId}`, `${keyPrefix}:inbox:agent:${agentId}`];
}

export function sessionIndexKey(sessionKey: string, keyPrefix = DEFAULT_PREFIX): string {
  return `${keyPrefix}:index:session:${sessionKey}`;
}

export function parseInboxAgentId(key: string, keyPrefix = DEFAULT_PREFIX): string | null {
  const store = new RegExp(`^${escapeRegExp(keyPrefix)}:inbox:agent:(.+)$`);
  const legacy = new RegExp(`^${escapeRegExp(keyPrefix)}:inbox:(.+)$`);
  const storeMatch = key.match(store);
  if (storeMatch) return storeMatch[1];
  const legacyMatch = key.match(legacy);
  if (legacyMatch && !legacyMatch[1].startsWith('agent:')) return legacyMatch[1];
  return null;
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isTerminalAckStatus(status: string | undefined | null): boolean {
  return TERMINAL_ACK.has(String(status || '').toLowerCase());
}

export function hasTerminalCoverage(
  packet: { targets?: { agentIds?: string[] } },
  acksByAgent: Record<string, { status?: string } | null>
): boolean {
  const agents = packet?.targets?.agentIds || [];
  if (agents.length === 0) return false;
  return agents.every((id) => isTerminalAckStatus(acksByAgent[id]?.status));
}

export function parseVerificationReceipt(raw: string | null): HandoffVerificationReceipt | null {
  const parsed = parseJson<HandoffVerificationReceipt>(raw);
  if (!parsed?.packetId || !parsed.verifiedAt || !parsed.verifiedBy) return null;
  if (parsed.result !== 'pass' && parsed.result !== 'fail') return null;
  if (!Array.isArray(parsed.evidenceRefs) || parsed.evidenceRefs.length === 0) return null;
  return parsed;
}

export function classifyPacketLifecycle(input: {
  packet: Record<string, any> | null;
  acksByAgent: Record<string, { status?: string } | null>;
  verification: HandoffVerificationReceipt | null;
  now: Date;
  archiveGraceMs: number;
}): LifecycleDisposition {
  if (!input.packet) return 'dangling';

  const expiresAt = input.packet.expiresAt ? new Date(input.packet.expiresAt).getTime() : NaN;
  if (Number.isFinite(expiresAt) && expiresAt <= input.now.getTime()) {
    if (input.verification?.result === 'pass') {
      const verifiedAt = new Date(input.verification.verifiedAt).getTime();
      if (Number.isFinite(verifiedAt) && input.now.getTime() - verifiedAt >= input.archiveGraceMs) {
        return 'archive_ready';
      }
      return 'verified_in_grace';
    }
    return 'expired';
  }

  if (input.verification?.result === 'pass') {
    if (!hasTerminalCoverage(input.packet, input.acksByAgent)) {
      // Verify without terminal acks is invalid for retire; treat as active.
      return 'active';
    }
    const verifiedAt = new Date(input.verification.verifiedAt).getTime();
    if (Number.isFinite(verifiedAt) && input.now.getTime() - verifiedAt >= input.archiveGraceMs) {
      return 'archive_ready';
    }
    return 'verified_in_grace';
  }

  if (hasTerminalCoverage(input.packet, input.acksByAgent)) {
    return 'incomplete_terminal';
  }

  return 'active';
}

async function loadAcks(
  redis: RedisLifecycleClient,
  packetId: string,
  keyPrefix: string
): Promise<Record<string, { status?: string } | null>> {
  const raw = await redis.hgetall(ackKey(packetId, keyPrefix));
  const out: Record<string, { status?: string } | null> = {};
  for (const [agentId, value] of Object.entries(raw || {})) {
    out[agentId] = parseJson<{ status?: string }>(value);
  }
  return out;
}

export async function softRetirePacketFromLiveIndexes(
  redis: RedisLifecycleClient,
  packet: { id: string; targets?: { agentIds?: string[] }; scope?: { sessionKey?: string } },
  keyPrefix = DEFAULT_PREFIX,
  dryRun = false
): Promise<number> {
  let removed = 0;
  const agentIds = packet.targets?.agentIds || [];
  for (const agentId of agentIds) {
    for (const inbox of agentInboxKeys(agentId, keyPrefix)) {
      if (dryRun) {
        const ids = await redis.lrange(inbox, 0, -1);
        if (ids.includes(packet.id)) removed += 1;
      } else {
        removed += await redis.lrem(inbox, 0, packet.id);
      }
    }
  }
  if (packet.scope?.sessionKey) {
    const sessionKey = sessionIndexKey(packet.scope.sessionKey, keyPrefix);
    if (dryRun) {
      const ids = await redis.lrange(sessionKey, 0, -1);
      if (ids.includes(packet.id)) removed += 1;
    } else {
      removed += await redis.lrem(sessionKey, 0, packet.id);
    }
  }
  return removed;
}

export async function archiveVerifiedPacket(
  redis: RedisLifecycleClient,
  packetId: string,
  options: {
    keyPrefix?: string;
    archiveTtlSeconds?: number;
    maxArchiveIndex?: number;
    dryRun?: boolean;
  } = {}
): Promise<boolean> {
  const keyPrefix = options.keyPrefix ?? DEFAULT_PREFIX;
  const archiveTtlSeconds = options.archiveTtlSeconds ?? DEFAULT_ARCHIVE_TTL_SECONDS;
  const maxArchiveIndex = options.maxArchiveIndex ?? DEFAULT_MAX_ARCHIVE_INDEX;
  const dryRun = options.dryRun ?? false;

  const livePacketRaw = await redis.get(packetKey(packetId, keyPrefix));
  if (!livePacketRaw) return false;

  const packet = parseJson<Record<string, any>>(livePacketRaw);
  if (!packet) return false;

  const acks = await redis.hgetall(ackKey(packetId, keyPrefix));
  const verificationRaw = await redis.get(verifyKey(packetId, keyPrefix));
  const verification = parseVerificationReceipt(verificationRaw);
  if (!verification || verification.result !== 'pass') return false;

  const bundle = {
    archivedAt: new Date().toISOString(),
    packet,
    acks,
    verification,
  };

  if (!dryRun) {
    await softRetirePacketFromLiveIndexes(redis, packet as any, keyPrefix, false);
    await redis.set(
      archivePacketKey(packetId, keyPrefix),
      JSON.stringify(bundle),
      'EX',
      archiveTtlSeconds
    );
    await redis.lpush(archiveIndexKey(keyPrefix), packetId);
    await redis.ltrim(archiveIndexKey(keyPrefix), 0, Math.max(maxArchiveIndex - 1, 0));
    await redis.expire(archiveIndexKey(keyPrefix), archiveTtlSeconds);
    await redis.del(
      packetKey(packetId, keyPrefix),
      ackKey(packetId, keyPrefix),
      verifyKey(packetId, keyPrefix)
    );
  }

  return true;
}

export async function writeVerificationReceipt(
  redis: RedisLifecycleClient,
  receipt: HandoffVerificationReceipt,
  options: { keyPrefix?: string; ttlSeconds?: number } = {}
): Promise<HandoffVerificationReceipt> {
  const keyPrefix = options.keyPrefix ?? DEFAULT_PREFIX;
  if (!receipt.evidenceRefs?.length) {
    throw new Error('verification requires at least one evidenceRef');
  }
  if (receipt.result !== 'pass' && receipt.result !== 'fail') {
    throw new Error('verification result must be pass or fail');
  }

  const normalized: HandoffVerificationReceipt = {
    packetId: receipt.packetId,
    verifiedAt: receipt.verifiedAt || new Date().toISOString(),
    verifiedBy: receipt.verifiedBy,
    result: receipt.result,
    evidenceRefs: [...receipt.evidenceRefs],
    ...(receipt.note ? { note: receipt.note } : {}),
  };

  const packetRaw = await redis.get(packetKey(normalized.packetId, keyPrefix));
  if (!packetRaw) {
    throw new Error(`Cannot verify missing packet: ${normalized.packetId}`);
  }

  const packet = parseJson<{ targets?: { agentIds?: string[] } }>(packetRaw);
  const acks = await loadAcks(redis, normalized.packetId, keyPrefix);
  if (normalized.result === 'pass' && !hasTerminalCoverage(packet || {}, acks)) {
    throw new Error(
      `Cannot pass-verify packet ${normalized.packetId}: missing terminal acks for all targets`
    );
  }

  const packetExpiresAt = parseJson<{ expiresAt?: string }>(packetRaw)?.expiresAt;
  const remainingFromPacket = packetExpiresAt
    ? Math.ceil((new Date(packetExpiresAt).getTime() - Date.now()) / 1000)
    : 30 * 24 * 60 * 60;
  const ttl = options.ttlSeconds ?? Math.max(remainingFromPacket + 24 * 60 * 60, 24 * 60 * 60);

  await redis.set(verifyKey(normalized.packetId, keyPrefix), JSON.stringify(normalized), 'EX', ttl);

  if (normalized.result === 'pass' && packet) {
    await softRetirePacketFromLiveIndexes(redis, { id: normalized.packetId, ...packet }, keyPrefix);
  }

  return normalized;
}

export async function sweepHandoffPacketLifecycle(
  redis: RedisLifecycleClient,
  options: SweepHandoffLifecycleOptions = {}
): Promise<SweepHandoffLifecycleResult> {
  const keyPrefix = options.keyPrefix ?? DEFAULT_PREFIX;
  const maxInboxes = options.maxInboxes ?? DEFAULT_MAX_INBOXES;
  const maxPackets = options.maxPackets ?? DEFAULT_MAX_PACKETS;
  const archiveGraceMs = options.archiveGraceMs ?? DEFAULT_ARCHIVE_GRACE_MS;
  const archiveTtlSeconds = options.archiveTtlSeconds ?? DEFAULT_ARCHIVE_TTL_SECONDS;
  const maxArchiveIndex = options.maxArchiveIndex ?? DEFAULT_MAX_ARCHIVE_INDEX;
  const softRetireOnly = options.softRetireOnly ?? false;
  const dryRun = options.dryRun ?? false;
  const now = options.now?.() ?? new Date();

  const dispositions: Record<LifecycleDisposition, number> = {
    active: 0,
    dangling: 0,
    expired: 0,
    verified_in_grace: 0,
    archive_ready: 0,
    incomplete_terminal: 0,
  };

  const result: SweepHandoffLifecycleResult = {
    inboxesScanned: 0,
    packetsInspected: 0,
    danglingRemoved: 0,
    expiredRemoved: 0,
    softRetired: 0,
    archived: 0,
    skipped: 0,
    dispositions,
    dryRun,
  };

  const inboxPatterns = [`${keyPrefix}:inbox:*`, `${keyPrefix}:inbox:agent:*`];
  const inboxKeys = new Set<string>();
  for (const pattern of inboxPatterns) {
    const found = await redis.keys(pattern);
    for (const key of found) {
      // Avoid double-counting store keys matched by inbox:*
      if (pattern.endsWith(':inbox:*') && key.includes(':inbox:agent:')) continue;
      inboxKeys.add(key);
    }
  }

  const limitedInboxes = [...inboxKeys].slice(0, maxInboxes);
  const seenPackets = new Set<string>();

  for (const inboxKey of limitedInboxes) {
    result.inboxesScanned += 1;
    const ids = await redis.lrange(inboxKey, 0, maxPackets - 1);
    for (const packetId of ids) {
      if (seenPackets.has(packetId)) continue;
      if (result.packetsInspected >= maxPackets) break;
      seenPackets.add(packetId);
      result.packetsInspected += 1;

      const packetRaw = await redis.get(packetKey(packetId, keyPrefix));
      const packet = parseJson<Record<string, any>>(packetRaw);
      const acks = packet ? await loadAcks(redis, packetId, keyPrefix) : {};
      const verification = parseVerificationReceipt(
        await redis.get(verifyKey(packetId, keyPrefix))
      );

      const disposition = classifyPacketLifecycle({
        packet,
        acksByAgent: acks,
        verification,
        now,
        archiveGraceMs,
      });
      dispositions[disposition] += 1;

      if (disposition === 'dangling') {
        if (!dryRun) {
          result.danglingRemoved += await redis.lrem(inboxKey, 0, packetId);
        } else {
          result.danglingRemoved += 1;
        }
        continue;
      }

      if (disposition === 'expired') {
        if (!dryRun) {
          // Remove from this inbox; also attempt all known target inboxes if packet present.
          if (packet) {
            result.expiredRemoved += await softRetirePacketFromLiveIndexes(
              redis,
              packet as any,
              keyPrefix,
              false
            );
          } else {
            result.expiredRemoved += await redis.lrem(inboxKey, 0, packetId);
          }
        } else {
          result.expiredRemoved += 1;
        }
        continue;
      }

      if (disposition === 'verified_in_grace' && packet) {
        const n = await softRetirePacketFromLiveIndexes(redis, packet as any, keyPrefix, dryRun);
        result.softRetired += n > 0 ? 1 : 0;
        continue;
      }

      if (disposition === 'archive_ready' && packet) {
        if (softRetireOnly) {
          const n = await softRetirePacketFromLiveIndexes(redis, packet as any, keyPrefix, dryRun);
          result.softRetired += n > 0 ? 1 : 0;
        } else {
          const ok = await archiveVerifiedPacket(redis, packetId, {
            keyPrefix,
            archiveTtlSeconds,
            maxArchiveIndex,
            dryRun,
          });
          if (ok) result.archived += 1;
          else result.skipped += 1;
        }
        continue;
      }

      result.skipped += 1;
    }
  }

  return result;
}
