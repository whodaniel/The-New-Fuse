import { Controller, ForbiddenException, Get, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { hasAuthorizationLevel } from '../../auth/auth-policy';
import { AuthLevel, RequireAuthLevel } from '../../guards/secure-auth.guard';
import { LocalRuntimeService } from './local-runtime.service';

@ApiTags('local-runtime')
@Controller('local-runtime')
@RequireAuthLevel(AuthLevel.USER)
export class LocalRuntimeController {
  constructor(private readonly localRuntimeService: LocalRuntimeService) {}

  @Get('goals')
  @ApiOperation({ summary: 'Local CLI goals from ~/.tnf/goals/goals.json' })
  @ApiOkResponse({ description: 'Local goals list; {available:false} when the file is absent.' })
  async getGoals() {
    return this.localRuntimeService.getGoals();
  }

  @Get('cron')
  @ApiOperation({ summary: "Scheduled jobs from the operator's crontab" })
  @ApiOkResponse({
    description: 'Parsed crontab entries with human schedule and next fire time.',
  })
  async getCron() {
    return this.localRuntimeService.getCron();
  }

  @Get('terminal-mirror')
  @ApiOperation({
    summary: 'Spatial snapshot of local terminal agent windows (bounds, busy state, agents)',
  })
  @ApiOkResponse({
    description: 'Terminal windows with screen bounds from the heartbeat pulse state file.',
  })
  async getTerminalMirror(
    @Query('includeContents') includeContents: string | undefined,
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
    const wantsContents = includeContents === 'true';
    if (wantsContents && !hasAuthorizationLevel(req.user || {}, 'admin')) {
      throw new ForbiddenException(
        'includeContents=true requires admin or system authorization level'
      );
    }
    return this.localRuntimeService.getTerminalMirror({ includeContents: wantsContents });
  }

  @Get('summary')
  @ApiOperation({ summary: 'One-shot Mission Control payload: goals + cron + terminal mirror' })
  @ApiOkResponse({ description: 'Combined landing payload for the Mission Control surface.' })
  async getSummary() {
    return this.localRuntimeService.getSummary();
  }
}
