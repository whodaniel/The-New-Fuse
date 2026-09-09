import crypto from 'node:crypto';

/**
 * The authority vocabulary, ordered weakest first.
 *
 * `super-admin` is the human operator/owner.
 * `super-director` is the singular cloud orchestration agent.
 * `sub-director` is a director-tier agent (distinguished by residency in DID).
 * `worker` is the baseline unprivileged role.
 */
export const VALID_ROLES = Object.freeze([
  'worker',
  'sub-director',
  'super-director',
  'super-admin',
] as const);

export type AuthorityRole = (typeof VALID_ROLES)[number];

export function isValidRole(role: unknown): role is AuthorityRole {
  return typeof role === 'string' && (VALID_ROLES as readonly string[]).includes(role);
}

/**
 * Where an identity lives. This is an axis, not a role.
 */
export const RESIDENCIES = Object.freeze(['local', 'cloud'] as const);
export type AuthorityResidency = (typeof RESIDENCIES)[number];

/** Ordering used to enforce that a delegated grant never widens authority. */
export const ROLE_RANK: Readonly<Record<string, number>> = Object.freeze({
  worker: 0,
  'sub-director': 1,
  'super-director': 2,
  'super-admin': 3,
});

/** Depth limit for chain walking. A cycle or a long chain must not hang a read. */
export const MAX_CHAIN_DEPTH = 8;

const DID_TNF_PREFIX = 'did:tnf:';
const DID_SEGMENT = /^[a-z0-9_]+$/;

export function normalizeDidSegment(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value)
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return s || null;
}

export interface AgentDidParts {
  scope?: string | null;
  category?: string | null;
  provider?: string | null;
  name?: string | null;
  instance?: string | number | null;
}

/** Build a `did:tnf` from canonical entity parts. Throws on incomplete input. */
export function buildAgentDid({
  scope,
  category,
  provider,
  name,
  instance,
}: AgentDidParts = {}): string {
  const seg = {
    scope: normalizeDidSegment(scope),
    category: normalizeDidSegment(category) || 'agent',
    provider: normalizeDidSegment(provider),
    name: normalizeDidSegment(name),
  };
  if (!seg.scope || !seg.provider || !seg.name) {
    throw new Error('[tnf-identity] did:tnf requires scope, provider and name');
  }
  let inst = instance == null || instance === '' ? '001' : String(instance).trim();
  inst = /^\d+$/.test(inst) ? inst.padStart(3, '0') : normalizeDidSegment(inst) || '001';
  return `${DID_TNF_PREFIX}${seg.scope}:${seg.category}:${seg.provider}:${seg.name}:${inst}`;
}

export interface ParsedAgentDid {
  did: string;
  scope: string;
  category: string;
  provider: string;
  name: string;
  instance: string;
  residency: AuthorityResidency;
  tenantId: string | null;
}

/**
 * Parse a `did:tnf`. Returns null for anything malformed — callers must treat
 * null as "not traceable", never as "trusted anyway".
 */
export function parseAgentDid(did: unknown): ParsedAgentDid | null {
  const raw = String(did || '').trim();
  if (!raw.toLowerCase().startsWith(DID_TNF_PREFIX)) return null;
  const parts = raw
    .slice(DID_TNF_PREFIX.length)
    .split(':')
    .map((p) => p.trim().toLowerCase());
  if (parts.length !== 5) return null;
  if (!parts.every((p) => DID_SEGMENT.test(p))) return null;
  const [scope, category, provider, name, instance] = parts;
  const residency: AuthorityResidency = scope === 'local' ? 'local' : 'cloud';
  const tenantId = scope.startsWith('cloud_') ? scope.slice('cloud_'.length) : null;
  return { did: raw.toLowerCase(), scope, category, provider, name, instance, residency, tenantId };
}

