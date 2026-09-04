/**
 * Drizzle ORM Schema — Authority Grants (server-side role registry)
 *
 * The cloud counterpart to `~/.tnf/authority/roles.json`.
 *
 * Locally, authority is a 0600 file in operator custody that agent processes are
 * refused write access to. That does not translate to a multi-tenant control
 * plane serving millions of accounts: grants must be issued at runtime when a
 * user creates a server-side agent, which rules out shipping a signed file with
 * each deploy.
 *
 * So the row is durable, and the row is **self-authenticating**. Every grant
 * carries an Ed25519 signature over its own material, verified on read. Write
 * access to this table therefore does not confer authority — a row without a
 * verifying signature resolves to `worker` exactly as an unknown agent does.
 * That is the same principle the 2026-09-03 handoff incident taught in a
 * different register: when the writer set cannot be enumerated (migrations,
 * admin tooling, another service, a leaked connection string), validation has to
 * happen at the read site.
 *
 * It is deliberately NOT an API-guarded plain table. D23 was written after
 * `set_director_identity` accepted a caller-supplied identity "with zero
 * independent verification" and let it authorize a bus-wide broadcast. Authority
 * resting on one guard being perfect is the same shape.
 *
 * Delegation, not flat signing
 * ---------------------------
 * The operator cannot personally sign a grant per tenant agent. `parentGrantId`
 * and `proofChain` make each row a link in a UCAN-shaped chain
 * (`packages/control-plane-contracts/src/authority.ts`): the operator signs one
 * grant to the Super Director authorizing it to issue `sub-director` within a
 * tenant scope, and the Super Director signs the per-tenant rows citing that
 * proof. Verification walks the chain, and attenuation may only narrow.
 *
 * @see docs/protocols/TNF_AUTHORITY_IDENTIFIER_STANDARD.md
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Mirrors VALID_ROLES in scripts/lib/tnf-identity.cjs. The role-coherence gate
 * (C1) fails if the two ever diverge.
 */
export const authorityRoleEnum = pgEnum('authority_role', [
  'worker',
  'sub-director',
  'super-director',
  'super-admin',
]);

/**
 * Where the identity lives. An axis, not a role — the installed harness and a
 * tenant's server-side agent are both `sub-director` and differ only here.
 */
export const authorityResidencyEnum = pgEnum('authority_residency', ['local', 'cloud']);

export const authorityGrants = pgTable(
  'authority_grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * `did:tnf:<scope>:<category>:<provider>:<name>:<instance>` — the subject.
     * This is the key the runtime resolves against, never a bare agent name.
     */
    subjectDid: varchar('subject_did', { length: 512 }).notNull(),

    /** Denormalised from the DID's scope segment, for tenant-scoped queries. */
    residency: authorityResidencyEnum('residency').notNull(),
    tenantId: varchar('tenant_id', { length: 128 }),

    role: authorityRoleEnum('role').notNull(),

    /** DID of the issuer. The operator root, or a director acting under proof. */
    issuerDid: varchar('issuer_did', { length: 512 }).notNull(),

    /**
     * Ed25519 signature over the canonical grant material, base64.
     *
     * The signed payload covers subject, role, issuer, tenant, residency,
     * notBefore, expiresAt, nonce, proof chain and crossResidency — NOT just
     * (did, role, expiry). Omitting issuer and tenant would let a valid
     * signature be replayed into another tenant's row and still verify;
     * omitting crossResidency would let the operator exception be switched on
     * by a row write.
     */
    signature: text('signature').notNull(),
    signatureAlgorithm: varchar('signature_algorithm', { length: 32 })
      .default('Ed25519')
      .notNull(),

    /** Which operator/root key signed this, so verifiers can select a key. */
    signingKeyDid: varchar('signing_key_did', { length: 512 }).notNull(),

    /** Single-use marker; also part of the signed material, so rows can't be cloned. */
    nonce: varchar('nonce', { length: 128 }).notNull(),

    /**
     * Grants are short-lived by policy, not convention. Expiry is the revocation
     * mechanism: a signature cannot be un-signed, so authority is withdrawn by
     * letting it lapse and declining to reissue. `revokedAt` exists for the
     * immediate case and is checked alongside expiry on read.
     */
    notBefore: timestamp('not_before').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    revocationReason: text('revocation_reason'),

    /**
     * The operator exception class: this grant may reach a subject on the other
     * side of the local/cloud boundary.
     *
     * The developer/owner needs their own local harness to drive server-side
     * agents. That is a genuine weakening of the residency boundary, so it is
     * explicit, signed (see canonicalGrantMaterial), expiring and enumerable
     * rather than an implicit capability. A cross-residency grant may not
     * delegate cross-residency authority onward — one deliberate bridge is an
     * exception, a bridge that mints bridges is a hole.
     */
    crossResidency: boolean('cross_residency').default(false).notNull(),

    /** Delegation chain. Null parent means a root grant signed by the operator. */
    parentGrantId: uuid('parent_grant_id'),
    proofChain: jsonb('proof_chain').$type<string[]>().default([]).notNull(),

    /** Operator-facing reason, recorded for audit. Never parsed for meaning. */
    purpose: text('purpose'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // One live grant per subject is enforced in application logic rather than by
    // a partial unique index, because a rotation legitimately overlaps briefly.
    subjectIdx: index('authority_grants_subject_idx').on(table.subjectDid),
    tenantIdx: index('authority_grants_tenant_idx').on(table.tenantId),
    expiryIdx: index('authority_grants_expiry_idx').on(table.expiresAt),
    // "Which machines hold cloud authority, and until when" must be one query.
    crossResidencyIdx: index('authority_grants_cross_residency_idx').on(table.crossResidency),
    nonceIdx: uniqueIndex('authority_grants_nonce_idx').on(table.nonce),
  })
);

export const authorityGrantsRelations = relations(authorityGrants, ({ one, many }) => ({
  parent: one(authorityGrants, {
    fields: [authorityGrants.parentGrantId],
    references: [authorityGrants.id],
    relationName: 'grant_delegation',
  }),
  children: many(authorityGrants, { relationName: 'grant_delegation' }),
}));

export type AuthorityGrant = typeof authorityGrants.$inferSelect;
export type NewAuthorityGrant = typeof authorityGrants.$inferInsert;
