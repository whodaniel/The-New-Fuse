import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';

/**
 * TNF Hosted Spaces module — Phase 1 (Core Runtime: CRUD for spaces + routes)
 * of docs/TNF_HOSTED_SPACES_ARCHITECTURE.md. Closes the P0 "no zo.space
 * equivalent" gap tracked in docs/CTO_FEATURE_PARITY_MATRIX.md.
 *
 * Not yet implemented (Phase 2/3): the Bun/Hono per-space runtime that
 * actually serves route code over HTTP, multi-tenant subdomain routing,
 * SSL/custom domains, and the `tnf spaces` CLI surface.
 */
@Module({
  controllers: [SpacesController],
  providers: [SpacesService],
  exports: [SpacesService],
})
export class SpacesModule {}