/** The canonicalEntityId form of the same identity, for cross-subsystem joins. */
export function didToCanonicalEntityId(did: string): string | null {
  const p = parseAgentDid(did);
  if (!p) return null;
  return ['TNF', p.scope, p.category, p.provider, p.name, p.instance]
    .map((s) => String(s).toUpperCase())
    .join(':');
}

/**
 * Residency for any agent identifier.
 *
 * A `did:tnf` states it. A legacy bare string cannot, so it is reported as
 * `unknown` — the caller decides policy. Guessing `local` from a substring is
 * exactly the filename-substring mistake D23 warns about.
 */
export function residencyOf(agentId: unknown): AuthorityResidency | 'unknown' {
  const parsed = parseAgentDid(agentId);
  return parsed ? parsed.residency : 'unknown';
}

export interface AuthorityGrantRecord {
  subjectDid: string;
  role: string;
  issuerDid: string;
  nonce: string;
  notBefore: Date | string | number;
  expiresAt: Date | string | number;
  tenantId?: string | null;
  residency?: string | null;
  proofChain?: string[] | null;
  crossResidency?: boolean | null;
  signature?: string | null;
  signatureAlgorithm?: string | null;
  revokedAt?: Date | string | number | null;
  revocationReason?: string | null;
  id?: string | null;
  parentGrantId?: string | null;
  signingKeyDid?: string | null;
  [key: string]: unknown;
}

export function canonicalGrantMaterial(grant: any): string {
  const required = ['subjectDid', 'role', 'issuerDid', 'nonce', 'notBefore', 'expiresAt'];
  for (const key of required) {
    if (!grant || grant[key] === undefined || grant[key] === null || grant[key] === '') {
      throw new Error(`[tnf-identity] grant is missing ${key}; refusing to sign or verify`);
    }
  }
  const iso = (v: any) => (v instanceof Date ? v.toISOString() : new Date(v).toISOString());
  return JSON.stringify([
    'tnf/authority-grant/1',
    String(grant.subjectDid).toLowerCase(),
    String(grant.role),
    String(grant.issuerDid).toLowerCase(),
    grant.tenantId ? String(grant.tenantId).toLowerCase() : null,
    String(grant.residency || residencyOf(grant.subjectDid)),
    iso(grant.notBefore),
    iso(grant.expiresAt),
    String(grant.nonce),
    Array.isArray(grant.proofChain) ? grant.proofChain.map(String) : [],
    Boolean(grant.crossResidency),
  ]);
}

export function signGrant(grant: any, privateKeyPem: string | crypto.KeyObject): string {
  const material = Buffer.from(canonicalGrantMaterial(grant), 'utf8');
  const key =
    typeof privateKeyPem === 'string' ? crypto.createPrivateKey(privateKeyPem) : privateKeyPem;
  return crypto.sign(null, material, key).toString('base64');
}

export interface AuthorityGrantVerificationVerdict {
  verdict: 'valid' | 'invalid' | 'revoked' | 'not-yet-valid' | 'expired';
  role: string;
  reason?: string;
  subjectDid?: string;
  tenantId?: string | null;
  failedAt?: string | null;
  chainDepth?: number;
  crossedResidency?: boolean;
}

