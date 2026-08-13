import { getRandomBytes, hmacSha256, timingSafeEqual } from '@the-new-fuse/security';

/**
 * TNF Resource Pointer (TRP)
 * Represents a reference to external data stored in the Federated Knowledge Graph
 * or another persistent store (e.g. pgvector, S3, R2, local filesystem).
 */
export interface TNFResourcePointer {
  uri: string; // e.g. pgvector://shards/shard-123, file:///...
  integrityHash?: string;
  mimeType?: string;
  size?: number;
}

/**
 * A2A Signed Packet (DACC-v1 Compliant)
 *
 * Evolution: Now supports resource_pointers to prevent "All-in-Memory" OOM crashes.
 * Payload should contain lightweight metadata, while heavy data is passed via pointers.
 */
export interface A2ASignedPacket {
  header: {
    agent_id: string;
    alg: 'HS256';
    nonce: string;
    timestamp: number;
    resource_pointers?: Record<string, TNFResourcePointer>;
  };
  payload: {
    type: string;
    channel?: string;
    data: unknown;
    conatus_weight?: number;
  };
  signature: string;
}

export class A2ASignatureWrapper {
  constructor(
    private readonly agentId: string,
    private readonly secret: string
  ) {}

  /**
   * Wraps an A2A message with a DACC-v1 compliant signature and optional resource pointers.
   */
  wrap(
    type: string,
    data: unknown,
    options?: {
      channel?: string;
      conatusWeight?: number;
      resourcePointers?: Record<string, TNFResourcePointer>;
    }
  ): A2ASignedPacket {
    const header: A2ASignedPacket['header'] = {
      agent_id: this.agentId,
      alg: 'HS256' as const,
      nonce: this.generateNonce(),
      timestamp: Date.now(),
      resource_pointers: options?.resourcePointers,
    };

    const payload = {
      type,
      channel: options?.channel,
      data,
      conatus_weight: options?.conatusWeight,
    };

    const signature = hmacSha256(canonicalize({ header, payload }), this.secret);

    return { header, payload, signature };
  }

  /**
   * Verify a packet produced by `wrap`.
   *
   * Added 2026-07-23. Until then this class could only sign: no verify existed
   * anywhere in the repo, so every signature TNF produced was decorative and
   * the receiving side trusted whatever identity and role the envelope
   * claimed. Mirrors `verifyEnvelope` in scripts/lib/tnf-message-auth.cjs —
   * both use the same canonical serialization so a packet signed on either
   * side verifies on the other.
   *
   * Fails closed on every path, including malformed input.
   *
   * @param skewWindowMs Rejects packets whose timestamp is further from now
   *                     than this. Replay protection also needs nonce tracking,
   *                     which is stateful and therefore the caller's job.
   */
  verify(
    packet: unknown,
    options?: { skewWindowMs?: number; now?: number }
  ): { ok: boolean; reason?: string; agentId?: string } {
    if (!packet || typeof packet !== 'object') {
      return { ok: false, reason: 'packet is not an object' };
    }
    const { header, payload, signature } = packet as Partial<A2ASignedPacket>;

    if (!header || typeof header !== 'object') return { ok: false, reason: 'missing header' };
    if (!payload || typeof payload !== 'object') return { ok: false, reason: 'missing payload' };
    if (typeof signature !== 'string' || !signature) {
      return { ok: false, reason: 'missing signature' };
    }
    // Pinned: without this the sender chooses the algorithm.
    if (header.alg !== 'HS256') {
      return { ok: false, reason: `unsupported alg: ${String(header.alg)}` };
    }
    if (typeof header.agent_id !== 'string' || !header.agent_id) {
      return { ok: false, reason: 'missing header.agent_id' };
    }
    if (typeof header.nonce !== 'string' || header.nonce.length < 8) {
      return { ok: false, reason: 'missing or invalid header.nonce', agentId: header.agent_id };
    }
    if (typeof header.timestamp !== 'number' || !Number.isFinite(header.timestamp)) {
      return { ok: false, reason: 'missing or invalid header.timestamp', agentId: header.agent_id };
    }

    const skew = options?.skewWindowMs ?? 120_000;
    const now = options?.now ?? Date.now();
    const drift = Math.abs(now - header.timestamp);
    if (drift > skew) {
      return {
        ok: false,
        reason: `timestamp outside ±${skew}ms window (drift ${drift}ms)`,
        agentId: header.agent_id,
      };
    }

    const expected = hmacSha256(canonicalize({ header, payload }), this.secret);
    if (!timingSafeEqual(signature, expected)) {
      return { ok: false, reason: 'signature mismatch', agentId: header.agent_id };
    }

    return { ok: true, agentId: header.agent_id };
  }

  private generateNonce(): string {
    return getRandomBytes(16).toString('hex');
  }
}

/**
 * Deterministic JSON serialization.
 *
 * Plain JSON.stringify preserves insertion order, so two structurally
 * identical packets built in different orders hash differently. Harmless while
 * nothing verifies; a source of phantom auth failures the moment something
 * does. Keys are sorted recursively; array order is preserved because it is
 * semantic. `undefined` members are dropped so an explicitly-undefined optional
 * field (e.g. `resource_pointers`) matches an absent one, which is what
 * JSON.stringify does on the wire anyway.
 */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const parts = Object.keys(record)
    .sort()
    .filter((key) => record[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
  return `{${parts.join(',')}}`;
}
