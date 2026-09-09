import { Controller, ForbiddenException, Get, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { hasAuthorizationLevel, isPrivilegedUser } from '../../auth/auth-policy';
import { AuthLevel, RequireAuthLevel } from '../../guards/secure-auth.guard';
import { TerminalGraphQueryDto } from './dto/terminal-graph-query.dto';
import { TerminalsService } from './terminals.service';

type TerminalAuthUser = {
  id?: string;
  sub?: string;
  tenantId?: unknown;
  email?: string | null;
  role?: string | null;
  roles?: unknown;
  permissions?: unknown;
};

@ApiTags('terminals')
@Controller('terminals')
@RequireAuthLevel(AuthLevel.USER)
export class TerminalsController {
  constructor(private readonly terminalsService: TerminalsService) {}

  @Get('graph')
  @ApiOperation({
    summary: 'Return a holistic TWIP terminal graph for agent/runtime orchestration',
  })
  @ApiOkResponse({
    description:
      'Graph projection of terminal identities, process/multiplexer relationships, and runtime ownership hints.',
  })
  async getTerminalGraph(
    @Query() query: TerminalGraphQueryDto,
    @Req()
    req: Request & {
      user?: TerminalAuthUser;
    }
  ) {
    const user: TerminalAuthUser = req.user || {};
    const viewerUserId = [user.id, user.sub]
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .find((value) => value.length > 0);
    if (!viewerUserId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    // Multi-tenant hardening: tenantId/userId are forced from the JWT. The
    // query param is only an allowed hint for privileged (admin/system)
    // callers; regular users are always scoped to their authenticated tenant.
    const authenticatedTenantId = this.resolveTenantId(user);
    const hintedTenantId = this.resolveTenantIdHint(query.tenantId);
    let effectiveTenantId: string | undefined;
    if (isPrivilegedUser(user)) {
      effectiveTenantId = hintedTenantId || authenticatedTenantId;
    } else {
      if (!authenticatedTenantId) {
        throw new ForbiddenException(
          'tenantId missing from authenticated token; terminal graph requires a tenant-scoped token'
        );
      }
      if (hintedTenantId && hintedTenantId !== authenticatedTenantId) {
        throw new ForbiddenException('tenantId mismatch with authenticated user tenant scope');
      }
      effectiveTenantId = authenticatedTenantId;
    }

    if (query.includeCommands === true && !hasAuthorizationLevel(user, 'admin')) {
      throw new ForbiddenException(
        'includeCommands=true requires admin or system authorization level'
      );
    }
    return this.terminalsService.getTerminalGraph(
      { ...query, tenantId: effectiveTenantId },
      { viewerUserId }
    );
  }

  private resolveTenantId(user: TerminalAuthUser): string | undefined {
    const tenantId = user?.tenantId;
    if (typeof tenantId !== 'string') {
      return undefined;
    }
    const normalized = tenantId.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private resolveTenantIdHint(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }
}
