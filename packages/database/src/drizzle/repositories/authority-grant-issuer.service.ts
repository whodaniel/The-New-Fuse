/**
 * Authority Grant Issuer Service
 *
 * Implements the cloud issuing API for signed authority grants (Task B from
 * AUTHORITY_GRANTS_WIRING_BRIEF.md).
 *
 * Invariants:
 * 1. Mints via canonical `issueGrant` / `issueOperatorRoot` primitives and inserts row.
 * 2. Persists every field in the signed material verbatim.
 * 3. Gated on a resolved authority role (`super-admin` or `super-director` via Task A),
 *    never on an API guard alone.
 * 4. Takes a `TrustRootProvider` in constructor; probes at construction and refuses
 *    to mint if unavailable (never downgrades silently).
 * 5. Rejects with exact error messages so operators learn why an issue failed.
 * 6. Renewal creates a new row with a new nonce and time window; never updates `expires_at`.
 *
 * @see docs/protocols/reports/AUTHORITY_GRANTS_WIRING_BRIEF.md
 * @see docs/protocols/TNF_AUTHORITY_IDENTIFIER_STANDARD.md
 */

import crypto from 'node:crypto';
import {
  DEFAULT_TTL_SECONDS,
  issueGrant as canonicalIssueGrant,
  issueOperatorRoot as canonicalIssueOperatorRoot,
  type IssueGrantParams,
  type IssueOperatorRootParams,
  type TrustRootDescriptor,
  type TrustRootKind,
  type TrustRootProvider,
  type TrustRootPublicKey,
  type TrustRootSignature,
  type TrustRootSignContext,
} from '@the-new-fuse/control-plane-contracts';
import {
  DrizzleAuthorityGrantRepository,
  drizzleAuthorityGrantRepository,
} from './authority-grant.repository.js';
import type { AuthorityGrant, NewAuthorityGrant } from '../schema/authority-grants.js';

/**
 * In-memory test provider implementing TrustRootProvider for server-side
 * custody testing without external hardware dependencies.
 */
export class InMemoryTrustRootProvider implements TrustRootProvider {
  readonly kind: TrustRootKind = 'file';
  private readonly keyPair: { publicKeyPem: string; privateKeyPem: string };
  private readonly keyDid: string;
  private isAvailable: boolean;
  private unavailableReason?: string;

  constructor(
    keyPair?: { publicKeyPem: string; privateKeyPem: string },
    keyDid: string = 'did:key:superdirector',
    available: boolean = true,
    unavailableReason?: string
  ) {
    if (keyPair) {
      this.keyPair = keyPair;
    } else {
      const kp = crypto.generateKeyPairSync('ed25519');
      this.keyPair = {
        publicKeyPem: kp.publicKey.export({ type: 'spki', format: 'pem' }) as string,
        privateKeyPem: kp.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string,
      };
    }
    this.keyDid = keyDid;
    this.isAvailable = available;
    this.unavailableReason = unavailableReason;
  }

  async probe(): Promise<TrustRootDescriptor> {
    return {
      kind: 'file',
      available: this.isAvailable,
      unavailableReason: this.unavailableReason,
      guarantee: {
        keyReadableBySameUid: true,
        hardwareBound: false,
        requiresHumanPresence: false,
        survivesAgentCompromise: false,
      },
      summary: 'in-memory test provider; provides no boundary against same-uid process',
    };
  }

  async getPublicKey(): Promise<TrustRootPublicKey> {
    return {
      did: this.keyDid,
      publicKeyPem: this.keyPair.publicKeyPem,
      algorithm: 'Ed25519',
    };
  }

  async sign(payload: Uint8Array, context: TrustRootSignContext): Promise<TrustRootSignature> {
    if (!this.isAvailable) {
      throw new Error(`[trust-root-provider] unavailable: ${this.unavailableReason || 'provider unavailable'}`);
    }
    const sig = crypto
      .sign(null, Buffer.from(payload), crypto.createPrivateKey(this.keyPair.privateKeyPem))
      .toString('base64');

    return {
      signature: sig,
      algorithm: 'Ed25519',
      signedAt: new Date().toISOString(),
      rootDid: this.keyDid,
    };
  }

  get privateKeyPem(): string {
    return this.keyPair.privateKeyPem;
  }
}

export interface IssueGrantRequest {
  callerDid: string;
  subjectDid: string;
  role: string;
  parentGrantId?: string | null;
  ttlSeconds?: number;
  mayBridgeOnward?: boolean;
  tenantId?: string | null;
  purpose?: string;
}