export function verifyGrant(
  grant: any,
  publicKeyPem: string | crypto.KeyObject,
  { now = new Date() }: { now?: Date | string | number } = {}
): AuthorityGrantVerificationVerdict {
  let material: Buffer;
  try {
    material = Buffer.from(canonicalGrantMaterial(grant), 'utf8');
  } catch (err: any) {
    return { verdict: 'invalid', role: 'worker', reason: err.message };
  }
  if (!grant.signature) return { verdict: 'invalid', role: 'worker', reason: 'no signature' };
  if ((grant.signatureAlgorithm || 'Ed25519') !== 'Ed25519') {
    return {
      verdict: 'invalid',
      role: 'worker',
      reason: `unsupported algorithm ${grant.signatureAlgorithm}`,
    };
  }
  let ok = false;
  try {
    const key =
      typeof publicKeyPem === 'string' ? crypto.createPublicKey(publicKeyPem) : publicKeyPem;
    ok = crypto.verify(null, material, key, Buffer.from(grant.signature, 'base64'));
  } catch (err: any) {
    return { verdict: 'invalid', role: 'worker', reason: `signature check failed: ${err.message}` };
  }
  if (!ok) return { verdict: 'invalid', role: 'worker', reason: 'signature does not verify' };

  if (grant.revokedAt) {
    return { verdict: 'revoked', role: 'worker', reason: grant.revocationReason || 'revoked' };
  }
  const t = now instanceof Date ? now : new Date(now);
  if (new Date(grant.notBefore) > t) return { verdict: 'not-yet-valid', role: 'worker' };
  if (new Date(grant.expiresAt) <= t) return { verdict: 'expired', role: 'worker' };
  if (!isValidRole(grant.role)) {
    return {
      verdict: 'invalid',
      role: 'worker',
      reason: `invalid role ${JSON.stringify(grant.role)}`,
    };
  }

  return {
    verdict: 'valid',
    role: grant.role,
    subjectDid: grant.subjectDid,
    tenantId: grant.tenantId || null,
  };
}

export function attenuationHolds(
  parent: any,
  child: any
): { ok: boolean; reason?: string; crossedResidency?: boolean } {
  if (!parent) return { ok: true };
  if ((ROLE_RANK[child.role] ?? 99) > (ROLE_RANK[parent.role] ?? -1)) {
    return { ok: false, reason: `child role ${child.role} exceeds issuer role ${parent.role}` };
  }
  if (parent.tenantId && child.tenantId !== parent.tenantId) {
    return {
      ok: false,
      reason: `child tenant ${child.tenantId} outside issuer tenant ${parent.tenantId}`,
    };
  }
  if (new Date(child.expiresAt) > new Date(parent.expiresAt)) {
    return { ok: false, reason: 'child outlives its issuer grant' };
  }

  const parentResidency = parent.residency || residencyOf(parent.subjectDid || '');
  const childResidency = child.residency || residencyOf(child.subjectDid || '');
  const crossing =
    parentResidency !== 'unknown' &&
    childResidency !== 'unknown' &&
    parentResidency !== childResidency;
  if (crossing && !parent.crossResidency) {
    return {
      ok: false,
      reason: `grant crosses residency ${parentResidency} -> ${childResidency}; issuer grant does not carry crossResidency`,
    };
  }
  if (crossing && child.crossResidency) {
    return {
      ok: false,
      reason: 'a grant that crosses residency may not also carry the right to bridge onward',
    };
  }
  return { ok: true, crossedResidency: crossing || undefined };
}

export interface VerifyGrantChainOptions {
  lookupGrant?: (id: string) => any;
  resolvePublicKey?: (keyDid: string) => string | crypto.KeyObject | null | undefined;
  now?: Date | string | number;
}

