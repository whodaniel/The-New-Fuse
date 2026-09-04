/**
 * Drizzle Authority Grant Repository
 *
 * Implements the cloud runtime read path for signed authority grants (Task A from
 * AUTHORITY_GRANTS_WIRING_BRIEF.md).
 *
 * Resolves authority from self-authenticating rows in the `authority_grants` table:
 * 1. Loads candidate grants for a subject (`subject_did = $1`, not revoked, within validity window).
 * 2. Does NOT filter on role in SQL (raw rows returned; verification determines role).
 * 3. Prefetches parent grants recursively unfiltered by validity into an in-memory Map.
 * 4. Supplies synchronous closures to canonical `resolveRoleFromGrants` from
 *    `@the-new-fuse/control-plane-contracts`.
 * 5. Fails closed to `worker` on any verification failure or error.
 *
 * @see docs/protocols/TNF_AUTHORITY_IDENTIFIER_STANDARD.md
 * @see docs/protocols/reports/AUTHORITY_GRANTS_WIRING_BRIEF.md
 */

import { and, desc, eq, gt, inArray, isNull, lte, or } from 'drizzle-orm';
import {
  resolveRoleFromGrants,
  type ResolvedRoleFromGrantsResult,
} from '@the-new-fuse/control-plane-contracts';
import { db, type Database } from '../client.js';
import {
  authorityGrants,
  type AuthorityGrant,
  type NewAuthorityGrant,
} from '../schema/authority-grants.js';

/**
 * Public key resolver contract mapping `signing_key_did` -> Ed25519 public key PEM.
 *
 * Rules:
 * - Must return `null` for an unknown key, never a default.
 * - The cloud source is NOT `~/.tnf/authority/pubkeys` (does not exist on Cloud Run).
 * - Keys are loaded from explicit configuration, registered at runtime, or ingested
 *   from `process.env.TNF_AUTHORITY_PUBLIC_KEYS`.
 */
export interface AuthorityPublicKeyResolver {
  resolvePublicKey(signingKeyDid: string): string | null;
}

/**
 * In-memory and environment-backed public key resolver for cloud environments.
 */
export class ConfigurablePublicKeyResolver implements AuthorityPublicKeyResolver {
  private readonly keys = new Map<string, string>();

  constructor(initialKeys?: Record<string, string> | Map<string, string>) {
    if (initialKeys) {
      const entries =
        initialKeys instanceof Map ? initialKeys.entries() : Object.entries(initialKeys);
      for (const [did, pem] of entries) {
        if (did && pem) {
          this.keys.set(did.trim(), pem.trim());
        }
      }
    }
    this.loadFromEnv();
  }

  public registerKey(signingKeyDid: string, publicKeyPem: string): void {
    if (signingKeyDid && publicKeyPem) {
      this.keys.set(signingKeyDid.trim(), publicKeyPem.trim());
    }
  }

  public resolvePublicKey(signingKeyDid: string): string | null {
    if (!signingKeyDid) return null;
    return this.keys.get(signingKeyDid.trim()) ?? null;
  }

  public hasKey(signingKeyDid: string): boolean {
    if (!signingKeyDid) return false;
    return this.keys.has(signingKeyDid.trim());
  }

  public getRegisteredKeyDids(): string[] {
    return Array.from(this.keys.keys());
  }

  private loadFromEnv(): void {
    const raw = process.env.TNF_AUTHORITY_PUBLIC_KEYS;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          for (const [did, pem] of Object.entries(parsed)) {
            if (did && typeof pem === 'string') {
              this.keys.set(did.trim(), pem.trim());
            }
          }
        }
      } catch {
        // Fail closed on malformed JSON without crashing initialization
      }
    }
  }
}

export const defaultPublicKeyResolver = new ConfigurablePublicKeyResolver();

export interface ResolveSubjectAuthorityOptions {
  now?: Date | string | number;
  publicKeyResolver?: AuthorityPublicKeyResolver;
  fallbackResolver?: (subjectDid: string) => any;
  maxChainDepth?: number;
}

/**
 * Repository providing database operations and verification integration for
 * authority grants.
 */
export class DrizzleAuthorityGrantRepository {
  private readonly db: Database;
  private readonly defaultResolver: AuthorityPublicKeyResolver;

  constructor(
    dbClient: Database = db,
    defaultResolver: AuthorityPublicKeyResolver = defaultPublicKeyResolver
  ) {
    this.db = dbClient;
    this.defaultResolver = defaultResolver;
  }

  /**
   * Loads candidate grants for a subject: rows where `subject_did = $1`, not revoked,
   * and `now()` between `not_before` and `expires_at`.
   *
   * Invariant: Returns raw rows; does NOT filter on `role` in SQL.
   */
  async findLiveCandidatesBySubjectDid(
    subjectDid: string,
    now: Date | string | number = new Date()
  ): Promise<AuthorityGrant[]> {
    if (!subjectDid) return [];
    const t = now instanceof Date ? now : new Date(now);
    const didLower = subjectDid.trim().toLowerCase();

    return this.db
      .select()
      .from(authorityGrants)
      .where(
        and(
          or(
            eq(authorityGrants.subjectDid, subjectDid),
            eq(authorityGrants.subjectDid, didLower)
          ),
          isNull(authorityGrants.revokedAt),
          lte(authorityGrants.notBefore, t),
          gt(authorityGrants.expiresAt, t)
        )
      )
      .orderBy(desc(authorityGrants.createdAt));
  }