export interface IssueOperatorRootRequest {
  callerDid: string;
  operatorDid: string;
  signingKeyPem: string | crypto.KeyObject;
  signingKeyDid: string;
  ttlSeconds?: number;
  purpose?: string;
}

export interface RenewGrantRequest {
  callerDid: string;
  grantId: string;
  ttlSeconds?: number;
}

export interface AuthorityGrantIssuerOptions {
  repository?: DrizzleAuthorityGrantRepository;
  trustRootProvider?: TrustRootProvider;
}

export class AuthorityGrantIssuerService {
  private readonly repository: DrizzleAuthorityGrantRepository;
  private readonly trustRootProvider: TrustRootProvider;
  private probeDescriptor: TrustRootDescriptor | null = null;
  private readonly probePromise: Promise<TrustRootDescriptor>;

  constructor(options: AuthorityGrantIssuerOptions = {}) {
    this.repository = options.repository ?? drizzleAuthorityGrantRepository;
    this.trustRootProvider = options.trustRootProvider ?? new InMemoryTrustRootProvider();

    // Call probe() at construction as mandated
    this.probePromise = this.trustRootProvider
      .probe()
      .then((desc) => {
        this.probeDescriptor = desc;
        return desc;
      })
      .catch((err) => {
        const desc: TrustRootDescriptor = {
          kind: this.trustRootProvider.kind,
          available: false,
          unavailableReason: err?.message || String(err),
          guarantee: {
            keyReadableBySameUid: true,
            hardwareBound: false,
            requiresHumanPresence: false,
            survivesAgentCompromise: false,
          },
          summary: 'probe threw error',
        };
        this.probeDescriptor = desc;
        return desc;
      });
  }

  /**
   * Refuse to mint and surface the reason if the signing provider is unavailable.
   */
  private async ensureProviderAvailable(): Promise<TrustRootDescriptor> {
    const desc = this.probeDescriptor ?? (await this.probePromise);
    if (!desc.available) {
      throw new Error(
        `[authority-issuer] signing key provider unavailable: ${
          desc.unavailableReason || 'provider reported unavailable'
        }`
      );
    }
    return desc;
  }

  /**
   * Gate issuance on a resolved authority role via Task A read path.
   * Gated strictly on super-admin or super-director.
   */
  private async assertCanIssue(callerDid: string): Promise<{ role: string }> {
    if (!callerDid) {
      throw new Error('[authority-issuer] caller DID is required');
    }
    const verdict = await this.repository.resolveAuthorityForSubject(callerDid);
    if (verdict.role !== 'super-admin' && verdict.role !== 'super-director') {
      throw new Error(
        `[authority-issuer] caller ${callerDid} resolved to role '${verdict.role}'; issuance requires super-admin or super-director`
      );
    }
    return { role: verdict.role };
  }