export function verifyGrantChain(
  grant: any,
  { lookupGrant, resolvePublicKey, now = new Date() }: VerifyGrantChainOptions = {}
): AuthorityGrantVerificationVerdict {
  const seen = new Set<string>();
  let current = grant;
  let depth = 0;
  let effectiveRole: string | null = null;
  let crossed = false;

  while (current) {
    if (depth++ > MAX_CHAIN_DEPTH) {
      return {
        verdict: 'invalid',
        role: 'worker',
        reason: `delegation chain deeper than ${MAX_CHAIN_DEPTH}`,
      };
    }
    if (current.id && seen.has(current.id)) {
      return { verdict: 'invalid', role: 'worker', reason: 'delegation chain contains a cycle' };
    }
    if (current.id) seen.add(current.id);

    const pem =
      typeof resolvePublicKey === 'function' ? resolvePublicKey(current.signingKeyDid) : null;
    if (!pem) {
      return {
        verdict: 'invalid',
        role: 'worker',
        reason: `no public key for ${current.signingKeyDid || '(unset)'}`,
      };
    }
    const verdict = verifyGrant(current, pem, { now });
    if (verdict.verdict !== 'valid') {
      return { ...verdict, role: 'worker', failedAt: current.id || current.subjectDid || null };
    }
    if (effectiveRole === null) effectiveRole = current.role;

    if (!current.parentGrantId) {
      return {
        verdict: 'valid',
        role: effectiveRole || 'worker',
        subjectDid: grant.subjectDid,
        tenantId: grant.tenantId || null,
        chainDepth: depth,
        crossedResidency: crossed || undefined,
      };
    }

    const parent = typeof lookupGrant === 'function' ? lookupGrant(current.parentGrantId) : null;
    if (!parent) {
      return {
        verdict: 'invalid',
        role: 'worker',
        reason: `parent grant ${current.parentGrantId} not found`,
      };
    }
    if (String(parent.subjectDid).toLowerCase() !== String(current.issuerDid).toLowerCase()) {
      return {
        verdict: 'invalid',
        role: 'worker',
        reason: `issuer ${current.issuerDid} is not the subject of parent grant ${parent.id}`,
      };
    }
    const att = attenuationHolds(parent, current);
    if (!att.ok) return { verdict: 'invalid', role: 'worker', reason: att.reason };
    if (att.crossedResidency) crossed = true;

    current = parent;
  }
  return { verdict: 'invalid', role: 'worker', reason: 'chain terminated without a root' };
}

export interface ResolveRoleFromGrantsOptions extends VerifyGrantChainOptions {
  fallbackResolver?: (subjectDid: string) => any;
}

export interface ResolvedRoleFromGrantsResult {
  ok: boolean;
  role: string;
  source: string;
  agentId: string;
  grantId?: string | null;
  crossedResidency?: boolean;
  rejected?: Array<{ id: string | null; verdict: string; reason?: string }>;
  [key: string]: unknown;
}

export function resolveRoleFromGrants(
  subjectDid: string,
  grants: any[],
  opts: ResolveRoleFromGrantsOptions = {}
): ResolvedRoleFromGrantsResult {
  const rows = Array.isArray(grants) ? grants : [];
  const candidates = rows.filter(
    (g) => g && String(g.subjectDid || '').toLowerCase() === String(subjectDid || '').toLowerCase()
  );

  let best: any = null;
  const rejected: Array<{ id: string | null; verdict: string; reason?: string }> = [];
  for (const row of candidates) {
    const result = verifyGrantChain(row, opts);
    if (result.verdict !== 'valid') {
      rejected.push({ id: row.id || null, verdict: result.verdict, reason: result.reason });
      continue;
    }
    if (!best || (ROLE_RANK[result.role] ?? -1) > (ROLE_RANK[best.role] ?? -1)) {
      best = { ...result, grantId: row.id || null };
    }
  }

  if (best) {
    return {
      ok: true,
      role: best.role,
      source: 'signed-grant',
      agentId: subjectDid,
      grantId: best.grantId,
      crossedResidency: best.crossedResidency,
      rejected: rejected.length ? rejected : undefined,
    };
  }

  if (typeof opts.fallbackResolver === 'function') {
    const local = opts.fallbackResolver(subjectDid);
    return {
      ...local,
      source: local.source === 'registry' ? 'roles.json' : local.source || 'default',
      rejected: rejected.length ? rejected : undefined,
    };
  }

  return {
    ok: true,
    role: 'worker',
    source: 'default',
    agentId: subjectDid,
    rejected: rejected.length ? rejected : undefined,
  };
}

export function crossResidencyGrants(grants: any[]): any[] {
  return (Array.isArray(grants) ? grants : []).filter((g) => g && g.crossResidency);
}
