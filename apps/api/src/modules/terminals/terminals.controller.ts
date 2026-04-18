import { Controller, ForbiddenException, Get, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { hasAuthorizationLevel } from '../../auth/auth-policy.js';
import { AuthLevel, RequireAuthLevel } from '../../guards/secure-auth.guard.js';
import { TerminalGraphQueryDto } from './dto/terminal-graph-query.dto.js';
import { TerminalsService } from './terminals.service.js';

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
      user?: {
        id?: string;
        email?: string | null;
        role?: string | null;
        roles?: unknown;
        permissions?: unknown;
      };
    }
  ) {
    if (query.includeCommands === true && !hasAuthorizationLevel(req.user || {}, 'admin')) {
      throw new ForbiddenException(
        'includeCommands=true requires admin or system authorization level'
      );
    }
    return this.terminalsService.getTerminalGraph(query);
  }
}