  /**
   * Find a grant by primary key UUID.
   */
  async findById(id: string): Promise<AuthorityGrant | null> {
    if (!id) return null;
    const [row] = await this.db
      .select()
      .from(authorityGrants)
      .where(eq(authorityGrants.id, id));
    return row ?? null;
  }

  /**
   * Fetch grants by a list of IDs, UNFILTERED by validity or revocation.
   * Required for recursively loading parent grants whose validity may differ
   * from child grants.
   */
  async findByIds(ids: string[]): Promise<AuthorityGrant[]> {
    const validIds = ids.filter((id) => Boolean(id && typeof id === 'string'));
    if (!validIds.length) return [];
    return this.db
      .select()
      .from(authorityGrants)
      .where(inArray(authorityGrants.id, validIds));
  }

  /**
   * Insert a new authority grant row.
   */
  async create(grant: NewAuthorityGrant): Promise<AuthorityGrant> {
    const [row] = await this.db.insert(authorityGrants).values(grant).returning();
    return row;
  }

  /**
   * Revoke an authority grant.
   */
  async revoke(
    id: string,
    reason: string,
    revokedAt: Date = new Date()
  ): Promise<AuthorityGrant | null> {
    if (!id) return null;
    const [row] = await this.db
      .update(authorityGrants)
      .set({
        revokedAt,
        revocationReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(authorityGrants.id, id))
      .returning();
    return row ?? null;
  }

  /**
   * Resolves the effective authority role for a subject DID:
   * 1. Loads live candidates (subject_did = $1, not revoked, valid at now).
   * 2. Recursively loads all parent grants in the delegation chain unfiltered by validity.
   * 3. Builds in-memory Map and synchronous lookup/public-key closures.
   * 4. Calls canonical resolveRoleFromGrants() from @the-new-fuse/control-plane-contracts.
   * 5. Fails closed to 'worker' on any error.
   */
  async resolveAuthorityForSubject(
    subjectDid: string,
    options: ResolveSubjectAuthorityOptions = {}
  ): Promise<ResolvedRoleFromGrantsResult> {
    try {
      if (!subjectDid || typeof subjectDid !== 'string') {
        return {
          ok: false,
          role: 'worker',
          source: 'default',
          agentId: String(subjectDid || ''),
          reason: 'invalid or empty subjectDid',
        };
      }

      const now =
        options.now instanceof Date ? options.now : options.now ? new Date(options.now) : new Date();
      const resolver = options.publicKeyResolver ?? this.defaultResolver;
      const maxDepth = options.maxChainDepth ?? 10;

      // 1. Load live candidate grants for the subject
      const candidates = await this.findLiveCandidatesBySubjectDid(subjectDid, now);

      if (!candidates || candidates.length === 0) {
        if (typeof options.fallbackResolver === 'function') {
          const fallback = options.fallbackResolver(subjectDid);
          return {
            ...fallback,
            source: fallback.source === 'registry' ? 'roles.json' : (fallback.source || 'default'),
          };
        }
        return {
          ok: true,
          role: 'worker',
          source: 'default',
          agentId: subjectDid,
        };
      }

      // 2. Prefetch parent grants recursively unfiltered by validity
      const loadedMap = new Map<string, AuthorityGrant>();
      for (const grant of candidates) {
        if (grant.id) loadedMap.set(grant.id, grant);
      }

      const requestedIds = new Set<string>();
      let pendingParentIds = new Set<string>();
      for (const grant of candidates) {
        if (grant.parentGrantId && !loadedMap.has(grant.parentGrantId)) {
          pendingParentIds.add(grant.parentGrantId);
          requestedIds.add(grant.parentGrantId);
        }
      }

      let currentDepth = 0;
      while (pendingParentIds.size > 0 && currentDepth < maxDepth) {
        currentDepth++;
        const idsToFetch = Array.from(pendingParentIds);
        pendingParentIds = new Set<string>();

        const fetchedParents = await this.findByIds(idsToFetch);
        for (const parent of fetchedParents) {
          if (parent.id) {
            loadedMap.set(parent.id, parent);
            if (
              parent.parentGrantId &&
              !loadedMap.has(parent.parentGrantId) &&
              !requestedIds.has(parent.parentGrantId)
            ) {
              pendingParentIds.add(parent.parentGrantId);
              requestedIds.add(parent.parentGrantId);
            }
          }
        }
      }

      // 3. Build synchronous lookup and public key closures
      const lookupGrant = (id: string) => loadedMap.get(id) ?? null;
      const resolvePublicKey = (keyDid: string) => resolver.resolvePublicKey(keyDid);

      // 4. Delegate to canonical resolveRoleFromGrants
      return resolveRoleFromGrants(subjectDid, candidates, {
        lookupGrant,
        resolvePublicKey,
        now,
        fallbackResolver: options.fallbackResolver,
      });
    } catch (err: any) {
      // 5. Fail closed on any exception
      return {
        ok: false,
        role: 'worker',
        source: 'error-fallback',
        agentId: subjectDid,
        reason: err?.message || String(err),
      };
    }
  }
}

export const drizzleAuthorityGrantRepository = new DrizzleAuthorityGrantRepository();
