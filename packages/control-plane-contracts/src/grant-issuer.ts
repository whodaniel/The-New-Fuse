/**
 * Canonical Grant Issuer — mints links in the authority delegation chain.
 *
 * The counterpart to `resolveRoleFromGrants()`. Where the resolver refuses to
 * *honour* an invalid grant, this refuses to *create* one.
 *
 * That symmetry is deliberate. A system that mints grants it will later reject
 * produces rows that look like authority, sit in the table, and silently resolve
 * to `worker` — the operator sees a grant and the runtime sees nothing. Every
 * invariant the resolver enforces is therefore checked here first, before
 * signing, so a bad grant fails at issue time with a reason rather than at read
 * time with silence.
 *
 * @see packages/database/src/drizzle/schema/authority-grants.ts
 * @see docs/protocols/TNF_AUTHORITY_IDENTIFIER_STANDARD.md
 */

import crypto from 'node:crypto';
import {
  attenuationHolds,
  isValidRole,
  parseAgentDid,
  residencyOf,
  signGrant,
  VALID_ROLES,
} from './authority-primitives.js';

export const DEFAULT_TTL_SECONDS = 3600;
export const MAX_CROSS_RESIDENCY_TTL_SECONDS = 3600 * 12;

function isoIn(seconds: number, from: number = Date.now()): Date {
  return new Date(from + seconds * 1000);
}

export interface IssueGrantParams {
  subjectDid: string;
  role: string;
  issuerDid: string;
  signingKeyPem: string | crypto.KeyObject;
  signingKeyDid: string;
  parentGrant?: any | null;
  ttlSeconds?: number;
  mayBridgeOnward?: boolean;
  tenantId?: string | null;
  purpose?: string;
  now?: number | Date;
  allowRootless?: boolean;
}

export function issueGrant(params: IssueGrantParams): any {
  const {
    subjectDid,
    role,
    issuerDid,
    signingKeyPem,
    signingKeyDid,
    parentGrant = null,
    ttlSeconds = DEFAULT_TTL_SECONDS,
    mayBridgeOnward = false,
    tenantId = null,
    purpose,
    now = Date.now(),
  } = params;

  if (!parseAgentDid(subjectDid)) {
    throw new Error(
      `[tnf-grant-issuer] subject must be a did:tnf, got ${JSON.stringify(subjectDid)}`
    );
  }
  if (!isValidRole(role)) {
    throw new Error(
      `[tnf-grant-issuer] invalid role ${JSON.stringify(role)}; allowed: ${VALID_ROLES.join(', ')}`
    );
  }
  if (!issuerDid || !signingKeyPem || !signingKeyDid) {
    throw new Error('[tnf-grant-issuer] issuerDid, signingKeyPem and signingKeyDid are required');
  }
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('[tnf-grant-issuer] ttlSeconds must be a positive number');
  }

  const subject = parseAgentDid(subjectDid)!;
  const residency = subject.residency;
  const resolvedTenant = subject.tenantId || tenantId || null;
  if (subject.tenantId && tenantId && subject.tenantId !== tenantId) {
    throw new Error(
      `[tnf-grant-issuer] tenant mismatch: did says ${subject.tenantId}, caller says ${tenantId}`
    );
  }

  const parentResidency = parentGrant
    ? parentGrant.residency || residencyOf(parentGrant.subjectDid || '')
    : null;
  const crossesBoundary = Boolean(
    parentResidency && parentResidency !== 'unknown' && parentResidency !== residency
  );
  if ((mayBridgeOnward || crossesBoundary) && ttlSeconds > MAX_CROSS_RESIDENCY_TTL_SECONDS) {
    throw new Error(
      `[tnf-grant-issuer] a cross-residency bridge may not exceed ${MAX_CROSS_RESIDENCY_TTL_SECONDS}s; asked for ${ttlSeconds}s`
    );
  }

  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const expiresAt = isoIn(ttlSeconds, nowMs);
  const grant: any = {
    subjectDid: String(subjectDid).toLowerCase(),
    role,
    issuerDid: String(issuerDid).toLowerCase(),
    residency,
    tenantId: resolvedTenant,
    nonce: crypto.randomBytes(16).toString('hex'),
    notBefore: new Date(nowMs),
    expiresAt,
    proofChain:
      parentGrant && parentGrant.id ? [...(parentGrant.proofChain || []), parentGrant.id] : [],
    crossResidency: Boolean(mayBridgeOnward),
    parentGrantId: parentGrant ? parentGrant.id || null : null,
    signingKeyDid,
    purpose: purpose || undefined,
  };

  if (parentGrant) {
    if (String(parentGrant.subjectDid).toLowerCase() !== grant.issuerDid) {
      throw new Error(
        `[tnf-grant-issuer] issuer ${grant.issuerDid} is not the subject of the parent grant (${parentGrant.subjectDid})`
      );
    }
    const att = attenuationHolds(parentGrant, grant);
    if (!att.ok) {
      throw new Error(
        `[tnf-grant-issuer] refusing to mint a grant the resolver would reject: ${att.reason}`
      );
    }
  } else if (role !== 'super-admin' && !mayBridgeOnward) {
    if (!params.allowRootless) {
      throw new Error(
        `[tnf-grant-issuer] a ${role} grant must cite a parent grant; pass allowRootless only for an operator-signed root`
      );
    }
  }

  grant.signature = signGrant(grant, signingKeyPem);
  grant.signatureAlgorithm = 'Ed25519';
  return grant;
}

export interface IssueOperatorRootParams {
  operatorDid: string;
  signingKeyPem: string | crypto.KeyObject;
  signingKeyDid: string;
  ttlSeconds?: number;
  purpose?: string;
  now?: number | Date;
}

export function issueOperatorRoot({
  operatorDid,
  signingKeyPem,
  signingKeyDid,
  ttlSeconds,
  purpose,
  now,
}: IssueOperatorRootParams): any {
  return issueGrant({
    subjectDid: operatorDid,
    role: 'super-admin',
    issuerDid: operatorDid,
    signingKeyPem,
    signingKeyDid,
    parentGrant: null,
    ttlSeconds: ttlSeconds || DEFAULT_TTL_SECONDS * 24,
    purpose: purpose || 'operator root',
    now,
    allowRootless: true,
  });
}

export interface RenewGrantOptions {
  signingKeyPem: string | crypto.KeyObject;
  ttlSeconds?: number;
  parentGrant?: any | null;
  now?: number | Date;
}

export function renewGrant(
  existing: any,
  {
    signingKeyPem,
    ttlSeconds = DEFAULT_TTL_SECONDS,
    parentGrant = null,
    now = Date.now(),
  }: RenewGrantOptions
): any {
  return issueGrant({
    subjectDid: existing.subjectDid,
    role: existing.role,
    issuerDid: existing.issuerDid,
    signingKeyPem,
    signingKeyDid: existing.signingKeyDid,
    parentGrant,
    ttlSeconds,
    mayBridgeOnward: Boolean(existing.crossResidency),
    tenantId: existing.tenantId,
    purpose: existing.purpose,
    now,
    allowRootless: !existing.parentGrantId,
  });
}
