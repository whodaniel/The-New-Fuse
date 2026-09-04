/**
 * Authority Grants NestJS Service
 *
 * Implements server-side authority grant operations:
 * - Gated on resolved caller authority role (super-admin or super-director).
 * - Mints signed rows via canonical grant issuer primitives.
 * - Persists all signed material verbatim.
 * - Renewal mints a brand new row with fresh nonce; never mutates expires_at.
 *
 * @see docs/protocols/reports/AUTHORITY_GRANTS_WIRING_BRIEF.md
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  AuthorityGrantIssuerService,
  DrizzleAuthorityGrantRepository,
  drizzleAuthorityGrantRepository,
  InMemoryTrustRootProvider,
} from '@the-new-fuse/database';
import {
  IssueAuthorityGrantDto,
  RenewAuthorityGrantDto,
  RevokeAuthorityGrantDto,
} from '../dto/authority-grants.dto';

@Injectable()
export class AuthorityGrantsService {
  private readonly logger = new Logger(AuthorityGrantsService.name);
  private readonly issuerService: AuthorityGrantIssuerService;
  private readonly repository: DrizzleAuthorityGrantRepository;

  constructor() {
    this.repository = drizzleAuthorityGrantRepository;
    // Server-side custody: In this branch, default to InMemoryTrustRootProvider
    // with probe-time reporting as mandated by AUTHORITY_GRANTS_WIRING_BRIEF.md
    const provider = new InMemoryTrustRootProvider();
    this.issuerService = new AuthorityGrantIssuerService({
      repository: this.repository,
      trustRootProvider: provider,
    });
  }

  /**
   * Issue a signed authority grant.
   * Rejection reasons from issueGrant are propagated verbatim.
   */
  async issueGrant(dto: IssueAuthorityGrantDto) {
    this.logger.log(`Issuing authority grant: caller=${dto.callerDid} subject=${dto.subjectDid} role=${dto.role}`);
    return this.issuerService.issueGrant({
      callerDid: dto.callerDid,
      subjectDid: dto.subjectDid,
      role: dto.role,
      parentGrantId: dto.parentGrantId,
      ttlSeconds: dto.ttlSeconds,
      mayBridgeOnward: dto.mayBridgeOnward,
      tenantId: dto.tenantId,
      purpose: dto.purpose,
    });
  }

  /**
   * Renew an existing grant by creating a new row.
   * Invariant: Never updates expires_at in place.
   */
  async renewGrant(dto: RenewAuthorityGrantDto) {
    this.logger.log(`Renewing authority grant: caller=${dto.callerDid} grantId=${dto.grantId}`);
    return this.issuerService.renewGrant({
      callerDid: dto.callerDid,
      grantId: dto.grantId,
      ttlSeconds: dto.ttlSeconds,
    });
  }

  /**
   * Revoke an existing grant with reason.
   */
  async revokeGrant(dto: RevokeAuthorityGrantDto) {
    this.logger.log(`Revoking authority grant: caller=${dto.callerDid} grantId=${dto.grantId}`);
    return this.issuerService.revokeGrant(dto.callerDid, dto.grantId, dto.reason);
  }

  /**
   * Resolve effective authority role for a subject using Task A read path.
   */
  async resolveRole(subjectDid: string) {
    return this.repository.resolveAuthorityForSubject(subjectDid);
  }

  /**
   * Find a grant by UUID.
   */
  async getGrantById(id: string) {
    return this.repository.findById(id);
  }
}