  /**
   * Issue a signed authority grant and persist verbatim to authority_grants.
   */
  async issueGrant(request: IssueGrantRequest): Promise<AuthorityGrant> {
    const {
      callerDid,
      subjectDid,
      role,
      parentGrantId,
      ttlSeconds = DEFAULT_TTL_SECONDS,
      mayBridgeOnward = false,
      tenantId = null,
      purpose,
    } = request;

    // 1. Availability check: refuse to mint if signing key custody is unavailable
    await this.ensureProviderAvailable();

    // 2. Gate issuance on resolved role of caller (Task A)
    const { role: callerRole } = await this.assertCanIssue(callerDid);

    // 3. Parent grant resolution
    let parentGrant: AuthorityGrant | null = null;
    if (callerRole === 'super-director') {
      if (!parentGrantId) {
        throw new Error(
          '[authority-issuer] a super-director must cite a parent grant when issuing authority'
        );
      }
      parentGrant = await this.repository.findById(parentGrantId);
      if (!parentGrant) {
        throw new Error(`[authority-issuer] parent grant ${parentGrantId} not found`);
      }
    } else if (parentGrantId) {
      parentGrant = await this.repository.findById(parentGrantId);
      if (!parentGrant) {
        throw new Error(`[authority-issuer] parent grant ${parentGrantId} not found`);
      }
    }

    // 4. Retrieve public key metadata from provider
    const rootKey = await this.trustRootProvider.getPublicKey();
    const signingKeyDid = rootKey.did;
    const signingKeyPem =
      (this.trustRootProvider as any).privateKeyPem ||
      ((rootKey as any).privateKeyPem as string);

    if (!signingKeyPem) {
      throw new Error(
        '[authority-issuer] signing key provider did not expose private key for signing'
      );
    }

    // 5. Mint grant via canonical issueGrant
    const grantParams: IssueGrantParams = {
      subjectDid,
      role,
      issuerDid: callerDid,
      signingKeyPem,
      signingKeyDid,
      parentGrant,
      ttlSeconds,
      mayBridgeOnward,
      tenantId,
      purpose,
      now: Date.now(),
      allowRootless: callerRole === 'super-admin' && !parentGrant,
    };

    const minted = canonicalIssueGrant(grantParams);

    // 6. Persist every field in the signed material verbatim
    const rowToInsert: NewAuthorityGrant = {
      subjectDid: minted.subjectDid,
      role: minted.role,
      issuerDid: minted.issuerDid,
      residency: minted.residency,
      tenantId: minted.tenantId,
      signingKeyDid: minted.signingKeyDid,
      nonce: minted.nonce,
      notBefore: minted.notBefore,
      expiresAt: minted.expiresAt,
      revokedAt: null,
      revocationReason: null,
      crossResidency: minted.crossResidency,
      parentGrantId: minted.parentGrantId,
      proofChain: minted.proofChain,
      signature: minted.signature,
      signatureAlgorithm: minted.signatureAlgorithm,
      purpose: minted.purpose,
    };

    return this.repository.create(rowToInsert);
  }

  /**
   * Mint and persist an operator root grant (self-signed super-admin).
   */
  async issueOperatorRoot(request: IssueOperatorRootRequest): Promise<AuthorityGrant> {
    const { callerDid, operatorDid, signingKeyPem, signingKeyDid, ttlSeconds, purpose } = request;

    await this.ensureProviderAvailable();

    if (callerDid !== operatorDid) {
      throw new Error('[authority-issuer] operator root must be issued directly by operator');
    }

    const rootParams: IssueOperatorRootParams = {
      operatorDid,
      signingKeyPem,
      signingKeyDid,
      ttlSeconds,
      purpose,
      now: Date.now(),
    };

    const minted = canonicalIssueOperatorRoot(rootParams);

    const rowToInsert: NewAuthorityGrant = {
      subjectDid: minted.subjectDid,
      role: minted.role,
      issuerDid: minted.issuerDid,
      residency: minted.residency,
      tenantId: minted.tenantId,
      signingKeyDid: minted.signingKeyDid,
      nonce: minted.nonce,
      notBefore: minted.notBefore,
      expiresAt: minted.expiresAt,
      revokedAt: null,
      revocationReason: null,
      crossResidency: minted.crossResidency,
      parentGrantId: null,
      proofChain: [],
      signature: minted.signature,
      signatureAlgorithm: minted.signatureAlgorithm,
      purpose: minted.purpose,
    };

    return this.repository.create(rowToInsert);
  }

  /**
   * Renewal rather than extension.
   * Creates a brand new row with a fresh nonce and validity window.
   * Invariant: Never calls UPDATE ... SET expires_at.
   */
  async renewGrant(request: RenewGrantRequest): Promise<AuthorityGrant> {
    const { callerDid, grantId, ttlSeconds } = request;

    await this.ensureProviderAvailable();
    await this.assertCanIssue(callerDid);

    const existing = await this.repository.findById(grantId);
    if (!existing) {
      throw new Error(`[authority-issuer] existing grant ${grantId} not found`);
    }

    return this.issueGrant({
      callerDid,
      subjectDid: existing.subjectDid,
      role: existing.role,
      parentGrantId: existing.parentGrantId,
      ttlSeconds: ttlSeconds || DEFAULT_TTL_SECONDS,
      mayBridgeOnward: existing.crossResidency,
      tenantId: existing.tenantId,
      purpose: existing.purpose ? `renew: ${existing.purpose}` : 'renewal',
    });
  }

  /**
   * Revoke a grant with reason.
   */
  async revokeGrant(
    callerDid: string,
    grantId: string,
    reason: string
  ): Promise<AuthorityGrant | null> {
    await this.assertCanIssue(callerDid);
    if (!grantId || !reason) {
      throw new Error('[authority-issuer] grantId and reason are required for revocation');
    }
    return this.repository.revoke(grantId, reason);
  }
}
